# Project Context: Offline-first PWA "Проектные табели" (Timesheets)

Это frontend-приложение для учета рабочего времени. Текущий продуктовый scope: login, список табелей, редактор табеля, offline-first сохранение, локальная demo-сессия, outbox/pending sync и foundation под интеграцию с 1С.

## Current Tech Stack

- Framework: React 19 + TypeScript + Vite
- Routing: TanStack Router (file-based)
- Data: TanStack Query v5
- UI: Tailwind CSS v4 + локальные UI-компоненты в стиле `shadcn/ui`
- Notifications: `sonner`
- Offline storage: `idb-keyval` (IndexedDB)
- PWA: `vite-plugin-pwa`
- Testing: Vitest + React Testing Library
- Drag and drop: `@dnd-kit/*`

## Documentation & API Reference

При работе с нестабильными или быстро меняющимися библиотеками сначала сверяйся с актуальной документацией.

Полезные источники:

- TanStack: https://tanstack.com/llms.txt
- TanStack Router docs: https://tanstack.com/router/latest/docs/framework/react/overview
- TanStack Query docs: https://tanstack.com/query/latest/docs/framework/react/overview
- shadcn/ui docs: https://ui.shadcn.com/docs
- vite-plugin-pwa docs: https://vite-pwa-org.netlify.app/

Локальные документы для быстрого входа в контекст:

- `IMPLEMENTATION.md`
- `.docs/product-review-plan.md`
- `.docs/architecture.md`

## Build & Dev Commands

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run lint:fix`
- `npm run test`
- `npm run test:ui`
- `npm run test:e2e`
- `npm run test:e2e:headed`
- `npm run test:e2e:ui`

## Architecture Rules

### 1. Routing

- Используй `TanStack Router` routes из `src/routes`
- Для защищенных страниц полагайся на route guards и auth context
- Для тяжелых экранов предпочитай lazy loading
- Для фильтров и shareable UI state используй typed search params

### 2. Data access

- Не читай и не пиши табели напрямую из компонентов
- UI должен работать через hooks, query options и `AppRepository`
- Весь async data flow идет через `TanStack Query`
- Не добавляй Redux/Zustand для серверных данных

### 3. Offline-first

- Локальное хранилище сейчас идет через IndexedDB
- Сохранения табелей должны попадать в outbox и помечаться как `pending_sync`
- Любая будущая интеграция с 1С должна идти через transport/repository abstraction
- Не вшивай HTTP-логику 1С в экранные компоненты

### 4. Auth

- Основа уже заложена под password + token flow
- Используй `authService`, `AuthProvider` и transport factory
- Сейчас режимы auth: `demo|onec`
- Не делай прямую зависимость UI от конкретной auth-реализации

### 5. UI

- Сохраняй текущий визуальный язык приложения
- Используй существующие utility classes, а не случайный inline style
- Для пользовательской обратной связи используй `sonner`
- Calendar view не возвращай без отдельного product decision

### 6. Testing

- Любую нетривиальную бизнес-логику покрывай тестами
- Для UI используй React Testing Library и `userEvent.setup()`
- Тестируй поведение пользователя, а не внутренний state

## Product Constraints

- Приложение пока single-user demo workspace
- Разделение ролей `admin/manager/user` еще не реализовано
- Demo login принимает любую непустую пару логин/пароль
- На форме по умолчанию показываются `demo.user` / `demo`

## Backend Integration Direction

Текущий план интеграции с 1С:

1. `OneCAuthTransport` для login/refresh
2. user profile и роли
3. чтение задач и табелей
4. save/sync contract и versioning
5. conflict handling
6. фоновая синхронизация
