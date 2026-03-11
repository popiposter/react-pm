# Проектные табели

Offline-first PWA для ввода и редактирования табелей рабочего времени. Приложение уже можно полноценно показывать и использовать в демо-режиме без готового 1С backend: данные хранятся локально, синхронизация эмулируется через outbox, а защищенные маршруты и логин уже построены под будущую password + token схему.

Публичное демо после деплоя на GitHub Pages ожидается по адресу:

- [https://popiposter.github.io/react-pm/](https://popiposter.github.io/react-pm/)

## Что реализовано

- Современный web shell на React 19, Vite, Tailwind CSS v4 и локальных UI-компонентах в стиле `shadcn/ui`
- `TanStack Router` с file-based routing, защищенными страницами, lazy loading и route-level pending UI
- `TanStack Query` для данных, mutation flow и кэширования
- Offline-first repository layer поверх IndexedDB (`idb-keyval`)
- Outbox и pending sync для локальных изменений табелей
- Sync runner и transport abstraction под будущую интеграцию с 1С
- Demo auth flow с локальной сессией, access/refresh token contract и foundation под настоящий backend
- PWA через `vite-plugin-pwa`
- Журнал табелей, редактор табеля, локальная seed-загрузка демо-данных

## Текущий функциональный scope

- `/login`:
  - вход в демо-режим
  - подготовка демо-данных
  - баннеры причин редиректа (`auth-required`, `expired`, `refresh-failed`)
- `/timesheets`:
  - список табелей
  - поиск
  - фильтр по статусу
  - фильтр по месяцу
  - индикаторы pending sync
- `/timesheet/$date`:
  - редактирование строк табеля
  - каскадный пересчет времени
  - drag and drop
  - inline-валидация
  - оффлайн-сохранение

Календарный режим и Mantine runtime удалены из основного приложения.

## Архитектура

Основная схема сейчас такая:

1. UI работает через route loaders, hooks и typed search params.
2. Доступ к данным идет через repository layer, а не напрямую из компонентов.
3. Локальный adapter хранит данные в IndexedDB.
4. Сохранения кладутся в outbox и помечаются как `pending_sync`.
5. Sync runner прогоняет очередь через transport.
6. Сейчас transport локальный или stub под 1С, позже добавим реальный transport без переписывания UI.

Подробности:

- [Implementation memory](IMPLEMENTATION.md)
- [Архитектура и roadmap](.docs/architecture.md)
- [План интеграции с 1С](.docs/onec-integration-plan.md)
- [Авторизация и демо-режим](.docs/demo-and-auth.md)
- [Стратегия demo mode](.docs/demo-mode-strategy.md)
- [Деплой и GitHub Pages](.docs/deployment.md)
- [Product review backlog](.docs/product-review-plan.md)

## Установка

```bash
npm install
```

## Запуск

Локальная разработка:

```bash
npm run dev
```

Продакшн-сборка:

```bash
npm run build
```

Линтер и тесты:

```bash
npm run lint
npm run test
npm run test:e2e
```

Предпросмотр production build:

```bash
npm run preview
```

E2E и визуальная проверка в браузере:

```bash
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:ui
```

## Переменные окружения

Приложение работает и без `.env`, но для переключения режимов полезны такие переменные:

```env
VITE_AUTH_TRANSPORT=demo
VITE_SYNC_TRANSPORT=local
VITE_ONEC_BASE_URL=
VITE_APP_BASE_PATH=/
VITE_APP_MODE=demo
```

Значения:

- `VITE_AUTH_TRANSPORT=demo|onec`
- `VITE_SYNC_TRANSPORT=local|onec`
- `VITE_ONEC_BASE_URL` используется будущими transport-адаптерами 1С
- `VITE_APP_BASE_PATH` нужен для деплоя в подкаталог, например на GitHub Pages
- `VITE_APP_MODE=prod` скрывает demo route и demo-affordances из основного UI по умолчанию

## Как войти

Сейчас действует demo auth transport.

- В UI по умолчанию подставлены:
  - логин: `demo.user`
  - пароль: `demo`
- Фактически demo transport принимает любую непустую пару логин/пароль.
- После входа создается локальная демо-сессия с access token, refresh token и временем истечения.
- Для подготовки демонстрации используйте отдельный маршрут `/demo`.

Подробно:

- [Авторизация и демо-режим](.docs/demo-and-auth.md)

## Browser E2E

В проект подключен `Playwright` для smoke-проверок и живого просмотра интерфейса в браузере.

- `npm run test:e2e` запускает сценарии headless
- `npm run test:e2e:headed` прогоняет те же сценарии в видимом окне браузера
- `npm run test:e2e:ui` открывает Playwright UI runner для локальной отладки

Playwright сам поднимает Vite dev server, поэтому отдельно запускать `npm run dev` для e2e не нужно.

Текущее browser coverage уже проверяет:

- login и вход в рабочий контур
- demo entrypoint `/demo`
- открытие редактора на сегодня
- валидацию перед сохранением
- успешное сохранение табеля
- все основные ветки dirty-navigation modal: `Отмена`, `Уйти без сохранения`, `Сохранить и уйти`
- `Сохранить и закрыть`
- удаление строки с confirm modal
- `Копировать на сегодня`
- offline save, pending sync и ручной запуск sync

## Есть ли разделение админ / пользователь

Пока нет. Сейчас приложение работает как single-user demo workspace.

Что уже заложено:

- защищенные маршруты
- auth session contract
- auth transport factory
- место для user profile и claims

Что планируется при подключении 1С:

- роли и права на основе backend claims
- отдельные действия для пользователя, руководителя и администратора
- ограничение маршрутов и действий на уровне router guards и feature gates

## Как подключим backend 1С

Мы не собираемся встраивать 1С напрямую в UI. Интеграция пойдет через уже подготовленные слои:

- `AuthTransport`
  - сейчас `demo`
  - позже `OneCAuthTransport`
- `SyncTransport`
  - сейчас `local`
  - позже `OneCSyncTransport`
- `AppRepository`
  - UI и hooks останутся поверх него без переписывания

Этапы подключения:

1. Реализовать login endpoint и refresh endpoint в `OneCAuthTransport`
2. Добавить профиль пользователя и employee context
3. Реализовать чтение задач и табелей через remote repository/transport contract
4. Сопоставить сохранение табеля с реальными DTO 1С
5. Довести обработку конфликтов и фоновой синхронизации

Подробный план:

- [План интеграции с 1С](.docs/onec-integration-plan.md)

## GitHub Pages

Да, production build можно публиковать на GitHub Pages уже сейчас, с оговорками:

- приложение должно собираться с корректным `base path`
- SPA нужно отдавать с fallback на `index.html`
- PWA на GitHub Pages работает, но offline-first для API и будущая background sync логика все равно останутся клиентскими
- сайт GitHub Pages обычно будет публично доступен, даже если сам репозиторий приватный, если это позволяет ваш GitHub plan

В репозиторий добавлен workflow для GitHub Pages deployment через GitHub Actions.

Подробности:

- [Деплой и GitHub Pages](.docs/deployment.md)

## Структура проекта

```text
src/
  components/      UI и layout
  data/            repositories, sync, query options
  features/        auth и другие feature-модули
  hooks/           query hooks и UI-facing hooks
  pages/           экранные компоненты
  routes/          TanStack Router routes
  store/           query client, persistence
```

## Быстрый вход в контекст

Если подключаешься к проекту впервые или после паузы, начни с:

- [IMPLEMENTATION.md](IMPLEMENTATION.md)
- [Product review plan](.docs/product-review-plan.md)
- [Архитектура и roadmap](.docs/architecture.md)

## Ближайшие планы

- Подключить реальный `OneCAuthTransport`
- Спроектировать DTO и маппинг табелей под 1С
- Добавить user profile / employee context
- Ввести роли и разграничение прав
- Довести PWA до фоновой отправки очереди изменений
- Улучшить product UX вокруг статусов отправки табеля
