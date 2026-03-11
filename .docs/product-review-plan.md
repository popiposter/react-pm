# Product Review And Delivery Plan

Last updated: 2026-03-11
Review basis: live walkthrough in browser via Playwright on desktop and mobile
Reviewer lens: enterprise user, product acceptance, daily operational efficiency

## Goal

Сделать интерфейс табелей не просто аккуратным демо, а быстрым рабочим инструментом и базой для следующих document screens.

Целевое состояние:

- пользователь сразу понимает главный action
- списки документов читаются как рабочие таблицы, а не как демо-страницы
- редактор документа быстро приводит к основной задаче
- desktop и mobile используют один продуктовый язык, но разную плотность и ergonomics
- новые документы могут наследовать уже готовые workspace patterns

## Current Product Verdict

Что уже хорошо:

- базовая visual language чистая и современная
- основной путь `login -> journal -> editor` устойчив
- mobile editor больше не выглядит сломанным
- demo/work split уже вынесен в отдельную стратегию и app mode
- desktop document UI начал превращаться в систему, а не набор разовых экранов

Что еще остается главным источником UX-долга:

- не все document flows еще используют общий workspace pattern
- sidebar все еще скорее нейтральный, чем по-настоящему полезный
- batch operations пока есть только в первом приближении
- у списков документов еще нет saved views, table preferences и capability rules
- visual regression discipline пока не зафиксирована baseline-снимками

## Completed

### Core UX passes

- `login` переведен в task-first layout
- верх `timesheets` сокращен, журнал поднят выше fold
- mobile editor cleanup выполнен
- editor header сжат
- mobile safe-area и PWA shell polish выполнены
- language cleanup по основным пользовательским экранам начат и русский закреплен как базовый UI язык

### Editor ergonomics

- mobile row actions перенесены из detached bottom sheet в компактное контекстное меню
- в строках табеля теперь виден проект
- `endTime` редактируется напрямую
- описание стало multiline
- drag-and-drop получил preview overlay, drop target highlight и motion polish
- wide desktop spacing и общий shell layout улучшены

### Demo/work split

- demo strategy вынесена в отдельный документ
- введен `appConfig`
- demo onboarding и demo data controls убраны из основных рабочих экранов
- `/demo` вынесен в отдельный presentation entrypoint
- `prod`-hardening выполнен

### Browser verification

- Playwright покрывает desktop, mobile и prod-smoke
- editor flows покрыты заметно глубже, чем в начале:
  save, leave, delete, copy, offline-sync, mobile add/save, mobile duplicate

## Active Workstream

### Document Workspace Standardization

Это теперь главный platform/UI слой проекта.

Что уже внедрено:

- `PageBreadcrumbs`
- `EntityPageHeader`
- `DocumentActionBar`
- `DocumentTableToolbar`
- `DocumentTableFrame`
- `DocumentDataTable`
- общий search schema для document lists: `period + status + q`
- первые bulk actions над списком табелей

Что это уже дало:

- desktop document screens стали заметно последовательнее
- toolbar/filter/header patterns больше не расползаются по-разному
- таблица табелей уже выглядит как рабочая document table
- следующий document list можно будет собирать на готовом preset

## Active Backlog

### Must

#### 1. Finish document workspace standardization

Что сделать:

- закрепить `DocumentDataTable` как основной preset для desktop document lists
- вынести capability rules для batch actions
- привести следующий document list на тот же pattern, когда появится новая сущность

Критерий готовности:

- новые document lists собираются из shared primitives без локальной table-архитектуры

#### 2. Define batch action behavior

Что сделать:

- описать, какие массовые операции допустимы для каждой сущности и статуса
- добавить confirm/gating rules для destructive или state-changing bulk actions
- исключить “тихие” массовые изменения без явного пользовательского сигнала

Критерий готовности:

- batch operations предсказуемы, ограничены capability rules и не выглядят случайной надстройкой

#### 3. Unify list search and period model

Что сделать:

- использовать shared `period + status + q` schema как базовый контракт для document lists
- при необходимости расширять его типовыми filter groups, а не ad hoc search params
- описать этот contract как стандарт для будущих экранов

Критерий готовности:

- search params новых document lists проектируются поверх общей схемы, а не изобретаются заново

### Should

#### 4. Improve sidebar usefulness

Что сделать:

- решить, sidebar это рабочая навигация или минимальный shell
- если рабочая навигация, дать ей полезные shortcuts/sections
- если нет, уменьшить ее смысловой шум еще сильнее

Критерий готовности:

- sidebar либо помогает быстрее двигаться по продукту, либо почти не отвлекает

#### 5. Add table preferences and saved views

Что сделать:

- хранить column visibility
- сохранить preferred sorting/filter setup
- продумать presets/saved views для document lists

Критерий готовности:

- пользователь не настраивает table environment заново каждый раз

#### 6. Add visual regression checkpoints

Что сделать:

- зафиксировать desktop/mobile baselines для `login`, `timesheets`, `editor`
- использовать их как часть visual discipline для layout changes

Критерий готовности:

- основные экраны защищены не только e2e behavior, но и snapshot-style visual checks

### Nice To Have

#### 7. Strengthen desktop operational feel

Что сделать:

- sticky filters или compact pinned toolbar при длинных таблицах
- richer row interactions там, где это оправдано
- дальше развивать table ergonomics без превращения UI в перегруженный admin panel

## Suggested Next Phase

### Platform Phase A

- batch action rules and confirm flows
- shared document-list contract documentation
- next list screen built on `DocumentDataTable`

### Platform Phase B

- table preferences
- saved views / presets
- visual regression baselines

### Platform Phase C

- capability-driven document operations
- cross-document workspace consistency pass

## Acceptance Checklist

Перед закрытием следующего platform/UI этапа проверять:

- desktop 1440 px
- wide desktop
- mobile around 390 px width
- login first screen
- timesheets seeded state
- timesheet editor with one row
- table sorting obviously visible
- filters grouped in one operational block
- primary action obvious in under 5 seconds
- core task doable without reading explanatory text
- selection and batch operations are discoverable and safe

## Working Notes

Этот документ теперь должен отражать не только UI polish, но и развитие общей workspace system.

После каждого заметного шага обновлять:

- что уже стало стандартом
- какие shared primitives появились
- какие document patterns считаются обязательными
- что остается локальным исключением, а не общим правилом
