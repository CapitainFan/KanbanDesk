Проверил последнюю версию архива. Сборка после clean install
проходит, но lint всё ещё падает.
Что ещё доработать на фронтенде:
1. Lint не проходит
Ошибка в useComments.ts: синхронный setLoading(true)
внутри useEffect. Нужно переписать загрузку комментариев через
состояние запроса или reducer.
2. В архиве есть мусорный node_modules/.tmp
Из-за этого до npm ci сборка/линт падают. В репозиторий/архив не
должен попадать node_modules.
3. TaskDetails использует uncontrolled-поля
defaultValue для description, priority, assignee, due date. При
обновлении selectedTask значения могут не синхронизироваться.
Лучше локальный controlled draft state.
4. Autosave задачи всё ещё рискованный
Изменения description/priority/assignee/due date уходят
debounce-запросом без индикатора сохранения и без rollback.
Пользователь не понимает, сохранено ли изменение.
5. Не очищается debounce timer
В TaskDetails нет cleanup для saveTimerRef. Если закрыть
модалку до срабатывания таймера, может уйти запрос после
unmount.


6. Realtime по tasks без server-side filter
Подписка слушает всю таблицу tasks, затем фильтрует на
клиенте. Для демо ок, но архитектурно слабое место.
7. Realtime task UPDATE теряет enriched assignee
В realtime приходит сырой Task без assignee profile. После
обновления карточка может потерять аватар исполнителя.
DnD rollback сделан через ручной dispatch по строке
dispatch({ type: 'board/setTasks', ... })
8. Лучше использовать action creator setTasks.
9. DnD reorder зависит от RPC
Есть fallback на отдельные update-запросы, но он не
транзакционный. При частичной ошибке позиции могут
рассинхронизироваться.
10. BoardView стал лучше, но всё ещё знает слишком много
Он всё ещё связывает DnD, realtime, CRUD колонок/задач, модалки
и UI. Для production лучше ещё сильнее разделить orchestration и
presentational UI.
11. MemberManagement удаляет участников без подтверждения
Для owner/member management лучше использовать
ConfirmModal, как для задач/колонок.
12. Недостаточно правовой/role UX-логики на фронте
Owner/member роли есть, но UI-ограничения неполные: member
может видеть некоторые destructive controls до ошибки от RLS, если
политики запретят действие.
13. Нет фильтрации/поиска задач
Это бонус, но README честно отмечает как не реализовано. По
заданию не критично.