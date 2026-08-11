Легенды Кунг-Фу — PATCH 0.0.76

Исправление загрузки изображений:
- генерация подписанной ссылки перенесена из Yandex Cloud Functions в Supabase Edge Functions;
- сами изображения по-прежнему загружаются в Yandex Object Storage;
- Yandex Cloud Function kungfu-media-presign больше не требуется;
- fallback в Supabase Storage отключен.

SQL не требуется.

Важно: Edge Function в этом проекте развернута под именем hyper-handler; storage-config.js уже настроен на нее.
