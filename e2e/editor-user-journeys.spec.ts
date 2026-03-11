import { expect, test } from '@playwright/test';
import {
  addValidDesktopRow,
  dateDaysAgo,
  expectEditorScreen,
  openEditorForDateAfterDemoSeed,
  openTodayEditorFromDemo,
  saveTimesheet,
  todayDate,
} from './helpers';

test.skip(({ isMobile }) => isMobile, 'Desktop-only editor flows');

test('editor blocks saving when a row is incomplete', async ({ page }) => {
  await openTodayEditorFromDemo(page);

  await page.getByRole('button', { name: 'Добавить строку' }).click();
  await page.getByRole('button', { name: 'Записать', exact: true }).click();

  await expect(page.getByText('Нужно проверить строки табеля')).toBeVisible();
  await expect(page.getByText('Ошибок в строках: 1').first()).toBeVisible();
  await expect(page).toHaveURL(/\/timesheet\//);
});

test('user can add a row and save the timesheet', async ({ page }) => {
  await openTodayEditorFromDemo(page);

  await addValidDesktopRow(page, 'Подготовка и проверка рабочего сценария');
  await saveTimesheet(page);

  await expect(page.getByLabel('Notifications alt+T').getByText('Сохранено')).toBeVisible();
  await expect(page.getByText('Есть несохраненные изменения')).toHaveCount(0);
});

test('user can cancel leaving a dirty editor', async ({ page }) => {
  await openTodayEditorFromDemo(page);
  await addValidDesktopRow(page, 'Черновик для проверки блокировки');

  await page.getByRole('button', { name: 'К списку' }).click();

  await expect(page.getByRole('heading', { name: 'У вас есть несохраненные изменения' })).toBeVisible();
  await page.getByRole('button', { name: 'Отмена' }).click();

  await expectEditorScreen(page);
  await expect(page.getByText('Не записано').first()).toBeVisible();
});

test('user can leave a dirty editor without saving', async ({ page }) => {
  await openTodayEditorFromDemo(page);
  await addValidDesktopRow(page, 'Черновик для выхода без сохранения');

  await page.getByRole('button', { name: 'К списку' }).click();
  await expect(page.getByRole('heading', { name: 'У вас есть несохраненные изменения' })).toBeVisible();
  await page.getByRole('button', { name: 'Уйти без сохранения' }).click();

  await expect(page).toHaveURL(/\/timesheets/);
  await expect(page.getByRole('heading', { name: /^Табели за/i })).toBeVisible();
});

test('user can save and leave from the dirty-state modal', async ({ page }) => {
  await openTodayEditorFromDemo(page);
  await addValidDesktopRow(page, 'Сохранение через модалку ухода');

  await page.getByRole('button', { name: 'К списку' }).click();
  await expect(page.getByRole('heading', { name: 'У вас есть несохраненные изменения' })).toBeVisible();
  await page.getByRole('button', { name: 'Сохранить и уйти' }).click();

  await expect(page.getByLabel('Notifications alt+T').getByText('Сохранено')).toBeVisible();
  await expect(page).toHaveURL(/\/timesheets/);
});

test('user can save and close from the editor toolbar', async ({ page }) => {
  await openTodayEditorFromDemo(page);
  await addValidDesktopRow(page, 'Закрытие после явного сохранения');

  await page.getByRole('button', { name: 'Записать и закрыть' }).click();

  await expect(page.getByLabel('Notifications alt+T').getByText('Сохранено')).toBeVisible();
  await expect(page).toHaveURL(/\/timesheets/);
});

test('user can delete a row after confirmation', async ({ page }) => {
  await openTodayEditorFromDemo(page);
  await addValidDesktopRow(page, 'Строка для удаления');

  const rowsBeforeDelete = page.locator('tbody tr');
  const initialCount = await rowsBeforeDelete.count();
  expect(initialCount).toBeGreaterThan(0);

  await rowsBeforeDelete.last().getByRole('button', { name: 'Удалить строку' }).click();
  await expect(page.getByRole('heading', { name: 'Удалить строку?' })).toBeVisible();
  await page.getByText('Удалить строку', { exact: true }).last().click();

  await expect(page.getByText('Строка удалена')).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(initialCount - 1);
});

test('user can copy an existing timesheet to today', async ({ page }) => {
  const yesterday = dateDaysAgo(1);
  const today = todayDate();

  await openEditorForDateAfterDemoSeed(page, yesterday);
  await page.getByRole('button', { name: 'Действия с табелем' }).click();
  await page.getByRole('button', { name: 'Скопировать' }).click();

  await expect(page.getByText('Копия создана')).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/timesheet/${today}`));
  await expectEditorScreen(page);
});

test('offline save shows local-save message and sync can be run later', async ({ page, context }) => {
  await openTodayEditorFromDemo(page);
  await addValidDesktopRow(page, 'Офлайн-сохранение для очереди синхронизации');

  await context.setOffline(true);
  await page.getByRole('button', { name: 'Записать', exact: true }).click();

  await expect(page.getByLabel('Notifications alt+T').getByText('Сохранено')).toBeVisible();
  await expect(page.getByText('Табель сохранен локально (нет сети)')).toBeVisible();
  await expect(page.getByText('Синхронизация: 1')).toBeVisible();

  await context.setOffline(false);
  await page.getByText('Синхронизация: 1').click();

  await expect(page.getByText('Синхронизация завершена')).toBeVisible();
  await expect(page.getByText(/Осталось в очереди: 0|Синхронизировано: 1, очередь пуста/)).toBeVisible();
  await expect(page.getByText('Синхронизация: 1')).toHaveCount(0);
});
