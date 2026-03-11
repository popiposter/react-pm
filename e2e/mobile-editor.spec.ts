import { expect, test } from '@playwright/test';
import { openTodayEditorFromDemo } from './helpers';

test.skip(({ isMobile }) => !isMobile, 'Mobile-only editor flows');

test('mobile user can add and save a row from the compact editor flow', async ({ page }) => {
  await openTodayEditorFromDemo(page);

  await page.getByRole('button', { name: 'Строка' }).click();

  const lastCard = page.locator('article').last();
  await expect(lastCard.locator('select')).toBeVisible();

  await lastCard.locator('select').selectOption('task1');
  await lastCard.getByPlaceholder('Описание работ').fill('Мобильный сценарий сохранения');
  await page
    .getByRole('button', { name: 'Записать', exact: true })
    .last()
    .evaluate((button: HTMLButtonElement) => button.click());

  await expect(page.getByLabel('Notifications alt+T').getByText('Сохранено')).toBeVisible();
  await expect(page.getByText('Сохранено').first()).toBeVisible();
});

test('mobile user can duplicate a row through the actions menu', async ({ page }) => {
  await openTodayEditorFromDemo(page);

  const initialCards = await page.locator('article').count();
  const firstCard = page.locator('article').first();

  await firstCard.getByRole('button', { name: 'Действия со строкой' }).click();
  await page.getByRole('button', { name: 'Скопировать' }).click();

  await expect(page.getByText('Запись добавлена')).toBeVisible();
  await expect(page.locator('article')).toHaveCount(initialCards + 1);
});
