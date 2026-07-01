Что ещё требует доработки на фронтенде:
1. Сборка/проверки
○
В архив попал node_modules; npm run lint падает с
eslint: Permission denied.
○
npm run build в распакованном архиве падает из-за
отсутствующих type definitions vite/client и node.
○
Нужно пересобрать архив без node_modules, проверить
clean install: rm -rf node_modules package-lock.json
&& npm install && npm run build && npm run lint.
2. React-архитектура
○
BoardView всё ещё перегружен: загрузка данных, realtime,
DnD, CRUD колонок/задач, optimistic updates.
○
Лучше вынести:
■ useBoardData
■ useBoardRealtime
■ useTaskDnD
■ useColumnActions
■ useTaskActions
3. DnD reorder
○
Логика перемещения задач остаётся хрупкой.
○
Reorder делается пачкой отдельных Supabase-запросов через
Promise.all.
○
Нет настоящей транзакционности: часть задач может
обновиться, часть нет.
○
При ошибке rollback только через reloadAllTasks, что
может дать визуальные скачки.
4. Realtime
○
Подписка на tasks идёт без server-side фильтра по board.
○
Фильтрация делается на клиенте через columnIdsRef.
○
Это может ловить лишние события и масштабируется плохо.
○
При realtime UPDATE задача, перемещённая в другую
колонку, может не удалиться из старой, если пришла не через
локальный DnD.
5. TaskModal
○
Описание задачи сохраняется debounce-ом, но UI берёт
value из task.description, а не из локального состояния.
○
Это может давать лаги/потерю символов при быстрых
изменениях.
○
Лучше сделать локальный draft state и явный Save или
autosave с optimistic local state.
6. Assignee
○
В типах и карточке assignee есть.
○
Но в TaskModal всё ещё нет выбора исполнителя из
участников доски.
○
Для Full-функционала это недоделка: постановка требует
assignee из участников доски.
7. BoardPage
○
Есть плохой каст:
dispatch(setCurrentBoard({ id: boardId, title: data.title } as never))
○
Это явный обход TypeScript. Нужно либо грузить полноценный
Board, либо завести отдельный тип для краткой
board-модели.
8. UX
○
Удаление board всё ещё через native confirm(), хотя уже
есть ConfirmModal.
○
На кнопках добавления task/column не хватает loading/disabled
состояния во время запроса.
○
Можно создать дубликаты быстрыми кликами/Enter.
9. Accessibility
○
В Modal нет role="dialog", aria-modal, связи
aria-labelledby.
○
Закрывающая кнопка модалки без aria-label.
○
Кликабельная карточка задачи — div, а не button/link,
клавиатурная доступность слабая.
10. Auth flow
●
После login используется:
setTimeout(() => navigate('/dashboard'), 100)
●
Это костыль. Лучше навигировать по факту изменения auth
state/session.
11. Profile
●
name инициализируется из profile, но если профиль догрузится
позже, локальный state не синхронизируется.
●
Нужен useEffect(() => setName(profile?.name ?? ''),
[profile]).
12. Ошибки
●
Во многих местах catch { toast.error(...) } без деталей.
●
Для пользователя норм, но для разработки/поддержки лучше
логировать error или нормализовать ошибки через helper.
Итог: фронтенд стал заметно лучше, но до уверенного production-ready
уровня не хватает clean build/lint, декомпозиции BoardView, более
надёжного DnD/realtime, полноценного assignee UI и устранения
TS-костылей.