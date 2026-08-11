// Легенды Кунг-Фу — публичная конфигурация файлового хранилища.
// Этот файл можно хранить в GitHub: секретных ключей здесь быть НЕ должно.
window.KF_STORAGE_CONFIG = {
  // auto: использовать R2, если указан r2UploadEndpoint; иначе Supabase Storage.
  // r2: требовать R2 и не публиковать изображение при ошибке R2.
  // supabase: использовать только Supabase Storage.
  provider: 'auto',

  // После создания Cloudflare Worker вставьте сюда адрес вида:
  // https://kungfu-images.<ваш-subdomain>.workers.dev/upload
  r2UploadEndpoint: '',

  // На этапе подключения можно оставить true. После проверки R2 рекомендуется false,
  // чтобы при ошибке R2 сайт не расходовал Supabase Storage незаметно.
  fallbackToSupabase: true
};
