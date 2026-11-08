# Участие в разработке

Спасибо за интерес к LOFI DESK. Для исправления или новой функции создайте отдельную ветку и pull request в `main`.

## Локальная проверка

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

Для запуска desktop-версии нужен Rust stable, Microsoft C++ Build Tools и WebView2:

```powershell
npm run tauri dev
```

Не добавляйте в Git музыкальные файлы, ключи подписи, токены и другие секреты. Изменения пользовательского поведения должны сопровождаться тестом и записью в `CHANGELOG.md`.

