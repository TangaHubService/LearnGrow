import { test, expect } from "@playwright/test";

/**
 * Offline mode. Needs a production build (`npm run build && npm run preview`), because the
 * service worker that keeps pages and data on the device only exists in a build.
 */
const API_URL = process.env.API_URL ?? "http://localhost:4000/api/v1";

test("pages already opened still work without a connection, and logout clears them", async ({ page, context }) => {
  test.setTimeout(120_000);
  const login = await page.request.post(`${API_URL}/auth/login`, {
    data: { email: "teacher1.kura@example.com", password: "Password123!" },
  });
  const session = await login.json();
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem("kuralearn_user", JSON.stringify(s.user));
      localStorage.setItem("kuralearn_token", s.accessToken);
      localStorage.setItem("kuralearn_refresh_token", s.refreshToken);
      localStorage.setItem("kuralearn_locale", "en");
      sessionStorage.setItem("seeded", "1");
    }
  }, session);

  // Online: install the service worker and open the dashboard so its data is kept.
  await page.goto("/teacher");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // now controlled by the service worker
  await expect(page.getByText("Welcome back,")).toBeVisible({ timeout: 20_000 });
  await page.waitForLoadState("networkidle");

  // Offline: reload the page. The app and its last data come from the device.
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText("Welcome back,")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("status").filter({ hasText: "Offline" })).toBeVisible();

  // Logging out removes this teacher's saved data from the device.
  await context.setOffline(false);
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.locator("header").getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect
    .poll(() => page.evaluate(async () => (await caches.keys()).includes("api-cache")))
    .toBe(false);
  expect(await page.evaluate(() => localStorage.getItem("KURALearn_QUERY_CACHE"))).toBeNull();
});
