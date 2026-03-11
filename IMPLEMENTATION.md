# IMPLEMENTATION.md

Last updated: 2026-03-11
Status: active living document
Audience: engineers, designers, reviewers, AI coding agents

## Purpose

Это короткая оперативная память проекта.

Документ нужен, чтобы человек или ИИ мог быстро понять:

- что это за продукт
- где искать ключевые части системы
- какие ограничения нельзя ломать
- какие решения уже приняты
- что сейчас в работе
- какие документы являются source of truth

Это не замена README и не полная архитектурная спецификация.
Это стартовая точка входа в проект и карта дальнейшего чтения.

## How To Use This File

Если ты только что подключился к проекту:

1. Прочитай этот файл целиком.
2. Затем открой `README.md`.
3. После этого переходи только в нужные документы и кодовые entry points из секции ниже.

Если ты вносишь изменения:

- обновляй только то, что реально изменилось
- не дублируй большие куски из README или `.docs/*`
- фиксируй решения кратко и по делу
- оставляй ссылки на подробные документы вместо копирования текста

## Project Snapshot

Название: Проектные табели

Тип продукта:
offline-first PWA для учета рабочего времени

Текущий scope:

- login
- список табелей
- редактор табеля
- локальная demo-сессия
- IndexedDB persistence
- outbox / pending sync
- foundation под интеграцию с 1С

Ключевой пользовательский путь:

1. Войти в demo workspace
2. Открыть список табелей
3. Создать или открыть табель за день
4. Отредактировать строки
5. Сохранить локально
6. Увидеть pending sync и будущую готовность к transport sync

## Current Stack

- React 19
- TypeScript
- Vite
- TanStack Router
- TanStack Query v5
- Tailwind CSS v4
- local UI components in shadcn-style
- sonner
- idb-keyval
- vite-plugin-pwa
- Vitest + React Testing Library
- Playwright

## Source Of Truth Map

Repository overview:

- `README.md` - project overview, setup, commands, major capabilities
- `AGENTS.md` - working rules and architecture constraints for coding agents
- `.docs/architecture.md` - architecture and roadmap
- `.docs/demo-and-auth.md` - auth and demo mode behavior
- `.docs/demo-mode-strategy.md` - separation of demo presentation and daily work mode
- `.docs/onec-integration-plan.md` - backend integration direction
- `.docs/product-review-plan.md` - current UX/product backlog from live review

Use these as the first layer of context before reading large areas of code.

## Key Runtime Entry Points

Application shell:

- `src/App.tsx`

Routing:

- `src/routes/__root.tsx`
- `src/routes/_authenticated.tsx`
- `src/routes/login.tsx`
- `src/routes/_authenticated/timesheets.tsx`
- `src/routes/_authenticated/timesheet.$date.tsx`

Screens:

- `src/pages/LoginPage.tsx`
- `src/pages/TimesheetsList.tsx`
- `src/pages/TimesheetEditor.tsx`

Auth:

- `src/features/auth/auth.tsx`
- `src/features/auth/auth-service.ts`
- `src/features/auth/auth-transport-factory.ts`

Data layer:

- `src/data/repositories/index.ts`
- `src/data/repositories/localAppRepository.ts`
- `src/data/queryOptions.ts`

UI-facing hooks:

- `src/hooks/useTimesheets.ts`
- `src/hooks/useTimesheet.ts`
- `src/hooks/useSaveTimesheet.ts`
- `src/hooks/useTasks.ts`
- `src/hooks/useSeedDemoData.ts`
- `src/hooks/useResetDemoData.ts`
- `src/hooks/useSyncStatus.ts`

## Architectural Guardrails

These are easy to violate accidentally. Treat them as hard constraints unless product direction changes.

### Data access

- Do not read or write timesheets directly inside page components.
- UI should use hooks, query options, and `AppRepository`.
- Do not add Redux or Zustand for server-style data.

### Offline-first

- Local persistence currently lives in IndexedDB.
- Timesheet saves should produce local persistence plus sync state updates.
- Future 1C integration must stay behind transport / repository abstractions.
- Do not embed direct 1C HTTP logic in UI components.

### Auth

- Use `authService`, `AuthProvider`, and transport factory.
- Keep UI independent from a single concrete auth implementation.
- Current auth modes are `demo | onec`.

### UI

