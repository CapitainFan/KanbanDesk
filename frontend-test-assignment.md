# Тестовое задание: TaskFlow (Jira-lite)

## О задании

Создать веб-приложение для управления задачами на канбан-досках с realtime-обновлениями.

- **Стек:** React + TypeScript + Supabase

---

## Технологический стек

| Категория        | Технология                                           |
| ---------------- | ---------------------------------------------------- |
| Фреймворк        | React 18+ (Vite)                                     |
| Язык             | TypeScript (strict mode)                             |
| Backend / БД     | Supabase (Postgres, Auth, Realtime, Storage)         |
| Стилизация       | На выбор: CSS Modules, Tailwind CSS, MUI, Ant Design |
| Drag & Drop      | `@dnd-kit/core` или `react-beautiful-dnd`            |
| Роутинг          | React Router v6+                                     |
| State management | На выбор: React Query, Context API                   |

---

## Уровни реализации

Задание разбито на 3 уровня. **MVP — обязательный минимум.** Остальное — по мере возможности.

---

### Уровень 1: MVP (обязательно)

#### 1.1 Аутентификация

- Регистрация по email + пароль (Supabase Auth)
- Вход / выход
- Защита роутов — неавторизованный пользователь перенаправляется на страницу входа

#### 1.2 Доски

- Список моих досок (главная страница после входа)
- Создание доски (название)
- Удаление доски
- Переход на доску

#### 1.3 Колонки

- Доска содержит колонки (например: «To Do», «In Progress», «Done»)
- При создании доски — 3 колонки по умолчанию
- Добавление / удаление колонок
- Переименование колонки

#### 1.4 Задачи (карточки)

- Создание задачи в колонке (название)
- Перемещение задач между колонками **drag-and-drop**
- Изменение порядка задач внутри колонки (drag-and-drop)
- Удаление задачи

#### 1.5 Базовый UI

- Адаптивная вёрстка (desktop + mobile)
- Понятная навигация
- Состояния загрузки (спиннеры / скелетоны)
- Обработка ошибок (показ уведомлений пользователю)

---

### Уровень 2: Полный функционал (рекомендуется)

#### 2.1 Детали задачи

- Открытие задачи в модальном окне или на отдельной странице
- Поля: название, описание (textarea), приоритет (low / medium / high), дедлайн
- Назначение исполнителя (assignee) — выбор из участников доски

#### 2.2 Комментарии

- Список комментариев под задачей
- Добавление / удаление комментария
- Отображение автора и времени

#### 2.3 Realtime

- При открытой доске: автоматическое обновление при изменениях другими пользователями
- Использовать Supabase Realtime (подписка на таблицы `tasks`, `columns`)
- Новые задачи, перемещения, удаления — появляются без перезагрузки

#### 2.4 Совместный доступ

- Приглашение пользователя на доску по email
- Роли: **owner** (полный доступ) / **member** (просмотр + редактирование задач)
- Owner может удалить доску и управлять участниками

#### 2.5 Профиль пользователя

- Страница профиля: имя, аватар
- Отображение аватара в карточках задач и комментариях

---

### Уровень 3: Бонус (по желанию)

- Фильтрация задач (по приоритету, исполнителю, дедлайну)
- Поиск задач по названию
- Лог активности на доске («Иван перенёс задачу X в Done»)
- Прикрепление файлов к задачам (Supabase Storage)
- Тёмная тема (dark mode)
- Google OAuth (вход через Google)
- Горячие клавиши (N — новая задача, Esc — закрыть модалку)

---

## Схема базы данных

Supabase создаёт таблицу `auth.users` автоматически. Остальные таблицы:

```sql
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

-- Комментарии (Уровень 2)
create table comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tasks(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  content    text not null,
  created_at timestamptz default now()
);

-- Профили пользователей
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  avatar_url text
);
```

### RLS (Row Level Security)

