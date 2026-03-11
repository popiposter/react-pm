# Demo Mode Strategy

Last updated: 2026-03-11
Status: active

## Goal

Разделить в продукте два разных контекста:

- демонстрация продукта
- ежедневная рабочая эксплуатация

Демо-инструменты полезны для презентаций, но они не должны перегружать основные рабочие экраны табелей.

## Product Principle

Рабочие страницы должны быть operational-first.

Это значит:

- `/login` остается обычной точкой входа
- `/timesheets` и `/timesheet/$date` остаются чистыми рабочими экранами
- демо-онбординг, seed/reset данных и подсказки по показу приложения выносятся в отдельный `demo`-контур

## Target Route Model

Основные маршруты:

- `/login`
- `/timesheets`
- `/timesheet/$date`

Демо-маршрут:

- `/demo`

`/demo` не дублирует все приложение. Он служит как презентационный entrypoint:

- объясняет демо-сценарий
- подготавливает локальные демо-данные
- дает быстрые переходы в журнал и редактор
- держит рядом reset и offline-demo подсказки

## App Modes

Вводится единый runtime-режим приложения:

- `demo`
- `prod`

Источник:

- `VITE_APP_MODE=demo|prod`

Поведение:

### demo

- доступен `/demo`
- доступны demo data tools
- можно показывать demo-branding и демо-подсказки

### prod

- `/demo` скрыт и редиректит на `/login`
- demo-branding скрыт
- seed/reset демо-данных не показываются в основном UI

## Feature Flag Layer

Чтобы не разносить `import.meta.env` по страницам, режим должен читаться через единый `appConfig`.

Текущие flags:

- `demoRoute`
- `demoDataTools`
- `demoHints`
- `demoBranding`

Базовое правило:

- в `demo` они включены по умолчанию
- в `prod` выключены по умолчанию
- при необходимости их можно отдельно переопределить env-переменными

## UI Placement Rules

Что должно жить только в `/demo`:

- seed demo data
- reset demo data
- сценарные подсказки “как показать”
- offline demo hints
- demo-specific branding

Что должно жить в рабочих экранах:

- вход
- журнал табелей
- редактор дня
- фильтры
- статусы синхронизации
- сохранение и редактирование

Допустимое исключение:

- рабочие экраны могут давать спокойную secondary-ссылку в `/demo`, если это помогает не потерять демонстрационный сценарий

## Engineering Rules

1. Не делать отдельные demo-копии всех рабочих страниц.
2. Не держать seed/reset/onboarding прямо в `LoginPage` и `TimesheetsList`.
3. Новые demo-affordances добавлять сначала в `/demo`, а не в рабочий shell.
4. При появлении реального production auth не смешивать его UX с demo onboarding.

## Delivery Steps

### Phase A

- ввести `appConfig`
- добавить `/demo`
- очистить `login` и `timesheets` от demo-controls

### Phase B

- обновить shell branding по `appMode`
- при необходимости скрывать demo route из production bundle еще жестче
- синхронизировать Playwright smoke с новым demo entrypoint

### Phase C

- при появлении реального backend auth развести demo auth help и production login UX
- при необходимости добавить role-aware demo scenarios
