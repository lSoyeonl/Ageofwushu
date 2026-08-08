# Легенды Кунг-Фу 0.0.48 — GitHub Pages + Supabase

Эта версия возвращает сайт к схеме:

- **GitHub Pages** — HTML/CSS/JS и версии исходников сайта.
- **Supabase Auth** — пользователи и вход с одного аккаунта на телефоне/ПК.
- **Supabase Postgres** — весь динамический контент.
- **Supabase Storage** — изображения.
- **Supabase Realtime** — обновление общего контента.
- Локальные IndexedDB/localStorage fallback-хранилища для контента отключены. localStorage используется только как браузерный cache/сессия, а источником данных является Supabase.

---

## 1. Создать проект Supabase

1. Откройте https://supabase.com/
2. Войдите / создайте аккаунт.
3. Нажмите **New project**.
4. Выберите организацию.
5. Задайте:
   - Project name
   - сильный Database password
   - регион
6. Дождитесь создания проекта.

Пароль базы сохраните отдельно.

---

## 2. Создать таблицы и Storage

1. В Supabase слева откройте **SQL Editor**.
2. Нажмите **New query**.
3. Откройте файл `supabase-schema.sql` из этой сборки.
4. Скопируйте его целиком в SQL Editor.
5. Нажмите **Run**.

Скрипт создаст:
- `public.profiles` — приватные данные профиля + `avatar_url`;
- `public.public_profiles` — безопасные публичные никнеймы и аватары для форума;
- `public.site_store` — общий контент;
- `public.content_reactions` — реакции;
- RLS-политики;
- защищённую функцию `update_my_avatar()` — пользователь может менять только свой аватар, но не роль;
- public Storage bucket `site-images`;
- Realtime для общего контента;
- triggers создания и синхронизации профилей после регистрации.

---

## 3. Получить данные подключения

В Dashboard проекта нажмите **Connect** либо откройте **Settings → API Keys**.

Нужны только:

1. **Project URL**
   Пример:
   `https://abcdefgh.supabase.co`

2. **Publishable key**
   Новый формат обычно начинается с:
   `sb_publishable_...`

Для браузерного сайта это публичный клиентский ключ.

### НИКОГДА не помещайте в GitHub Pages:
- Secret key
- `service_role`
- Database password
- Personal Access Token Supabase

---

## 4. Заполнить `supabase-config.js`

В репозитории GitHub откройте:

`supabase-config.js`

Замените:

```js
window.KF_SUPABASE_CONFIG = {
  url: "https://YOUR_PROJECT_ID.supabase.co",
  publishableKey: "YOUR_SUPABASE_PUBLISHABLE_KEY",
  adminEmail: "YOUR_ADMIN_EMAIL@example.com",
  storageBucket: "site-images"
};
```

на реальные значения вашего проекта.

Например:

```js
window.KF_SUPABASE_CONFIG = {
  url: "https://abcdefgh.supabase.co",
  publishableKey: "sb_publishable_xxxxxxxxx",
  adminEmail: "admin@example.com",
  storageBucket: "site-images"
};
```

Publishable key можно хранить в публичном GitHub Pages. Безопасность обеспечивает RLS, а не скрытие publishable key.

---

## 5. Настроить адрес GitHub Pages в Supabase Auth

Предположим сайт будет:

`https://USERNAME.github.io/REPOSITORY/`

В Supabase откройте настройки Auth URL Configuration и укажите:

**Site URL**
`https://USERNAME.github.io/REPOSITORY/`

В Redirect URLs добавьте:

`https://USERNAME.github.io/REPOSITORY/account.html`

Если используете собственный домен — добавьте его аналогично.

---

## 6. Создать администратора

### Вариант проще

1. После настройки откройте опубликованный сайт.
2. Зарегистрируйте аккаунт на e-mail администратора.
3. Если включено подтверждение e-mail — подтвердите письмо.
4. В Supabase откройте **SQL Editor** и выполните:

```sql
update public.profiles
set role = 'admin'
where email = 'ВАШ_EMAIL';
```

5. В `supabase-config.js` в `adminEmail` должен быть тот же e-mail.

После этого на странице `admin-login.html` можно вводить:
- логин: `admin`
- пароль: пароль этого Supabase-аккаунта

Либо вместо `admin` можно вводить сам e-mail.

---

## 7. Выложить сайт на GitHub Pages

Загрузите **содержимое** папки версии 0.0.48 в корень репозитория.

В GitHub:

1. Откройте репозиторий.
2. **Settings**
3. **Pages**
4. **Build and deployment**
5. Source: **Deploy from a branch**
6. Branch: `main`
7. Folder: `/(root)`
8. **Save**

