import { expect, type Page } from '@playwright/test';

export const todayDate = () => new Date().toISOString().split('T')[0];

export const dateDaysAgo = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

export async function loginAsDemoUser(page: Page) {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Войти в приложение' })).toBeVisible();
  await page.getByLabel('Логин').fill('demo.user');
  await page.getByLabel('Пароль').fill('demo');
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page).toHaveURL(/\/timesheets/);
}

export async function seedDemoDataFromDemo(page: Page) {
  await page.goto('/demo');
  await expect(page.getByRole('heading', { name: /Подготовить демонстрацию/i })).toBeVisible();

  await page.getByRole('button', { name: 'Заполнить базу' }).click();
  await expect(page.getByText('Демо-база готова')).toBeVisible();
}

export async function openTodayEditorFromDemo(page: Page) {
  await seedDemoDataFromDemo(page);

  await page.getByRole('button', { name: 'Открыть сегодня' }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel('Логин').fill('demo.user');
  await page.getByLabel('Пароль').fill('demo');
  await page.getByRole('button', { name: 'Войти' }).click();

  await expect(page).toHaveURL(/\/timesheet\//);
  await expect(page.getByRole('heading', { name: /Табель за/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Рабочие записи за день' })).toBeVisible();
}

export async function openEditorForDateAfterDemoSeed(page: Page, date: string) {
  await seedDemoDataFromDemo(page);

  await page.goto(`/login?redirect=${encodeURIComponent(`/timesheet/${date}`)}`);
  await expect(page.getByRole('heading', { name: 'Войти в приложение' })).toBeVisible();
  await page.getByLabel('Логин').fill('demo.user');
  await page.getByLabel('Пароль').fill('demo');
  await page.getByRole('button', { name: 'Войти' }).click();

  await expect(page).toHaveURL(new RegExp(`/timesheet/${date}`));
  await expect(page.getByRole('heading', { name: /Табель за/i })).toBeVisible();
}

export async function addValidDesktopRow(
  page: Page,
  description = 'Работа по пользовательскому сценарию'
) {
  await page.getByRole('button', { name: 'Добавить строку' }).click();

  const lastRow = page.locator('tbody tr').last();
  await lastRow.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Разработка фронтенда' }).click();
  await lastRow.getByPlaceholder('Описание работ').fill(description);

  return lastRow;
}

export async function saveTimesheet(page: Page) {
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page.getByText('Сохранено')).toBeVisible();
}
