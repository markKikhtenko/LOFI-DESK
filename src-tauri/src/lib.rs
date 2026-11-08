use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use lofty::{file::TaggedFileExt, prelude::{Accessor, AudioFile}, probe::Probe};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{path::{Path, PathBuf}, time::Duration};
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};
use walkdir::WalkDir;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct Track {
    id: String,
    path: String,
    title: String,
    artist: String,
    album: String,
    duration: f64,
    track_number: Option<u32>,
    year: Option<u32>,
    cover: Option<String>,
}

#[derive(Debug, Serialize)]
struct ScannedLibrary {
    folder: String,
    tracks: Vec<Track>,
    skipped: usize,
}

fn stable_id(path: &Path) -> String {
    let normalized = path.to_string_lossy().to_lowercase();
    let digest = Sha256::digest(normalized.as_bytes());
    format!("{:x}", digest)
}

fn picture_data_url(tagged: &lofty::file::TaggedFile) -> Option<String> {
    let picture = tagged
        .primary_tag()
        .or_else(|| tagged.first_tag())?
        .pictures()
        .first()?;
    if picture.data().len() > 5_000_000 {
        return None;
    }
    let mime = picture
        .mime_type()
        .map(ToString::to_string)
        .unwrap_or_else(|| "image/jpeg".to_string());
    Some(format!("data:{mime};base64,{}", BASE64.encode(picture.data())))
}

fn read_track(path: &Path) -> Result<Track, String> {
    let tagged = Probe::open(path)
        .map_err(|error| error.to_string())?
        .read()
        .map_err(|error| error.to_string())?;
    let tag = tagged.primary_tag().or_else(|| tagged.first_tag());
    let fallback_title = path.file_stem().and_then(|value| value.to_str()).unwrap_or("Без названия");
    let title = tag.and_then(Accessor::title).map(|value| value.to_string()).filter(|value| !value.trim().is_empty()).unwrap_or_else(|| fallback_title.to_string());
    let artist = tag.and_then(Accessor::artist).map(|value| value.to_string()).filter(|value| !value.trim().is_empty()).unwrap_or_else(|| "Неизвестный исполнитель".to_string());
    let album = tag.and_then(Accessor::album).map(|value| value.to_string()).filter(|value| !value.trim().is_empty()).unwrap_or_else(|| "Без альбома".to_string());

    Ok(Track {
        id: stable_id(path),
        path: path.to_string_lossy().to_string(),
        title,
        artist,
        album,
        duration: tagged.properties().duration().as_secs_f64(),
        track_number: tag.and_then(Accessor::track),
        year: tag.and_then(Accessor::year),
        cover: picture_data_url(&tagged),
    })
}

#[tauri::command]
fn grant_media_scope(app: tauri::AppHandle, folder: String) -> Result<(), String> {
    let path = PathBuf::from(folder);
    if !path.is_dir() {
        return Err("Выбранная папка больше не существует.".to_string());
    }
    app.asset_protocol_scope()
        .allow_directory(&path, true)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn scan_music_folder(folder: String) -> Result<ScannedLibrary, String> {
    let root = PathBuf::from(&folder);
    if !root.is_dir() {
        return Err("Папка не найдена или недоступна.".to_string());
    }
    let supported = ["mp3", "flac", "wav", "ogg"];
    let mut tracks = Vec::new();
    let mut skipped = 0;

    for entry in WalkDir::new(&root).follow_links(false).into_iter().filter_map(Result::ok) {
        if !entry.file_type().is_file() {
            continue;
        }
        let extension = entry.path().extension().and_then(|value| value.to_str()).unwrap_or("").to_lowercase();
        if !supported.contains(&extension.as_str()) {
            continue;
        }
        match read_track(entry.path()) {
            Ok(track) => tracks.push(track),
            Err(_) => skipped += 1,
        }
    }
    tracks.sort_by(|left, right| {
        left.artist.to_lowercase().cmp(&right.artist.to_lowercase())
            .then(left.album.to_lowercase().cmp(&right.album.to_lowercase()))
            .then(left.track_number.cmp(&right.track_number))
            .then(left.title.to_lowercase().cmp(&right.title.to_lowercase()))
    });
    Ok(ScannedLibrary { folder, tracks, skipped })
}

fn metadata_from_value(value: &serde_json::Value) -> Option<String> {
    let item = value.as_array().and_then(|items| items.first())
        .or_else(|| value.get("songs").and_then(|songs| songs.as_array()).and_then(|items| items.first()))
        .unwrap_or(value);
    let title = item.get("title").or_else(|| item.get("song")).and_then(|field| field.as_str()).unwrap_or("").trim();
    let artist = item.get("artist").and_then(|field| field.as_str()).unwrap_or("").trim();
    match (artist.is_empty(), title.is_empty()) {
        (false, false) => Some(format!("{artist} — {title}")),
        (true, false) => Some(title.to_string()),
        _ => None,
    }
}

#[tauri::command]
async fn fetch_station_metadata(url: String) -> Result<Option<String>, String> {
    if !url.starts_with("https://somafm.com/") {
        return Ok(None);
    }
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(8))
        .user_agent("LOFI-DESK/0.1.0")
        .build()
        .map_err(|error| error.to_string())?;
    let response = client.get(url).send().await.map_err(|error| error.to_string())?;
    if !response.status().is_success() {
        return Ok(None);
    }
    let value = response.json::<serde_json::Value>().await.map_err(|error| error.to_string())?;
    Ok(metadata_from_value(&value))
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            grant_media_scope,
            scan_music_folder,
            fetch_station_metadata,
        ])
        .setup(|app| {
            let show = MenuItemBuilder::with_id("show", "Открыть LOFI DESK").build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "Выйти").build(app)?;
            let menu = MenuBuilder::new(app).items(&[&show, &quit]).build()?;
            let icon = app.default_window_icon().cloned().expect("app icon is configured");
            TrayIconBuilder::with_id("main-tray")
                .icon(icon)
                .tooltip("LOFI DESK")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_main_window(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                        show_main_window(tray.app_handle());
                    }
                })
                .build(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running LOFI DESK");
}

#[cfg(test)]
mod tests {
    use super::metadata_from_value;
    use serde_json::json;

    #[test]
    fn extracts_somafm_song_metadata() {
        let value = json!({ "songs": [{ "artist": "Artist", "title": "Track" }] });
        assert_eq!(metadata_from_value(&value), Some("Artist — Track".to_string()));
    }
}

