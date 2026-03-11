import { expect, test } from '@playwright/test';
import { loginAsDemoUser, openTodayEditorFromDemo } from './helpers';

test('demo user can sign in and open timesheets journal', async ({ page }) => {
  await loginAsDemoUser(page);

  await expect(page.getByRole('heading', { name: /^Табели за/i })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Создать табель на сегодня' })
  ).toBeVisible();
});

test('demo user can seed data and open today timesheet editor', async ({ page }, testInfo) => {
  await openTodayEditorFromDemo(page);
  await expect(page.getByRole('button', { name: 'Добавить строку' })).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath('timesheet-editor.png'),
    fullPage: true,
  });
});
