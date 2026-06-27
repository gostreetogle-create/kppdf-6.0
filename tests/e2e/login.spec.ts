import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Логин')).toBeVisible();
    await expect(page.getByLabel('Пароль')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Логин').fill('wrong');
    await page.getByLabel('Пароль').fill('wrong');
    await page.getByRole('button', { name: 'Войти' }).click();
    await expect(page.getByText('Неверный логин или пароль')).toBeVisible();
  });

  test('should show error banner for forbidden access', async ({ page }) => {
    await page.goto('/login?error=forbidden');
    await expect(page.getByText('Доступ запрещён')).toBeVisible();
  });

  test('should show error banner for viewer role', async ({ page }) => {
    await page.goto('/login?error=viewer');
    await expect(page.getByText('Роль «наблюдатель»')).toBeVisible();
  });

  test('should show error banner for expired session', async ({ page }) => {
    await page.goto('/login?error=expired');
    await expect(page.getByText('Сеанс истёк')).toBeVisible();
  });
});

test.describe('Health endpoint', () => {
  test('should return ok status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });
});
