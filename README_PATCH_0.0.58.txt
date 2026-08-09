ПАТЧ 0.0.58 — DISCORD + ИСПРАВЛЕНИЯ

ШАГ 1 — GITHUB
Распакуйте ZIP и загрузите всё содержимое в корень репозитория Ageofwushu с заменой файлов.
Патч НЕ содержит supabase-config.js — ваши рабочие ключи не затрагиваются.

ШАГ 2 — ОПИСАНИЕ ПРОФИЛЯ
Supabase → SQL Editor → New query.
Вставьте ТОЛЬКО содержимое SUPABASE_PROFILE_BIO_0.0.58.sql → Run.
Ожидаемый результат: Success. No rows returned. Выполняется один раз.

ШАГ 3 — DISCORD EDGE FUNCTION
Supabase → Edge Functions → New/Create Function.
Имя функции: discord-publish
Вставьте содержимое SUPABASE_EDGE_DISCORD_PUBLISH_0.0.58.ts в index.ts → Deploy.

ШАГ 4 — WEBHOOK SECRET
В Supabase Edge Functions / Secrets создайте:
DISCORD_WEBHOOK_URL = ваш полный URL Discord Webhook
Не вставляйте webhook URL в GitHub, HTML или supabase-config.js.

ШАГ 5 — ТЕСТ
На сайте войдите как admin → Аккаунт → Резервные копии.
В блоке Discord нажмите «Отправить тест».
Если сообщение пришло — включите «Отправлять новые публикации в Discord» → «Сохранить».

0.0.58 также исправляет:
- выравнивание «Добавить тип» в Обновлениях;
- мобильную шапку Аккаунта;
- редактирование bio и дату регистрации;
- права редактирования/удаления Артефактов только админу;
- «Описание» + «Как вступить?» в Школах/Силах/Сектах;
- 4 карточки Игроков в строку на ПК.
