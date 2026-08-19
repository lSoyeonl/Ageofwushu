Kungfu Legends — PRODUCTION 0.1.14 COMPACT

Что оптимизировано:
- удалены старые версии organization-data / organization-detail / organization-hub, которые больше не подключаются страницами;
- удалены старые wiki-reader 0.0.86/0.0.87 и неиспользуемые guide-layout файлы;
- удалены старые README патчей и тестовая __layout_test.html;
- изображения школ/сект/фракций в assets/organizations переведены из PNG в WebP высокого качества;
- эмодзи/смайлы НЕ изменялись: папка smiles и файл smiles-pack-0.0.80.js сохранены побайтно;
- музыка, логотипы, фонари, QR, аватары и основные фоны не перекодировались.

ВАЖНО ПРИ ЗАЛИВКЕ В GITHUB:
1. Не удаляйте текущий supabase-config.js из репозитория. В production-архив он намеренно не включён.
2. Не меняйте Supabase project URL / anon key, если хотите сохранить существующие логины и контент.
3. Таблицы Supabase, Auth Users и RLS-политики не находятся в GitHub и не удаляются при замене файлов сайта.
4. Перед очисткой репозитория сделайте Download ZIP текущей версии как резервную копию.

Сохранены SQL-файлы:
- SUPABASE_RLS_FIX_0.1.12.sql
- SUPABASE_MODERATOR_0.0.81.sql
