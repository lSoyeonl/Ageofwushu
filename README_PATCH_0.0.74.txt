Легенды Кунг-Фу — HOTFIX 0.0.74

Причина ошибки 403:
Yandex Cloud Functions удаляет HTTP-заголовок Authorization до передачи запроса коду функции.
Сайт 0.0.73 передавал Supabase access token именно в Authorization, поэтому функция не могла корректно получить пользовательскую сессию.

Исправление:
- Supabase access token передаётся в X-KF-Session.
- HTML-ссылки на supabase-sync.js обновлены до ?v=0.0.74 для сброса кэша.
- Нужно также развернуть новую версию Cloud Function из отдельного ZIP 0.0.74.

SQL не требуется.
Секретные ключи в GitHub не добавляются.
