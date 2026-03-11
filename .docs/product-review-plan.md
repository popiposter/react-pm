# Product Review And Delivery Plan

Last updated: 2026-03-11
Review basis: live walkthrough in browser via Playwright on desktop and mobile
Reviewer lens: enterprise user, product acceptance, daily operational efficiency

## Goal

Сделать интерфейс табелей не просто аккуратным демо, а быстрым рабочим инструментом, в котором пользователь:

- сразу понимает, куда нажимать
- видит главный объект работы без лишнего скролла
- не тратит внимание на второстепенные объяснения
- может быстро открыть день, внести часы и сохранить изменения

## Review Summary

Сильные стороны текущего продукта:

- визуально приложение уже выглядит современно, чисто и цельно
- есть хороший базовый visual language без legacy-шума
- сценарии login -> journal -> editor уже рабочие
- mobile layout не сломан структурно и в целом адаптирован
- editor уже передает ощущение прикладного рабочего экрана

Главные проблемы:

- продукт слишком много объясняет до того, как дает работать
- над журналом и редактором слишком много “верхнего шума”
- mobile-сценарий перегружен вертикально
- визуальная иерархия недостаточно жестко расставляет приоритеты
- часть терминов и microcopy выглядит как демо-витрина, а не как production UI

## Prioritized Backlog

### Must

#### 1. Make login task-first

Проблема:
На login пользователь сначала видит большой explain-block, а уже потом форму. На mobile форма уходит слишком низко.

Что сделать:

- поднять форму и CTA выше первого экрана
- сократить или свернуть левый промо-блок на mobile
- уменьшить объем вводного текста
- сделать demo-действия вторичными относительно входа

Критерий готовности:

- на mobile поля логина и кнопка входа видны без длинного скролла
- на desktop форма визуально доминирует над маркетинговым контентом

#### 2. Move timesheets journal above the fold

Проблема:
Onboarding, hero, summary и пояснения занимают слишком много высоты до первого табеля.

Что сделать:

- сократить hero-блок
- свернуть demo onboarding в компактный dismissible блок
- уменьшить высоту summary
- приблизить фильтры и список табелей к началу страницы

Критерий готовности:

- на desktop первый экран показывает заголовок, основные действия, фильтры и начало списка
- на mobile путь до первого табеля заметно сокращен

#### 3. Reduce mobile editor friction

Проблема:
Sticky action bar и статусные блоки съедают много высоты. После добавления строки рабочая область выглядит тесной.

Что сделать:

- уменьшить нижнюю панель действий
- проверить safe-area и перекрытие формы
- сократить верхние статусные блоки на mobile
- сделать так, чтобы после добавления строки фокус был на полях, а не на chrome интерфейса

Критерий готовности:

- новая строка открывается без ощущения “зажатого” экрана
- действия сохранить/назад не мешают редактированию

#### 4. Strengthen information hierarchy

Проблема:
Слишком много одинаково заметных бейджей, карточек и мягких акцентов. Главный action не всегда считывается первым.

Что сделать:

- оставить один явный primary CTA на экран
- ослабить вторичные декоративные плашки
- повысить контраст у ключевых данных и действий
- сократить количество одновременных status badges

Критерий готовности:

- за 3-5 секунд новый пользователь понимает главный action на экране
- взгляд быстрее приходит к списку, форме или кнопке сохранения

### Should

#### 5. Unify UI language

Проблема:
В UI смешаны русские и английские термины.

Что сделать:

- выбрать единый язык интерфейса
- привести к одной системе названия demo state, navigation, banners и labels

Критерий готовности:

- исчезают смешанные конструкции вроде `Public demo`, `Timesheets`, `Demo onboarding`

Статус:

- 2026-03-11: начат перевод shell и основных пользовательских экранов на русский

#### 6. Compress editor header

Проблема:
Верх редактора дает много контекста, но замедляет переход к строкам табеля.

Что сделать:

- уменьшить высоту hero editor header
- объединить online/offline, validation и dirty-state в компактную status strip
- оставить рабочую таблицу главным фокусом

Критерий готовности:

- на desktop и mobile строки табеля начинаются выше

#### 7. Revisit sidebar usefulness

Проблема:
Левый sidebar на desktop занимает ширину, но не дает столько полезной навигации, сколько мог бы.

