# Проектные табели: рабочий контекст

## Кратко

Это offline-first PWA для учета рабочего времени. Приложение уже переведено на современный web shell с TanStack Router, TanStack Query, локальным data layer, демо-авторизацией и IndexedDB persistence. Основной пользовательский сценарий сейчас: login -> список табелей -> редактор табеля.

## Что есть в продукте

- защищенные маршруты
- login page с demo auth
- журнал табелей с фильтрами в URL
- редактор табеля с offline сохранением
- sync queue и ручной запуск синхронизации
- PWA и installable build

## Что важно помнить

- Mantine runtime больше не используется
- календарный экран убран из основного сценария
- данные идут через repository layer
- auth и sync вынесены в transport factories
- сейчас backend-поведение эмулируется локально, но контракт уже подготавливается к 1С

## Demo auth

- дефолтные значения на форме: `demo.user` / `demo`
- текущая demo-логика принимает любую непустую пару
- роли пользователей пока не реализованы

## Главные каталоги

- `src/routes` — маршруты TanStack Router
- `src/pages` — экранные компоненты
- `src/features/auth` — auth provider, service, transports
- `src/data/repositories` — repository layer
- `src/data/sync` — sync transports и конфиг
- `src/hooks` — query hooks и UX hooks

## Целевой вектор

Не переписывать UI под 1С-интеграцию, а подключить реальный backend через уже выделенные abstraction layers:

- `OneCAuthTransport`
- `OneCSyncTransport`
- будущий remote repository/read adapter
