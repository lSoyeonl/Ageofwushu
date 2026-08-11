Легенды Кунг-Фу — PATCH 0.0.73 (Yandex Object Storage ON)

Что делает патч:
- включает загрузку новых изображений в Yandex Object Storage;
- использует Cloud Function:
  https://functions.yandexcloud.net/d4es493g8kq19keabkh8
- отключает незаметный fallback новых изображений в Supabase Storage;
- аватары обычных пользователей загружаются как community-файлы;
- старые изображения из Supabase Storage продолжают отображаться по старым URL;
- добавлен cache-busting 0.0.73 для storage-config.js и supabase-sync.js.

Установка:
1. Загрузить все файлы патча в корень GitHub репозитория с заменой.
2. Подождать обновления GitHub Pages.
3. Сделать Ctrl+F5.
4. Для проверки загрузить ОДНУ тестовую картинку (лучше в разделе «Обновления» от администратора).
5. Убедиться, что объект появился в bucket kungfu-legends-media в Yandex Object Storage.
6. Проверить URL картинки: он должен начинаться с https://storage.yandexcloud.net/kungfu-legends-media/

SQL не требуется.
Секретные ключи Yandex в GitHub НЕ добавляются.
