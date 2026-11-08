# Выпуск и подпись обновлений

## Один раз для владельца репозитория

1. Сгенерировать пару ключей вне репозитория:

   ```powershell
   npm run tauri signer generate -- --write-keys "$env:USERPROFILE\.lofi-desk-secrets\updater.key"
   ```

2. Поместить содержимое `updater.key` в GitHub Actions Secret `TAURI_SIGNING_PRIVATE_KEY`.
3. Если ключ защищён паролем, поместить пароль в `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`; иначе создать пустой secret не требуется.
4. Публичный ключ из `updater.key.pub` записать в `plugins.updater.pubkey` файла `src-tauri/tauri.conf.json`.

Приватный ключ нельзя коммитить, отправлять в issue или прикладывать к Release. Потеря ключа делает бесшовное обновление существующих установок невозможным.

## Новый выпуск

1. Обновить одну и ту же SemVer-версию в `package.json`, `src-tauri/Cargo.toml` и `src-tauri/tauri.conf.json`.
2. Обновить `CHANGELOG.md`.
3. Убедиться, что CI на `main` зелёный.
4. Создать и отправить тег: `git tag v0.2.0 && git push origin v0.2.0`.
5. Workflow `Release` повторно запускает проверки, собирает NSIS, создаёт `.sig` и `latest.json`, затем публикует GitHub Release.

Workflow намеренно завершается ошибкой до публикации, если secret ключа отсутствует. Установщик пока не подписан сертификатом Windows Authenticode: Tauri-подпись защищает обновления, но не отменяет предупреждение SmartScreen при первой установке.

## Откат и данные

Updater принимает только подписанные артефакты и не меняет пользовательские данные. Настройки, плейлисты и индекс медиатеки сохраняются в профиле WebView2 приложения отдельно от каталога установки. Удаление приложения может оставить эти данные; ручная очистка описана в README.

