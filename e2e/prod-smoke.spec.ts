import { expect, test } from '@playwright/test';

test('prod mode hides demo affordances and redirects demo route to login', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'Войти в приложение' })).toBeVisible();
  await expect(page.getByLabel('Логин')).toHaveValue('');
  await expect(page.getByLabel('Пароль')).toHaveValue('');
  await expect(page.getByText('Открыть демо-центр')).toHaveCount(0);

  await page.goto('/demo');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByLabel('Логин')).toHaveValue('');
  await expect(page.getByText('Открыть демо-центр')).toHaveCount(0);
});
