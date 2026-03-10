# Архитектура

## Текущая схема

Приложение построено как local-first frontend, который уже сейчас удобно демонстрировать, а позже подключать к 1С без перелома архитектуры.

Поток данных:

1. `TanStack Router` управляет маршрутизацией, guards и pending UI.
2. Route loaders и hooks получают данные через `TanStack Query`.
3. `TanStack Query` опирается на `queryOptions` и repository layer.
4. Repository layer скрывает конкретный источник данных.
5. Локальный adapter хранит данные в IndexedDB.
6. Изменения кладутся в outbox и позже уходят через sync transport.

## Основные модули

### Routing

- file-based routing через `src/routes`
- защищенный layout `_authenticated`
- lazy loading тяжелых экранов
- search params для фильтров списка табелей
- баннеры причин редиректа на login

### Auth

- auth provider хранит текущую сессию
- auth service отвечает за restore/persist/refresh logic
- auth transport factory переключает режимы `demo|onec`
- current session contract уже хранит:
  - `user`
  - `accessToken`
  - `refreshToken`
  - `expiresAt`
  - `authStrategy`

### Data

- `AppRepository` делит доступ к данным на:
  - `tasks`
  - `timesheets`
  - `sync`
  - `demo`
- локальная реализация репозитория работает на IndexedDB
- старые локальные данные мягко мигрируются из legacy localStorage

### Sync

- каждое сохранение табеля создает или обновляет запись в outbox
- табель помечается как `pending_sync`
- sync runner поэлементно читает очередь
- transport возвращает structured result с частичными ошибками
- фабрика transport уже умеет выбирать `local|onec`

## Почему это удобно для 1С

- UI не знает про HTTP, DTO и детали API
- auth и sync уже отделены в transport-слои
- можно внедрять backend поэтапно, не замораживая продуктовую разработку

## Не реализовано пока

- remote query adapter для чтения табелей и задач
- background sync через service worker
- server-driven роли и права
- полноценное conflict resolution UI под реальный backend

## Ближайший roadmap

1. Реализовать `OneCAuthTransport`
2. Описать DTO контракты 1С
3. Добавить remote transport для задач и табелей
4. Подключить фоновую отправку outbox
5. Ввести роли и employee context
