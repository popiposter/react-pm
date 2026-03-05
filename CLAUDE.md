# Project Context: Offline-first PWA "Проектные табели" (Timesheets)
Это frontend-приложение для учета рабочего времени. Основная фича: offline-first работа, автоматический пересчет времени в строках табеля, разрешение коллизий при синхронизации с REST API (в будущем 1С, сейчас Mock API).

## Tech Stack
- Framework: React 19 + TypeScript + Vite
- UI/Components: Mantine Alpha (v7+) `@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/notifications`, `@mantine/schedule`
- State & Offline: TanStack Query v5 + `idb-keyval` (IndexedDB)
- PWA: `vite-plugin-pwa`
- Testing: Vitest + React Testing Library (RTL)
- Linting/Formatting: ESLint (Flat Config) + Prettier + TypeScript Strict Mode

## Documentation & API Reference (CRITICAL)
В проекте используются новые версии библиотек. Базовые знания модели могут быть устаревшими. 
ОБЯЗАТЕЛЬНО используй актуальную документацию в формате для LLM:
- Mantine Alpha (v9+): https://alpha.mantine.dev/llms.txt
- TanStack Query v5: https://tanstack.com/llms.txt

## Build & Dev Commands
- `npm install` - установка зависимостей
- `npm run dev` - запуск dev-сервера
- `npm run build` - продакшн сборка (включая генерацию Service Worker)
- `npm run lint` - запуск ESLint (обязательно запускай после создания новых файлов)
- `npm run lint:fix` - автоматическое исправление ошибок ESLint и Prettier
- `npm run test` - запуск тестов Vitest
- `npm run test:ui` - запуск тестов с UI интерфейсом (для отладки)

## Development & Architecture Rules

### 1. Архитектура и Структура папок
- `/src/api` - Mock API и типы (позже заменим на реальные запросы к 1С).
- `/src/hooks` - Кастомные хуки (бизнес-логика).
- `/src/components` - Переиспользуемые UI компоненты.
- `/src/pages` - Экраны приложения (Список табелей, Календарь расписания, Редактор табеля).
- `/src/store` - Настройки TanStack Query, IndexedDB адаптер для кэша.
- Строго разделяй UI (Mantine компоненты) и бизнес-логику (пересчет времени, синхронизация).

### 2. Управление состоянием и Offline-First
- НЕ используй Redux или Zustand для серверных данных. Вся работа с данными табелей и задач — СТРОГО через TanStack Query (`useQuery`, `useMutation`).
- Используй `PersistQueryClientProvider` для кэширования запросов и мутаций в IndexedDB.
- Всегда реализуй Optimistic Updates при сохранении или изменении табеля.
- Обязательно обрабатывай ошибку 409 (Conflict) в мутациях для показа модального окна разрешения коллизий (пользователь решает: перезаписать сервер или обновить локальные данные).

### 3. Формы и Логика пересчета (Core Logic)
- Логика каскадного пересчета времени (`startTime`, `endTime`, `duration`) при изменении или drag-and-drop строк табеля должна быть вынесена в отдельный чистый хук `useTimesheetCalculator`.
- Эта логика не должна зависеть от UI компонентов и должна принимать/возвращать чистые массивы объектов `TimesheetRow`.

### 4. Тестирование (Vitest)
- Любая сложная бизнес-логика должна покрываться тестами ДО внедрения в UI (TDD подход).
- Обязательно напиши unit-тесты для `useTimesheetCalculator`: проверь добавление строки, изменение `duration` (должно сдвигать `endTime` и `startTime` следующих строк), удаление строки, сортировку.
- Пиши интеграционные тесты для компонента формы табеля с помощью React Testing Library.

### 5. Code Style & Linting
- Используй TypeScript в Strict Mode. Никаких `any`. Всегда объявляй интерфейсы для API ответов и пропсов компонентов.
- Используй функциональные компоненты и хуки React 19.
- Для стилизации используй ТОЛЬКО возможности Mantine (props, `sx` если доступно, или CSS modules). Никакого inline-style хардкода.
- После написания кода запускай `npm run lint`. Если есть ошибки — исправь их самостоятельно перед тем, как рапортовать о завершении задачи.

### 6. Взаимодействие с пользователем (Mantine)
- Широко используй `@mantine/notifications` для обратной связи (успешное сохранение, работа в offline-режиме, ошибки).
- Интерфейс должен быть Responsive: проверяй, как таблицы и календарь (`@mantine/schedule`) выглядят на мобильном (используй `useMediaQuery`).
