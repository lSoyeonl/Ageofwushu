/*
  Легенды Кунг-Фу 0.0.48 — подключение GitHub Pages к Supabase.

  Вставьте данные из Supabase Dashboard → Connect / Settings → API Keys.
  Для браузера используйте ТОЛЬКО Publishable key (sb_publishable_...)
  либо legacy anon key. Secret/service_role ключ здесь хранить нельзя.
*/
window.KF_SUPABASE_CONFIG = {
  url: "https://YOUR_PROJECT_ID.supabase.co",
  publishableKey: "YOUR_SUPABASE_PUBLISHABLE_KEY",
  adminEmail: "YOUR_ADMIN_EMAIL@example.com",
  storageBucket: "site-images"
};
