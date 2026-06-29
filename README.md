# KanbanDesk - https://kanban-desk-kappa.vercel.app

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase)](https://supabase.com)
[![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-764ABC?logo=redux)](https://redux-toolkit.js.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite)](https://vitejs.dev)

**KanbanDesk** — это полнофункциональное веб-приложение для управления задачами на канбан-досках с realtime-обновлениями, совместным доступом и тёмной темой.

---

##  Реализованные уровни

### Уровень 1: MVP (обязательный) — Полностью

| Функция | Статус |
|---------|--------|
| Регистрация / вход по email + пароль (Supabase Auth) | ✅ |
| Выход из системы | ✅ |
| Защита роутов (перенаправление на `/login`) | ✅ |
| Список досок (главная страница) | ✅ |
| Создание / удаление доски | ✅ |
| Переход на доску | ✅ |
| 3 колонки по умолчанию при создании доски | ✅ |
| Добавление / удаление колонок | ✅ |
| Переименование колонки | ✅ |
| Создание задачи в колонке | ✅ |
| Drag-and-drop между колонками и внутри колонки | ✅ |
| Удаление задачи | ✅ |
| Адаптивная вёрстка (desktop + mobile) | ✅ |
| Состояния загрузки (спиннеры) | ✅ |
| Toast-уведомления об ошибках/успехе | ✅ |

### Уровень 2: Полный функционал — Полностью

| Функция | Статус |
|---------|--------|
| Детали задачи в модальном окне | ✅ |
| Поля: название, описание, приоритет (low/medium/high), дедлайн | ✅ |
| Назначение исполнителя (assignee) | ✅ |
| Список комментариев под задачей | ✅ |
| Добавление / удаление комментария | ✅ |
| Отображение автора и времени комментария | ✅ |
| Realtime-обновления (Supabase Realtime: tasks, columns) | ✅ |
| Приглашение пользователя на доску (по User ID) | ✅ |
| Роли: owner (полный доступ) / member (просмотр + редактирование) | ✅ |
| Owner может удалять доску и управлять участниками | ✅ |
| Страница профиля: имя, аватар | ✅ |
| Отображение аватара в карточках задач и комментариях | ✅ |

### Уровень 3: Бонус — Частично

| Функция | Статус |
|---------|--------|
|  **Тёмная тема (dark mode) — переключение light/dark** | ✅ |
|  **Google OAuth (вход через Google)** | ✅ |
| <kbd>Esc</kbd> — закрыть модальное окно | ✅ |
| Фильтрация задач (по приоритету, исполнителю, дедлайну) | ❌ |
| Поиск задач по названию | ❌ |
| Лог активности на доске | ❌ |

---

##  Технологический стек

| Категория | Технология |
|-----------|-----------|
| **Фреймворк** | React 19 + Vite 8 |
| **Язык** | TypeScript 6 (strict mode) |
| **Состояние** | Redux Toolkit + React Redux |
| **Роутинг** | React Router DOM v7 |
| **Backend / БД** | Supabase (Postgres, Auth, Realtime, Storage) |
| **Стилизация** | TailwindCSS v4 |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |
| **Уведомления** | react-hot-toast |

---

##  Архитектура проекта

```
src/
├── components/           # UI-компоненты
│   ├── auth/             #   формы входа/регистрации
│   ├── board/            #   доска, колонки, карточки, управление участниками
│   ├── task/             #   модальное окно задачи, комментарии
│   └── shared/           #   Button, Modal, Spinner, Avatar, Input, Textarea, Layout, ProtectedRoute
├── pages/                # Страницы (роуты)
├── hooks/                # Кастомные хуки (useAuth, useRealtime, useAppStore)
├── services/             # Работа с Supabase (API-вызовы)
├── providers/            # Контексты (AuthProvider, ThemeProvider)
├── store/                # Redux Toolkit (authSlice, boardSlice, uiSlice)
├── types/                # TypeScript типы и интерфейсы
└── lib/                  # Supabase клиент (инициализация)
```

### Принципы архитектуры

- **Модульная архитектура** — компоненты разделены по функциональным папкам
- **SOLID / DRY / KISS / YAGNI** — код следует этим принципам
- **Разделение ответственности** — UI-компоненты отделены от бизнес-логики (services) и управления состоянием (store)
- **Переиспользуемые компоненты** — Button, Modal, Input, Spinner, Avatar используются по всему приложению
- **Обработка ошибок** — каждый API-запрос обёрнут в try/catch с показом toast-уведомлений
- **TypeScript strict mode** — типизированы все пропсы, состояния, ответы API
---

## Схема базы данных

Проект использует Supabase (PostgreSQL) со следующими таблицами:

- **`boards`** — доски (id, title, owner_id, created_at)
- **`board_members`** — участники доски (id, board_id, user_id, role: owner/member)
- **`columns`** — колонки на доске (id, board_id, title, position)
- **`tasks`** — задачи (id, column_id, title, description, priority, due_date, assignee_id, position, created_by, created_at)
- **`comments`** — комментарии к задачам (id, task_id, user_id, content, created_at)
- **`profiles`** — профили пользователей (id, name, avatar_url) — создаются автоматически через триггер при регистрации

Включена Row Level Security (RLS) для всех таблиц. Полные SQL-скрипты — в [`supabase-scripts.md`](./supabase-scripts.md).

---

## 🔧 Установка и запуск

### 1. Клонировать репозиторий

```bash
git clone https://github.com/your-username/kanban-desk.git
cd kanban-desk
```

### 2. Установить зависимости

```bash
npm install
```

### 3. Настроить переменные окружения

```bash
cp .env.example .env.local
```

Заполните `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Настроить Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Выполните SQL-скрипты из [`supabase-scripts.md`](./supabase-scripts.md) в SQL Editor
3. Включите **Google Auth** в Authentication → Providers → Google (настройте OAuth-клиент в Google Cloud Console)
4. В настройках Authentication → URL Configuration укажите `Site URL` (например, `http://localhost:5173`)

### 5. Запустить в режиме разработки

```bash
npm run dev
```

Откройте [http://localhost:5173](http://localhost:5173).

### 6. Собрать для продакшена

```bash
npm run build
npm run preview
```
---

## Деплой на Vercel

1. Установите [Vercel CLI](https://vercel.com/docs/cli) или подключите репозиторий через Vercel Dashboard
2. Добавьте переменные окружения `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` в Vercel
3. Настройте в Supabase URL деплоя в Authentication → URL Configuration
4. Деплой: `vercel` или через GitHub integration

Файл `vercel.json` уже настроен для SPA-роутинга:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 📋 Роутинг

| Путь | Страница | Защищён? |
|------|----------|----------|
| `/login` | Вход | Нет |
| `/register` | Регистрация | Нет |
| `/auth/callback` | OAuth-колбэк (Google) | Нет |
| `/dashboard` | Список досок | Да |
| `/board/:boardId` | Канбан-доска | Да |
| `/profile` | Профиль пользователя | Да |
| `*` | Редирект на `/dashboard` | — |
---

## Ключевые функции

### Аутентификация
- Регистрация по email + пароль
- Вход по email + пароль
- Вход через Google (OAuth)
- Автоматическое создание профиля при регистрации
- Персистентная сессия (Supabase Auth)

### Drag-and-Drop
- Перемещение задач между колонками
- Изменение порядка задач внутри колонки
- Плавная анимация с DragOverlay
- Поддержка touch-устройств (TouchSensor)

### Realtime
- Автоматическое обновление задач при изменениях другими пользователями
- Подписка на изменения колонок
- Использование Supabase Realtime (postgres_changes)
- Фильтрация по boardId

### Совместный доступ
- Приглашение участников на доску (по User ID)
- Ролевая модель: owner / member
- Owner: полный доступ (управление доской, участниками, колонками)
- Member: просмотр и редактирование задач

### Тёмная тема
- Переключение между светлой и тёмной темой
- Сохранение выбора в localStorage
- Полностью поддержана во всех компонентах


---

##  Автор

**Сокольников Богдан**
