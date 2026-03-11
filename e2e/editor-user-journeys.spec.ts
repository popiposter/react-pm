import { expect, test } from '@playwright/test';
import { addValidDesktopRow, openTodayEditorFromDemo, saveTimesheet } from './helpers';

test('editor blocks saving when a row is incomplete', async ({ page }) => {
  await openTodayEditorFromDemo(page);

  await page.getByRole('button', { name: 'Добавить строку' }).click();
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click();

  await expect(page.getByText('Нужно проверить строки табеля')).toBeVisible();
  await expect(page.getByText('Проблемных строк: 1').first()).toBeVisible();
  await expect(page).toHaveURL(/\/timesheet\//);
});

test('user can add a row and save the timesheet', async ({ page }) => {
  await openTodayEditorFromDemo(page);

  await addValidDesktopRow(page, 'Подготовка и проверка рабочего сценария');
  await saveTimesheet(page);

  await expect(page.getByText('Все изменения сохранены').first()).toBeVisible();
  await expect(page.getByText('Черновик не сохранен')).toHaveCount(0);
});

test('user can cancel leaving a dirty editor', async ({ page }) => {
  await openTodayEditorFromDemo(page);
  await addValidDesktopRow(page, 'Черновик для проверки блокировки');

  await page.getByRole('button', { name: 'К списку' }).click();

  await expect(page.getByRole('heading', { name: 'У вас есть несохраненные изменения' })).toBeVisible();
  await page.getByRole('button', { name: 'Отмена' }).click();

  await expect(page.getByRole('heading', { name: /Табель за/i })).toBeVisible();
  await expect(page.getByText('Есть несохраненные изменения').first()).toBeVisible();
});

test('user can leave a dirty editor without saving', async ({ page }) => {
  await openTodayEditorFromDemo(page);
  await addValidDesktopRow(page, 'Черновик для выхода без сохранения');

  await page.getByRole('button', { name: 'К списку' }).click();
  await expect(page.getByRole('heading', { name: 'У вас есть несохраненные изменения' })).toBeVisible();
  await page.getByRole('button', { name: 'Уйти без сохранения' }).click();

  await expect(page).toHaveURL(/\/timesheets/);
  await expect(page.getByRole('heading', { name: /Журнал табелей/i })).toBeVisible();
});

test('user can save and leave from the dirty-state modal', async ({ page }) => {
  await openTodayEditorFromDemo(page);
  await addValidDesktopRow(page, 'Сохранение через модалку ухода');

  await page.getByRole('button', { name: 'К списку' }).click();
  await expect(page.getByRole('heading', { name: 'У вас есть несохраненные изменения' })).toBeVisible();
  await page.getByRole('button', { name: 'Сохранить и уйти' }).click();

  await expect(page.getByText('Сохранено')).toBeVisible();
  await expect(page).toHaveURL(/\/timesheets/);
});
