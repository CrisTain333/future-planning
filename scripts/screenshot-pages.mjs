import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const DIR = "./test-screenshots/redesign";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // Login as admin
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[name="username"]');
  await page.fill('input[name="username"]', "admin");
  await page.fill('input[name="password"]', "1234");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 30000 });
  await page.waitForTimeout(3000);

  const pages = [
    ["/dashboard", "dashboard.png"],
    ["/admin/users", "users.png"],
    ["/admin/accounting", "accounting.png"],
    ["/admin/notices", "notices.png"],
    ["/admin/audit-logs", "audit-logs.png"],
    ["/admin/settings", "settings.png"],
    ["/profile", "profile.png"],
  ];

  for (const [url, file] of pages) {
    await page.goto(`${BASE}${url}`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${DIR}/${file}`, fullPage: true });
    console.log(`  ${url} -> ${file}`);
  }

  await browser.close();
  console.log("Done");
}

run();
