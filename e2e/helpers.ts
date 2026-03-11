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

export async function setUiShellState(
  page: Page,
  options: {
    theme?: 'light' | 'dark' | 'auto';
    sidebarCollapsed?: boolean;
  } = {}
) {
  await page.addInitScript((state) => {
    if (state.theme) {
      window.localStorage.setItem('timesheets:theme-mode', state.theme);
    }

    if (typeof state.sidebarCollapsed === 'boolean') {
      window.localStorage.setItem(
        'timesheets:sidebar-collapsed',
        String(state.sidebarCollapsed)
      );
    }
  }, options);
}

export async function openLoginPageForVisuals(
  page: Page,
  options: {
    theme?: 'light' | 'dark' | 'auto';
    sidebarCollapsed?: boolean;
  } = {}
) {
  await setUiShellState(page, options);
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Войти в приложение' })).toBeVisible();
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
  await expect(
    page.getByRole('main').getByRole('heading', { name: /Табель за/i })
  ).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByRole('main').getByRole('heading', { name: 'Рабочие записи за день' })
  ).toBeVisible({ timeout: 15000 });
}

export async function openDemoCenterForVisuals(
  page: Page,
  options: {
    theme?: 'light' | 'dark' | 'auto';
    sidebarCollapsed?: boolean;
  } = {}
) {
  await setUiShellState(page, options);
  await page.goto('/demo');
  await expect(page.getByRole('heading', { name: /Подготовить демонстрацию/i })).toBeVisible();
}

export async function openJournalForVisuals(
  page: Page,
  options: {
    theme?: 'light' | 'dark' | 'auto';
    sidebarCollapsed?: boolean;
  } = {}
) {
  await setUiShellState(page, options);
  await loginAsDemoUser(page);
  await expect(page.getByRole('heading', { name: /^Табели за/i })).toBeVisible();
}

export async function openTodayEditorForVisuals(
  page: Page,
  options: {
    theme?: 'light' | 'dark' | 'auto';
    sidebarCollapsed?: boolean;
  } = {}
) {
  await setUiShellState(page, options);
  await openTodayEditorFromDemo(page);
  await expect(page.getByRole('button', { name: 'Добавить строку' })).toBeVisible();
}

export async function openEditorForDateAfterDemoSeed(page: Page, date: string) {
  await seedDemoDataFromDemo(page);

  await page.goto(`/login?redirect=${encodeURIComponent(`/timesheet/${date}`)}`);
  await expect(page.getByRole('heading', { name: 'Войти в приложение' })).toBeVisible();
  await page.getByLabel('Логин').fill('demo.user');
  await page.getByLabel('Пароль').fill('demo');
  await page.getByRole('button', { name: 'Войти' }).click();

  await expect(page).toHaveURL(new RegExp(`/timesheet/${date}`));
  await expect(
    page.getByRole('main').getByRole('heading', { name: /Табель за/i })
  ).toBeVisible({ timeout: 15000 });
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
  await page.getByRole('button', { name: 'Записать', exact: true }).click();
  await expect(page.getByLabel('Notifications alt+T').getByText('Сохранено')).toBeVisible();
}
