# Деплой

## Локальная сборка

```bash
npm install
npm run build
```

Для локального просмотра:

```bash
npm run preview
```

## GitHub Pages

Приложение можно публиковать на GitHub Pages как project site.

Для этого в проекте заложены:

- поддержка `VITE_APP_BASE_PATH`
- совместимый `router.basepath`
- workflow деплоя через GitHub Actions
- SPA fallback через `404.html`

### Важная оговорка

Если сайт будет жить в репозитории `react-pm`, то base path должен быть `/react-pm/`.

То есть production environment для Pages должен собираться примерно так:

```env
VITE_APP_BASE_PATH=/react-pm/
```

### Приватный репозиторий и публичность сайта

Приватный репозиторий не означает автоматически приватный сайт.

Для обычного GitHub Pages важно учитывать:

- GitHub Pages доступен и для приватных репозиториев на подходящих планах
- опубликованный сайт обычно остается публично доступным в интернете
- приватная публикация с access control зависит от плана и сценария владения репозиторием

Поэтому перед включением Pages убедитесь, что на сайте нет чувствительных данных, секретов и закрытой внутренней информации.

## PWA на GitHub Pages

PWA installable и service worker могут работать на GitHub Pages, потому что Pages отдается по HTTPS.

Но нужно учитывать:

- GitHub Pages остается статическим хостингом
- background sync и будущая реальная синхронизация с 1С все равно зависят от клиентской логики и доступности backend
- при смене base path важно не ломать пути к manifest и static assets

## Рекомендуемый production flow

1. Push в `main`
2. GitHub Actions собирает проект
3. Артефакт публикуется в GitHub Pages
4. SPA fallback поддерживает client-side routing

## Что еще можно добавить позже

- отдельный staging deployment
- preview deployments
- кастомный домен
- раздельные env для demo и real backend
