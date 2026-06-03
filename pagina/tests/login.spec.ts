import { expect, type Page, test } from '@playwright/test';

const loginPath = '/login';

async function abrirFormularioLogin(page: Page) {
  await page.goto(loginPath);

  const emailInput = page.getByPlaceholder('correo@ejemplo.com');

  if (!(await emailInput.isVisible())) {
    await page.getByRole('button', { name: 'Entrar a Premier Hub' }).click();
  }

  await expect(emailInput).toBeVisible();
}

test.describe('Login', () => {
  test('inicia sesion con usuario real', async ({ page }) => {
    await abrirFormularioLogin(page);

    await page.getByPlaceholder('correo@ejemplo.com').fill('bebe@gmail.com');
    await page.getByPlaceholder('********').fill('1234');

    const responsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes('/api/auth/login') &&
        response.request().method() === 'POST'
      );
    });

    await page.getByRole('button', { name: 'Iniciar sesion' }).click();

    const response = await responsePromise;
    const data = await response.json();

    expect(response.ok()).toBeTruthy();
    expect(data.success).toBeTruthy();
  });

  test('muestra error si las credenciales son incorrectas', async ({ page }) => {
    await abrirFormularioLogin(page);

    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Credenciales incorrectas',
        }),
      });
    });

    await page.getByPlaceholder('correo@ejemplo.com').fill('mal@test.com');
    await page.getByPlaceholder('********').fill('wrong');

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toBe('Credenciales incorrectas');
      await dialog.accept();
    });

    await page.getByRole('button', { name: 'Iniciar sesion' }).click();
  });

  test('permite mostrar y ocultar la contrasena', async ({ page }) => {
    await abrirFormularioLogin(page);

    const passwordInput = page.getByPlaceholder('********');

    await expect(passwordInput).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: 'Mostrar contrasena' }).click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await page.getByRole('button', { name: 'Ocultar contrasena' }).click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('valida que las contrasenas coincidan al registrar', async ({ page }) => {
    await abrirFormularioLogin(page);

    await page.getByRole('button', { name: 'Registrate' }).click();

    await page.getByPlaceholder('correo@ejemplo.com').fill('nuevo@test.com');
    await page.getByPlaceholder('ej. PremierFan99').fill('PremierFan99');
    await page.getByPlaceholder('********').nth(0).fill('123456');
    await page.getByPlaceholder('********').nth(1).fill('abcdef');

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toBe('Las contrasenas no coinciden');
      await dialog.accept();
    });

    await page.getByRole('button', { name: 'Crear cuenta' }).click();
  });
});