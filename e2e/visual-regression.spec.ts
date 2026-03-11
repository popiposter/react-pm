import { expect, test } from '@playwright/test';
import {
  openDemoCenterForVisuals,
  openJournalForVisuals,
  openLoginPageForVisuals,
  openTodayEditorForVisuals,
} from './helpers';

test.describe('visual regression checkpoints', () => {
  test('login screen matches baseline', async ({ page }) => {
    await openLoginPageForVisuals(page, {
      theme: 'light',
      sidebarCollapsed: false,
    });

    await expect(page).toHaveScreenshot('login-screen.png', {
      animations: 'disabled',
      fullPage: true,
    });
  });

  test('demo center matches baseline', async ({ page }) => {
    await openDemoCenterForVisuals(page, {
      theme: 'light',
      sidebarCollapsed: false,
    });

    await expect(page).toHaveScreenshot('demo-center.png', {
      animations: 'disabled',
      fullPage: true,
    });
  });

  test('journal matches baseline', async ({ page }) => {
    await openJournalForVisuals(page, {
      theme: 'light',
      sidebarCollapsed: false,
    });

    await expect(page).toHaveScreenshot('timesheets-journal.png', {
      animations: 'disabled',
      fullPage: true,
    });
  });

  test('editor matches baseline', async ({ page }) => {
    await openTodayEditorForVisuals(page, {
      theme: 'light',
      sidebarCollapsed: false,
    });

    await expect(page).toHaveScreenshot('timesheet-editor.png', {
      animations: 'disabled',
      fullPage: true,
    });
  });
});
