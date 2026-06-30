Ключевые находки:
●
✅ Auth, protected routes, boards, default columns, columns CRUD,
tasks create/move, DnD, realtime, comments, profile, dark mode,
Google OAuth заявлены и в коде в основном присутствуют.
●
❌ Удаление задачи отсутствует в UI: сервис deleteTask есть, но
нигде не используется.
●
❌ Assignee отображается, но выбора исполнителя в модалке нет.
●
❌ Invite by email не реализован: добавление участника идёт по
User ID.
●
❌ README пишет «Full полностью», фактически это Full
частично.
●
⚠️ DnD reorder логика сложная и хрупкая: много последовательных
update-запросов, риск рассинхронизации позиций.
●
⚠️ Realtime подписка на все tasks без server-side filter по board —
работает, но не оптимально.
●
⚠️ Lint не проходит: 3 ошибки.
Список замечаний по React-коду:
Критичные
1. Нет удаления задачи в UI
deleteTask есть в сервисе, но в компонентах не используется.
Для MVP это обязательный пункт.
2. TaskModal обновляет задачу на каждый ввод символа
onChange={(e) => handleUpdate({ description: e.target.value })}
Это создаёт запрос в Supabase на каждый символ. Лучше
debounce или кнопка Save.
3. Слабая типизация обновления задачи
const handleUpdate = async (updates: Record<string, unknown>)
Лучше Partial<Task> или отдельный DTO.
4. Есть небезопасный каст
updateColumn(colId, { title } as never)
Это обход TypeScript, а не решение типизации.
5. Ручной dispatch по строке action type
dispatch({ type: 'board/updateColumnInState', payload: updated })
Нужно импортировать action creator
updateColumnInState(updated).
DnD / состояние
6. Логика drag-and-drop слишком сложная и хрупкая
Много ручных пересчётов position, newPos, insertAt,
повторных update-запросов. Высокий риск off-by-one ошибок.
7. Оптимистичное обновление без полноценного rollback
При ошибке вызывается reloadAllTasks(), но пользователь
может увидеть временно некорректное состояние.
8. Много последовательных Supabase-запросов при reorder
Каждый таск обновляется отдельно. Лучше batch/RPC или
минимальный update только изменённых задач.
9. moveTaskInState мутирует найденный task
В Redux Toolkit это технически допустимо через Immer, но
логически лучше создавать новый объект, чтобы избежать
неочевидных сайд-эффектов.
10. Realtime может дублировать локальные optimistic updates
После локального dispatch(addTask) realtime INSERT может
добавить ту же задачу повторно, если нет защиты от дублей.
Компоненты и хуки
11. BoardView перегружен
В одном компоненте: загрузка данных, DnD, CRUD колонок, CRUD
задач, realtime, toast-ошибки. Лучше вынести в useBoardData,
useTaskDnD, useColumnsActions.
12. reloadAllTasks зависит от columns
После изменения колонок эффект может перезагружать задачи
повторно. Это допустимо, но архитектурно шумно.
13. Ошибки при загрузке комментариев проглатываются
getComments(...).then(setComments).catch(() => {})
Пользователь не узнаёт, что комментарии не загрузились.
14. Нет loading-состояния для комментариев
В модалке сразу показывается пустой список, даже если данные
ещё грузятся.
15. Нет очистки comments/newComment при закрытии модалки
При быстром переключении задач возможны визуальные
артефакты.
16. Асинхронные обновления в TaskModal могут прийти не в
том порядке
Например, несколько быстрых изменений description/priority могут
перезаписать друг друга.
TypeScript
17. Типы Supabase написаны вручную
Лучше использовать сгенерированные Database types от Supabase.
18. priorityColors[task.priority] работает, но лучше
типизировать как Record<Task['priority'], string>
19. RealtimePayload объявлен, но фактически не используется
Мёртвый тип.
20. updateTask(id, updates: Partial<Task>) позволяет
отправить лишние поля
Например assignee, created_at, id. Лучше DTO:
type TaskUpdate = Pick<Task, 'title' | 'description' | 'priority' | 'due_date' |
'assignee_id'>
UX / доступность
21. Кнопки с иконками без aria-label
Например delete column/comment. Для accessibility плохо.
22. Используется confirm()
Работает, но выглядит несистемно. Лучше общий ConfirmModal.
23. Нет disable/loading на кнопках во время async action
Можно дважды создать колонку/задачу/комментарий.
24. Инвайт участника по User ID
Для пользователя это плохой UX; по заданию нужен email.
25. Drag на карточке конфликтует с click
Вся карточка одновременно draggable и clickable. Лучше отдельный
drag handle или порог/обработка клика после drag.