import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';

const executable = process.env.LOFI_DESK_EXE ?? resolve('src-tauri/target/release/lofi-desk.exe');
const debugPort = 9223;
const endpoint = `http://127.0.0.1:${debugPort}`;
const fixtureDirectory = await mkdtemp(join(tmpdir(), 'lofi-desk-smoke-'));
const fixturePath = join(fixtureDirectory, 'smoke-test.wav');

function createSilentWav(seconds = 4, sampleRate = 8_000) {
  const samples = seconds * sampleRate;
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

async function waitForCdp() {
  let lastError;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${endpoint}/json/version`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`WebView2 debugging endpoint did not start: ${String(lastError)}`);
}

await writeFile(fixturePath, createSilentWav());
const app = spawn(executable, [], {
  env: {
    ...process.env,
    WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${debugPort}`,
  },
  stdio: 'ignore',
});

let browser;
try {
  await waitForCdp();
  browser = await chromium.connectOverCDP(endpoint);
  const pages = browser.contexts().flatMap((context) => context.pages());
  const page = pages.find((candidate) => candidate.url().startsWith('tauri://')) ?? pages[0];
  if (!page) throw new Error('Tauri WebView page was not found.');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => document.title === 'LOFI DESK', undefined, { timeout: 10_000 });
  if ((await page.title()) !== 'LOFI DESK') throw new Error(`Unexpected title: ${await page.title()}`);

  await page.screenshot({ path: 'docs/screenshots/home.png' });

  const scan = await page.evaluate(async (folder) => {
    const internals = window.__TAURI_INTERNALS__;
    if (!internals?.invoke) throw new Error('Tauri invoke bridge is unavailable.');
    await internals.invoke('grant_media_scope', { folder });
    return internals.invoke('scan_music_folder', { folder });
  }, fixtureDirectory);
  if (!scan || scan.tracks?.length !== 1 || scan.tracks[0]?.duration < 3.5) {
    throw new Error(`Unexpected scan result: ${JSON.stringify(scan)}`);
  }

  await page.addInitScript(() => {
    const originalPlay = HTMLMediaElement.prototype.play;
    window.__lofiSmoke = { playCalls: 0, playing: false };
    HTMLMediaElement.prototype.play = function play() {
      window.__lofiSmoke.playCalls += 1;
      this.addEventListener('playing', () => { window.__lofiSmoke.playing = true; }, { once: true });
      return originalPlay.call(this);
    };
  });
  await page.evaluate(({ folder, tracks }) => {
    localStorage.setItem('lofi-desk-state-v1', JSON.stringify({
      state: {
        folders: [folder], tracks, queue: [], current: null,
        favoriteTrackIds: [], favoriteStationIds: [], playlists: [],
        volume: 0.72, muted: false, shuffle: false, repeat: 'off',
      },
      version: 0,
    }));
  }, { folder: fixtureDirectory, tracks: scan.tracks });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Медиатека' }).click();
  await page.getByText('smoke-test', { exact: true }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Воспроизвести smoke-test' }).click();
  await page.waitForTimeout(600);
  const playback = await page.evaluate(() => window.__lofiSmoke);
  if (!playback?.playCalls || !playback.playing) {
    throw new Error(`Local audio did not reach the playing event: ${JSON.stringify(playback)}`);
  }
  console.log(JSON.stringify({
    desktopWindow: 'ok',
    libraryScan: 'ok',
    scannedTrack: scan.tracks[0].title,
    duration: scan.tracks[0].duration,
    localPlayback: 'playing',
    screenshot: 'docs/screenshots/home.png',
  }, null, 2));
  await page.evaluate(() => localStorage.removeItem('lofi-desk-state-v1'));
} finally {
  await browser?.close().catch(() => undefined);
  app.kill();
  await rm(fixtureDirectory, { recursive: true, force: true });
}