- Preserve the existing visual language unless a product redesign is intentional.
- Prefer utility classes and local UI primitives over ad hoc inline styling.
- Use `sonner` for user feedback.
- Do not reintroduce calendar view without explicit product decision.

## Current Product Truths

- The app is currently a single-user demo workspace.
- Demo presentation flow is now being separated from the main working routes through `/demo` and `appConfig`.
- Roles like `admin`, `manager`, and `user` are not implemented yet.
- Demo login accepts any non-empty username and password.
- Default login values shown in UI are `demo.user` / `demo`.
- The current product is partly optimized for demos and still needs a tighter enterprise-task UX pass.
- The primary UI language is Russian. Future multilingual support may be added later, but new visible UI copy should default to Russian.

## Current UX Direction

Active product goal:

- move from “good demo” to “fast daily work tool”
- keep demo affordances available, but outside the main working path

Current UX priorities are tracked in:

- `.docs/product-review-plan.md`

Highest priority items right now:

- make login task-first
- move the timesheets journal above the fold
- reduce mobile editor friction
- strengthen information hierarchy
- polish mobile safe-area behavior and PWA shell integration

## Development Commands

Core:

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run lint:fix`
- `npm run test`
- `npm run test:ui`

Browser testing:

- `npm run test:e2e`
- `npm run test:e2e:headed`
- `npm run test:e2e:ui`

## Testing Strategy

Use the smallest sufficient layer:

- unit / business logic: Vitest
- UI behavior: React Testing Library
- real browser flows and visual checks: Playwright

Current browser smoke coverage includes:

- login
- timesheets journal
- demo seed flow
- open editor for today

## Known Risks And Watchouts

- Large visual sections on login and timesheets can hide the main task below the fold.
- Mobile editor currently has high chrome density relative to usable form space.
- Demo-seed scenarios are useful for presentations but can distort daily-work UX decisions if over-optimized.
- Route, auth, and repository abstractions should stay stable because future 1C integration depends on them.

## Decision Log

Use this section for short durable decisions.
If a decision becomes large or controversial, move it to an ADR-style document in `.docs/`.

### 2026-03-11

- Added Playwright as the browser E2E layer.
- Added a live product review backlog in `.docs/product-review-plan.md`.
- Established `IMPLEMENTATION.md` as the fast-entry project memory file.
- Linked `IMPLEMENTATION.md` and the product review backlog from the main project docs.
- Started Phase 1 UX tightening for login and timesheets.
- Added mobile safe-area variables, `viewport-fit=cover`, and theme-color shell sync for better mobile/PWA integration.
- Confirmed Russian as the default visible UI language for the current product stage.
- Improved the mobile timesheet editor flow so newly added rows auto-reveal into the working area.
- Added a browser-driven PWA install prompt UX in the app shell for supported platforms.
- Added `appConfig` and started separating `/demo` from the main working routes.
- Hardened `prod` mode so login no longer pre-fills demo credentials and `/demo` is excluded from production-like bundle output by default.

## Current Work Log

Keep this short. Only active or recently active work belongs here.

### Active

- Phase 1 UX tightening of login and timesheets journal
- editor layout compression and mobile ergonomics pass
- mobile safe-area and PWA shell polish
- demo mode split and app mode hardening
- preserving offline-first architecture while improving product clarity

### Next likely work

- continue app-mode cleanup across shell and auth UX
- evaluate install UX and additional PWA-specific affordances
- add screenshot-based visual checkpoints
- extend smoke coverage to `/demo`

## Open Questions

- Should the product explicitly separate demo presentation mode from daily operational mode?
- How much of the current onboarding copy belongs in production UI versus docs or a help layer?
- What is the eventual role model once 1C-backed users and permissions arrive?

## Update Rules

When you change this file, prefer updating these sections:

- `Project Snapshot` if scope changes
- `Source Of Truth Map` if docs move
- `Architectural Guardrails` if constraints change
- `Current UX Direction` if priorities change
- `Decision Log` for durable project decisions
- `Current Work Log` for near-term focus

Do not turn this file into:

- a changelog of every commit
- a copy of README
- a dump of implementation details that belong in code comments or architecture docs

## Suggested Future Companion Docs

If the project grows, add these instead of bloating this file:

- `.docs/adr/` for architectural decision records
- `.docs/testing-strategy.md`
- `.docs/ui-principles.md`
- `.docs/sync-contract.md`
- `.docs/domain-model.md`
