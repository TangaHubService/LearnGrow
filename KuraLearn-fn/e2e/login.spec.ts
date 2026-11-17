import { test, expect, type Page } from "@playwright/test";

// Seeded by `npm run db:seed` in KuraLearn-bn (see LOGIN_CREDENTIALS.md).
const STUDENT_EMAIL = "student.p1.1.kura@example.com";
const SEED_PASSWORD = "Password123!";

const emailInput = (page: Page) => page.getByLabel("Email or username");
const passwordInput = (page: Page) => page.getByLabel("Password", { exact: true });
const submitButton = (page: Page) => page.locator("form").getByRole("button", { name: /sign in/i });

test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/welcome");
  });

  test("should show welcome page", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Run your whole school",
      { timeout: 10000 },
    );
  });

  test("should navigate to login page", async ({ page }) => {
    await page.click("text=Sign In");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should block submitting an empty form", async ({ page }) => {
    await page.goto("/login");
    await submitButton(page).click();

    // The fields use native `required` validation, so the browser stops the submit.
    await expect(page).toHaveURL(/\/login/);
    const emailValid = await emailInput(page).evaluate((el) => (el as HTMLInputElement).validity.valid);
    expect(emailValid).toBe(false);
  });

  test("should login with valid credentials", async ({ page }) => {
    await page.goto("/login");
    await emailInput(page).fill(STUDENT_EMAIL);
    await passwordInput(page).fill(SEED_PASSWORD);
    await submitButton(page).click();
    // Students get their dashboard at the root route (see RoleHome in src/app/guards.tsx).
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
    await expect(page.getByText("Hi, Aline")).toBeVisible({ timeout: 15000 });
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await emailInput(page).fill("wrong@email.com");
    await passwordInput(page).fill("wrongpassword");
    await submitButton(page).click();
    await expect(page.getByText("Invalid credentials")).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
