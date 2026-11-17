import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Opens every page in each role's sidebar, on desktop and phone widths, and records
 * crashes, script errors, failed API calls and layouts wider than the screen.
 * Needs the API and seed data (npm run db:seed in KuraLearn-bn).
 */
const API_URL = process.env.API_URL ?? "http://localhost:4000/api/v1";
const PASSWORD = "Password123!";
const OUT = process.env.PAGES_REPORT_DIR ?? "test-results/all-pages";

mkdirSync(OUT, { recursive: true });

const ROLES = [
  { role: "student", email: "student.p1.1.kura@example.com" },
  { role: "parent", email: "parent1@example.com" },
  { role: "teacher", email: "teacher1.kura@example.com" },
  { role: "head-teacher", email: "head.kura@example.com" },
  { role: "director-of-studies", email: "dos.kura@example.com" },
  { role: "school-admin", email: "admin.kura@example.com" },
  { role: "super-admin", email: "super@kuralearn.demo" },
];

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "phone", width: 390, height: 844 },
];

type Issue = { role: string; viewport: string; path: string; kind: string; detail: string };
const BLOCKING = (i: Issue) =>
  ["script-error", "error-screen", "signed-out", "navigation"].includes(i.kind) || /api-5/.test(i.kind);

async function signIn(page: Page, email: string) {
  const response = await page.request.post(`${API_URL}/auth/login`, { data: { email, password: PASSWORD } });
  expect(response.ok(), `login ${email}`).toBeTruthy();
  const session = await response.json();
  await page.addInitScript((s) => {
    localStorage.setItem("kuralearn_user", JSON.stringify(s.user));
    localStorage.setItem("kuralearn_token", s.accessToken);
    localStorage.setItem("kuralearn_refresh_token", s.refreshToken);
    localStorage.setItem("kuralearn_locale", "en");
  }, session);
}

/** Every link in the sidebar, including sub-menus. */
async function sidebarPaths(page: Page) {
  await page.goto("/");
  await page.locator("aside nav a[href]").first().waitFor({ state: "attached", timeout: 20_000 });
  const hrefs = await page.locator("aside nav a[href]").evaluateAll((links) =>
    links.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""),
  );
  return [...new Set(hrefs.filter((href) => href.startsWith("/")))];
}

for (const { role, email } of ROLES) {
  for (const viewport of VIEWPORTS) {
    test(`${role} pages on ${viewport.name}`, async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await signIn(page, email);

      const issues: Issue[] = [];
      let current = "/";
      const record = (kind: string, detail: string) =>
        issues.push({ role, viewport: viewport.name, path: current, kind, detail: detail.slice(0, 300) });

      page.on("pageerror", (error) => record("script-error", error.message));
      page.on("console", (message) => {
        if (message.type() === "error" && !/favicon|Download the React DevTools/.test(message.text())) {
          record("console-error", message.text());
        }
      });
      page.on("response", (response) => {
        const url = response.url();
        if (!url.startsWith(API_URL) || response.request().method() === "OPTIONS") return;
        if (response.status() >= 400) {
          record(`api-${response.status()}`, `${response.request().method()} ${url.replace(API_URL, "")}`);
        }
      });

      // The sidebar is a drawer on phones, but its links are in the page either way.
      const paths = await sidebarPaths(page);
      expect(paths.length, "sidebar links").toBeGreaterThan(2);
      const shotDir = join(OUT, role, viewport.name);
      mkdirSync(shotDir, { recursive: true });

      for (const path of paths) {
        current = path;
        await page.goto(path, { timeout: 20_000 }).catch((error) => record("navigation", String(error)));
        // Some pages poll in the background, so "network idle" may never come: cap the wait.
        await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
        await page.waitForTimeout(400);

        if (/\/login$/.test(new URL(page.url()).pathname)) record("signed-out", page.url());
        const bodyText = (await page.locator("main").innerText().catch(() => "")) ?? "";
        if (/Something went wrong|Oops!|Page not found|404/i.test(bodyText.slice(0, 400))) {
          record("error-screen", bodyText.slice(0, 160).replace(/\s+/g, " "));
        }
        if (bodyText.trim().length < 20) record("empty-page", "main has almost no text");

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (overflow > 2) record("horizontal-scroll", `${overflow}px wider than the screen`);

        const file = `${path.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "home"}.png`;
        await page.screenshot({ path: join(shotDir, file), fullPage: false });
      }

      writeFileSync(join(OUT, `${role}-${viewport.name}.json`), JSON.stringify(issues, null, 2));
      // Fail on crashes and server errors; everything else is in the report for review.
      const blocking = issues.filter(BLOCKING);
      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    });
  }
}