```sql
-- Включить RLS для всех таблиц
alter table boards enable row level security;
alter table board_members enable row level security;
alter table columns enable row level security;
alter table tasks enable row level security;
alter table comments enable row level security;
alter table profiles enable row level security;

-- Пример: пользователь видит доски, в которых он участник
create policy "Users can view their boards"
  on boards for select
  using (
    id in (select board_id from board_members where user_id = auth.uid())
  );

-- Пример: только owner может удалить доску
create policy "Owner can delete board"
  on boards for delete
  using (owner_id = auth.uid());
```

> Не обязательно писать все политики — достаточно реализовать базовую защиту: пользователь видит и редактирует только свои доски.

---

## Архитектура приложения

```
src/
├── components/        # UI-компоненты
│   ├── auth/          #   формы входа/регистрации
│   ├── board/         #   доска, колонки, карточки
│   ├── task/          #   детали задачи, комментарии
│   └── shared/        #   кнопки, модалки, лоадеры
├── pages/             # Страницы (роуты)
├── hooks/             # Кастомные хуки (useBoards, useTasks...)
├── services/          # Работа с Supabase (API-вызовы)
├── providers/         # Контексты (Auth, Theme)
├── types/             # TypeScript типы
└── utils/             # Вспомогательные функции
```

> Структура рекомендуемая, не обязательная. Главное — логичная организация кода.

---

## Критерии оценки

| Критерий               | Вес | Что оцениваем                                                       |
| ---------------------- | --- | ------------------------------------------------------------------- |
| **Работоспособность**  | 25% | Приложение запускается, основной флоу работает без ошибок           |
| **Качество кода**      | 25% | Читаемость, структура компонентов, переиспользование, TypeScript    |
| **UI / UX**            | 20% | Внешний вид, отзывчивость интерфейса, обработка ошибок              |
| **Архитектура**        | 15% | Разделение ответственности, организация файлов, работа с состоянием |
| **Полнота реализации** | 15% | Сколько уровней реализовано (MVP → Full → Bonus)                    |

### На что обращаем внимание

- Компоненты небольшие и переиспользуемые
- TypeScript используется осмысленно (не `any` везде)
- Состояние управляется предсказуемо
- Ошибки обрабатываются, а не игнорируются
- Код легко читать без комментариев

### Что НЕ оцениваем

- Pixel-perfect дизайн — функциональность важнее
- 100% покрытие тестами — но пара тестов на ключевые хуки будет плюсом
- Сложные анимации

---

## Требования к сдаче

### 1. GitHub-репозиторий

- Публичный репозиторий
- Осмысленные коммиты (не один коммит на всё)
- `.env.example` с описанием переменных (без реальных ключей)

### 2. README.md

Должен содержать:

- Краткое описание проекта
- Скриншоты / GIF (опционально, но будет плюсом)
- Инструкция по запуску:
  ```
  git clone ...
  npm install
  cp .env.example .env   # заполнить ключи Supabase
  npm run dev
  ```
- Какие уровни реализованы (MVP / Full / Bonus)
- Что бы улучшили при наличии времени

### 3. Деплой

- Развернуть на **Vercel** (бесплатно)
- Приложить ссылку на работающее приложение
- Создать тестового пользователя или добавить демо-данные

---

## Полезные ссылки

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth (React)](https://supabase.com/docs/guides/auth/quickstarts/react)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [dnd-kit](https://dndkit.com/)
- [React Router](https://reactrouter.com/)

---

## FAQ

**Q: Можно использовать другие библиотеки?**
A: Да. Стек (React + TypeScript + Supabase) фиксирован, всё остальное — на ваш выбор.

**Q: Обязательно ли делать всё?**
A: Нет. MVP (Уровень 1) — обязательный минимум. Каждый дополнительный уровень — плюс при оценке.

**Q: Что если не успеваю?**
A: Лучше качественный MVP, чем незаконченный полный функционал. Опишите в README, что планировали, но не успели.
