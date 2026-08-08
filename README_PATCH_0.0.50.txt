PATCH 0.0.50 — ТАЙНИКИ: БОССЫ И ОБХОД

Для обновления уже настроенного GitHub Pages загрузите в КОРЕНЬ репозитория только файлы этого patch:
- index.html  (заменить существующий)
- hideouts.html  (новый файл)
- VERSION.txt  (заменить существующий)
- CHANGELOG_0.0.50.txt
- PREDEPLOY_REPORT_0.0.50.txt

ВАЖНО:
- supabase-config.js этим патчем НЕ заменяется. Ваш Project URL / Publishable key останутся прежними.
- SQL Editor в Supabase для 0.0.50 запускать не нужно. Новые данные используют уже существующие site_store и content_reactions.
- Папка smiles уже должна быть в репозитории для реакций.

После Commit подождите публикацию GitHub Pages и обновите страницу Ctrl+F5 / очистите кэш мобильного браузера при необходимости.
