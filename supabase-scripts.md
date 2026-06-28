# Список скпритов запущенных в supabase SQL Editor

## Главнвый
```sql
-- ============================================
-- 1. Создание таблиц
-- ============================================

-- Доски
create table boards (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now()
);

-- Участники доски
create table board_members (
  id        uuid primary key default gen_random_uuid(),
  board_id  uuid not null references boards(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  unique(board_id, user_id)
);

-- Колонки
create table columns (
  id        uuid primary key default gen_random_uuid(),
  board_id  uuid not null references boards(id) on delete cascade,
  title     text not null,
  position  integer not null default 0
);

-- Задачи
create table tasks (
  id          uuid primary key default gen_random_uuid(),
  column_id   uuid not null references columns(id) on delete cascade,
  title       text not null,
  description text,
  priority    text default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date    date,
  assignee_id uuid references auth.users(id),
  position    integer not null default 0,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz default now()
);

-- Комментарии
create table comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tasks(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  content    text not null,
  created_at timestamptz default now()
);

-- Профили пользователей (дополнительная таблица, связанная с auth.users)
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  avatar_url text
);

-- ============================================
-- 2. Включение RLS для всех таблиц
-- ============================================

alter table boards enable row level security;
alter table board_members enable row level security;
alter table columns enable row level security;
alter table tasks enable row level security;
alter table comments enable row level security;
alter table profiles enable row level security;

-- ============================================
-- 3. Создание политик доступа (примеры)
-- ============================================

-- Политики для таблицы boards
-- Пользователь видит только те доски, в которых он участник
create policy "Users can view their boards"
  on boards for select
  using (
    id in (select board_id from board_members where user_id = auth.uid())
  );

-- Только владелец может удалить доску
create policy "Owner can delete board"
  on boards for delete
  using (owner_id = auth.uid());

-- Владелец может обновлять свою доску
create policy "Owner can update board"
  on boards for update
  using (owner_id = auth.uid());

-- Владелец может вставлять новую доску (автоматически становится участником)
create policy "Users can insert boards"
  on boards for insert
  with check (auth.uid() = owner_id);

-- Политики для board_members (чтобы пользователи видели только свои членства)
create policy "Users can view board members"
  on board_members for select
  using (
    board_id in (select board_id from board_members where user_id = auth.uid())
  );

-- Пользователь может добавить себя в доску (если он уже есть, уникальность помешает)
create policy "Users can insert themselves"
  on board_members for insert
  with check (auth.uid() = user_id);

-- Политики для columns, tasks, comments – аналогично, ограничиваем доступ к данным
-- Например, видеть колонки только тех досок, где пользователь участник:
create policy "Users can view columns of their boards"
  on columns for select
  using (
    board_id in (
      select board_id from board_members where user_id = auth.uid()
    )
  );

-- Вставлять колонки может только владелец доски (или участник с правами owner)
-- Здесь можно уточнить роль, но для простоты разрешим всем участникам вставлять:
create policy "Board members can insert columns"
  on columns for insert
  with check (
    board_id in (
      select board_id from board_members where user_id = auth.uid()
    )
  );

-- Аналогично для tasks
create policy "Users can view tasks of their boards"
  on tasks for select
  using (
    column_id in (
      select id from columns where board_id in (
        select board_id from board_members where user_id = auth.uid()
      )
    )
  );

-- Для комментариев – видеть могут все участники доски, к которой относится задача
create policy "Users can view comments"
  on comments for select
  using (
    task_id in (
      select id from tasks where column_id in (
        select id from columns where board_id in (
          select board_id from board_members where user_id = auth.uid()
        )
      )
    )
  );

-- Политики для profiles – пользователь видит только свой профиль (или все, если нужно)
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

```


## Тригер 1 : Автоматическое создание профиля при регистрации
```sql
-- Функция, которая будет вызываться при вставке в auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Триггер на таблицу auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```
