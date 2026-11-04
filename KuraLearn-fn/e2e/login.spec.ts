import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/welcome");
  });

  test("should show welcome page", async ({ page }) => {
    await expect(page.locator("text=Welcome to KuraLearn").first()).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to login page", async ({ page }) => {
    await page.click("text=Sign In");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should show validation errors for empty form", async ({ page }) => {
    await page.goto("/login");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=required").or(page.locator("text=invalid"))).toBeVisible();
  });

  test("should login with valid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"], input[name="email"]', "student@kuralearn.demo");
    await page.fill('input[type="password"], input[name="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard|student)/, { timeout: 15000 });
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"], input[name="email"]', "wrong@email.com");
    await page.fill('input[type="password"], input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Invalid credentials")).toBeVisible({ timeout: 10000 });
  });
});