Файл `.nojekyll` уже присутствует.

После публикации GitHub покажет адрес сайта.

---

# Как GitHub связан с Supabase

Для обычной работы сайта специальная кнопка «связать GitHub с Supabase» НЕ обязательна.

Связь выглядит так:

```text
GitHub Pages
   │
   │ загружает HTML / CSS / JS
   ▼
Браузер пользователя
   │
   │ Project URL + Publishable key
   ▼
Supabase
   ├─ Auth
   ├─ Database
   ├─ Storage
   └─ Realtime
```

То есть `supabase-config.js` и является подключением сайта к нужному Supabase-проекту.

Когда вы меняете HTML на GitHub — меняется программа сайта.

Когда пользователь регистрируется или администратор публикует материал — GitHub не меняется. Данные сразу записываются в Supabase.

Поэтому обновление версии сайта на GitHub не удаляет пользователей и контент, если новая версия подключена к тому же Supabase project URL.

---

# Нужно ли включать GitHub Integration внутри Supabase?

Для работы текущего сайта — **нет**.

Supabase GitHub Integration полезна, если позже вы хотите хранить SQL migrations / Edge Functions в репозитории и автоматически применять их при push/merge.

По официальной схеме она находится:

**Supabase Dashboard → Project Settings → Integrations → GitHub Integration**

После Authorize GitHub можно выбрать репозиторий.

Для простого статического GitHub Pages сайта достаточно `supabase-config.js` + выполненного `supabase-schema.sql`.

---

# Резервные копии: важно понимать разницу

## GitHub = backup кода сайта

GitHub хранит:
- `index.html`
- JS/CSS
- страницы
- `supabase-schema.sql`
- историю коммитов

Откат GitHub возвращает старую **версию программы**, но не меняет текущую базу Supabase.

## Supabase = backup живых данных

Supabase хранит:
- Auth-пользователей
- хэши паролей
- профили
- контент
- реакции
- метаданные Storage.

В админке сайта `admin-backups.html` есть дополнительный JSON-export контента.

Он удобен для ручного восстановления `site_store`/реакций, но не является полным backup Auth.

Для полного восстановления Auth-пользователей используйте Database Backup Supabase / database dump.

### Картинки — отдельный момент

Database Backup Supabase не содержит сами бинарные файлы Storage. В базе находятся метаданные Storage, а сами объекты хранятся отдельно.

Поэтому для действительно полного аварийного плана нужно иметь:
1. резервную копию Postgres/Auth;
2. отдельную копию файлов bucket `site-images`.

---

# Что будет при загрузке новой версии сайта

Пример:

```text
GitHub:
0.0.48 → 0.0.48

Supabase:
тот же Project URL
```

В таком случае остаются:
- все пользователи;
- прежние пароли;
- форум;
- публикации;
- объявления;
- реакции;
- изображения.

Новая версия сайта просто читает те же данные.

Если структура базы в новой версии изменится, сначала должна быть выполнена совместимая SQL migration.


---

# Опционально: связать репозиторий с Supabase GitHub Integration

В этой сборке уже добавлены:

```text
supabase/
  config.toml
  migrations/
    20260808111700_kungfu_schema.sql
```

Поэтому, если хотите, чтобы будущие SQL migrations применялись из GitHub:

1. Supabase Dashboard → **Project Settings → Integrations**.
2. Найдите **GitHub Integration**.
3. Нажмите **Authorize GitHub**.
4. Разрешите доступ к нужному репозиторию.
5. Выберите ваш репозиторий.
6. **Working directory:** `.`
7. Для production можно включить **Deploy to production**.
8. После этого migrations из `supabase/migrations/` могут применяться при изменениях production-ветки.

Это НЕ заменяет GitHub Pages. Интеграция Supabase занимается схемой базы / migrations / функциями, а GitHub Pages продолжает публиковать HTML/CSS/JS.


---

# Аватары пользователей в 0.0.48

В таблице `profiles` добавлено поле `avatar_url`.

Также создаётся безопасная публичная таблица `public_profiles`, в которой находятся только:
- ID пользователя;
- никнейм;
- URL аватара.

E-mail и другие приватные поля туда не попадают.

Пользователь меняет собственный аватар через защищённую SQL-функцию `update_my_avatar()`.
Пользователь не получает права менять поле `role`, поэтому через клиентский код нельзя назначить себе администратора.

Аватары загружаются в bucket `site-images` и отображаются:
- в разделе «Аккаунт»;
- рядом с ником автора темы;
- рядом с ником автора ответа на форуме;
- рядом с пользователем в форме ответа.

Если проект создаётся заново — просто выполните актуальный `supabase-schema.sql` целиком.
