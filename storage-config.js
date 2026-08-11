// Легенды Кунг-Фу — публичная конфигурация файлового хранилища.
// Этот файл можно хранить в GitHub: секретных ключей здесь быть НЕ должно.
window.KF_STORAGE_CONFIG = {
  // auto: использовать Yandex Object Storage, если указан yandexPresignEndpoint; иначе Supabase Storage.
  // yandex: требовать Yandex Object Storage и не публиковать изображение при ошибке.
  // supabase: использовать только Supabase Storage.
  provider: 'yandex',

  // HTTPS-адрес публичной Yandex Cloud Function, которая выдаёт короткоживущую
  // подписанную ссылку PUT для загрузки в Object Storage.
  // Пример: https://functions.yandexcloud.net/<function-id>
  yandexPresignEndpoint: 'https://functions.yandexcloud.net/d4es493g8kq19keabkh8',

  // Yandex Object Storage включён. Fallback отключён намеренно: если Yandex недоступен,
  // пользователь увидит ошибку, а изображение не будет незаметно сохраняться обратно в Supabase Storage.
  fallbackToSupabase: false
};
