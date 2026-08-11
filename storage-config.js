// Легенды Кунг-Фу — публичная конфигурация файлового хранилища.
// Секретных ключей здесь нет: ключи Yandex хранятся в Supabase Edge Function Secrets.
window.KF_STORAGE_CONFIG = {
  provider: 'yandex',

  // Supabase Edge Function hyper-handler проверяет текущего пользователя и выдаёт
  // короткоживущую подписанную POST-ссылку в Yandex Object Storage.
  supabaseEdgeFunction: 'hyper-handler',

  // Старое поле оставлено пустым намеренно: Yandex Cloud Function больше не используется.
  yandexPresignEndpoint: '',

  // Не откатываемся незаметно в Supabase Storage при ошибке.
  fallbackToSupabase: false
};
