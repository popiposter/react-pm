import { expect, test, type Page } from '@playwright/test';

async function loginAsDemoUser(page: Page) {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Войти в приложение' })).toBeVisible();
  await page.getByLabel('Логин').fill('demo.user');
  await page.getByLabel('Пароль').fill('demo');
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page).toHaveURL(/\/timesheets/);
}

test('demo user can sign in and open timesheets journal', async ({ page }) => {
  await loginAsDemoUser(page);

  await expect(
    page.getByRole('heading', {
      name: 'Журнал табелей для ежедневной работы без лишней навигации.',
    })
  ).toBeVisible();
  await expect(page.getByText('Публичное демо на локальных данных.')).toBeVisible();
});

test('demo user can seed data and open today timesheet editor', async ({ page }, testInfo) => {
  await loginAsDemoUser(page);

  await page.getByRole('button', { name: 'Заполнить демо-данными' }).first().click();
  await expect(page.getByText('Демо-данные готовы')).toBeVisible();
  await expect(page.getByText('Найдено табелей:')).toBeVisible();

  await page.getByRole('button', { name: 'Создать табель на сегодня' }).click();

  await expect(page).toHaveURL(/\/timesheet\//);
  await expect(page.getByRole('heading', { name: /Табель за/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Рабочие записи за день' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Добавить строку' })).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath('timesheet-editor.png'),
    fullPage: true,
  });
});