Что сделать:

- пересмотреть плотность и смысл блока с описанием
- либо упростить sidebar, либо усилить его как рабочую навигацию

Критерий готовности:

- sidebar либо помогает быстрее перемещаться, либо почти не отвлекает

#### 8. Mobile safe-area and PWA shell polish

Проблема:

На реальном устройстве нижние действия и bottom navigation могут конфликтовать с gesture area. Также shell приложения можно сильнее интегрировать с браузером и PWA-режимом.

Что сделать:

- увеличить безопасный нижний отступ у mobile navigation и bottom action bars поверх `safe-area-inset-bottom`
- использовать `viewport-fit=cover`
- синхронизировать `theme-color` с цветом верхнего toolbar/shell
- проверить standalone/PWA-режим на iOS и Android
- оценить install UX и полезные platform-specific enhancements

Критерий готовности:

- на устройствах с жестовой навигацией нижние действия не упираются в gesture zone
- верхний browser/PWA chrome визуально согласован с приложением
- install/open-in-app сценарий не выглядит “сырой веб-страницей”

### Nice To Have

#### 9. Add visual regression checkpoints

Что сделать:

- сохранить эталонные Playwright-снимки для `login`, `timesheets`, `editor`
- проверять desktop и mobile ключевые состояния

#### 10. Create a “demo mode” and “daily work mode” presentation strategy

Что сделать:

- для демо оставить onboarding/help affordances
- для рабочего режима сделать более плотный operational UI

Статус:

- 2026-03-11: решение принято, стратегия вынесена в `.docs/demo-mode-strategy.md`
- 2026-03-11: начат Phase A с `appConfig`, отдельным `/demo` и очисткой рабочих экранов

## Suggested Delivery Sequence

### Phase 1

- login simplification
- timesheets header compression
- journal above-the-fold

### Phase 2

- mobile editor cleanup
- editor header compression
- information hierarchy pass
- mobile safe-area and PWA shell polish

### Phase 3

- language unification
- sidebar cleanup
- visual regression baselines

### Phase 4

- demo mode separation
- app mode hardening for `prod`
- smoke coverage for `/demo`

## Acceptance Checklist

Перед закрытием каждого UX-этапа проверять:

- desktop 1440 px
- mobile around 390 px width
- login first screen
- timesheets empty state
- timesheets seeded state
- timesheet editor empty state
- timesheet editor with one row
- primary action obvious in under 5 seconds
- core task doable without reading long explanatory text

## Working Notes

Этот документ живой. После каждого заметного изменения интерфейса обновлять:

- что уже исправлено
- что еще болит
- что поменялось в приоритетах
- какие новые regressions или UX debt появились

### 2026-03-11 - Phase 1 started

Сделано:

- `login` переведен в более task-first layout
- форма входа и основной CTA подняты выше
- информационный блок справа стал вторичным
- `timesheets` onboarding сжат до компактного banner/action strip
- верх главного экрана сокращен, журнал поднят выше fold

Что еще осталось в рамках следующего UX-прохода:

- mobile editor cleanup
- дополнительная чистка visual hierarchy
- унификация языка интерфейса

### 2026-03-11 - Phase 2 editor pass

Сделано:

- верх редактора табеля стал компактнее
- online/offline и validation summary сведены к коротким status strips
- mobile summary сокращен до более плотной сетки
- нижняя mobile action bar уменьшена по высоте
- после добавления строки на mobile новая запись автоматически раскрывается и подводится к пользователю

Что еще можно улучшить следующим проходом:

- уменьшить ощущение наложения sticky bar на мобильную рабочую область
- точнее управлять фокусом и прокруткой после добавления новой строки
- продолжить language cleanup в header и shell

### 2026-03-11 - Demo mode split started

Сделано:

- оформлена стратегия разделения demo и рабочего контура в `.docs/demo-mode-strategy.md`
- введен единый `appConfig` для `demo|prod`
- добавлен отдельный `/demo` как presentation entrypoint
- demo seed/reset и onboarding убраны с `login` и `timesheets`

Что еще осталось:

- добавить smoke coverage для `/demo`
- позже согласовать production login UX после появления реального auth transport

Дополнительно:

- 2026-03-11: `prod`-hardening выполнен, `/demo` больше не попадает в production-like bundle по умолчанию
