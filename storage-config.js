// Легенды Кунг-Фу — публичная конфигурация файлового хранилища.
// Этот файл можно хранить в GitHub: секретных ключей здесь быть НЕ должно.
window.KF_STORAGE_CONFIG = {
  // auto: использовать Yandex Object Storage, если указан yandexPresignEndpoint; иначе Supabase Storage.
  // yandex: требовать Yandex Object Storage и не публиковать изображение при ошибке.
  // supabase: использовать только Supabase Storage.
  provider: 'auto',

  // HTTPS-адрес публичной Yandex Cloud Function, которая выдаёт короткоживущую
  // подписанную ссылку PUT для загрузки в Object Storage.
  // Пример: https://functions.yandexcloud.net/<function-id>
  yandexPresignEndpoint: '',

  // Пока Yandex Object Storage настраивается, оставляем true. После проверки
  // рекомендуется false, чтобы ошибка нового хранилища не расходовала Supabase Storage незаметно.
  fallbackToSupabase: true
};
