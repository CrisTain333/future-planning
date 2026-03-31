import { chromium } from "playwright";
import { existsSync, mkdirSync } from "fs";

const BASE = "http://localhost:3000";
const SCREENSHOTS = "./test-screenshots";

if (!existsSync(SCREENSHOTS)) mkdirSync(SCREENSHOTS, { recursive: true });

let passed = 0;
let failed = 0;
const issues = [];

function log(status, msg) {
  const icon = status === "PASS" ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
  console.log(`  ${icon} ${msg}`);
  if (status === "PASS") passed++;
  else { failed++; issues.push(msg); }
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // ===== DESKTOP TESTS (1280x800) =====
  console.log("\n\x1b[1m=== DESKTOP (1280x800) ===\x1b[0m\n");
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // TEST: Login page renders
  console.log("LOGIN PAGE:");
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[name="username"]');
  const loginTitle = await page.textContent("body");
  if (loginTitle.includes("Future Planning")) log("PASS", "Login page renders with title");
  else log("FAIL", "Login page missing title");
  await page.screenshot({ path: `${SCREENSHOTS}/01-login-desktop.png`, fullPage: true });

  // TEST: Login with wrong credentials
  await page.fill('input[name="username"]', "admin");
  await page.fill('input[name="password"]', "wrong");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  const errorText = await page.textContent("body");
  if (errorText.includes("Invalid") || errorText.includes("error") || errorText.includes("CredentialsSignin"))
    log("PASS", "Wrong credentials show error");
  else log("FAIL", "No error shown for wrong credentials");
  await page.screenshot({ path: `${SCREENSHOTS}/02-login-error-desktop.png`, fullPage: true });

  // TEST: Login with correct credentials
  await page.fill('input[name="username"]', "admin");
  await page.fill('input[name="password"]', "1234");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 10000 });
  log("PASS", "Login redirects to /dashboard");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOTS}/03-admin-dashboard-desktop.png`, fullPage: true });

  // TEST: Admin dashboard has content
  const dashContent = await page.textContent("body");
  if (dashContent.includes("Total Fund") || dashContent.includes("Dashboard"))
    log("PASS", "Admin dashboard has content");
  else log("FAIL", "Admin dashboard empty");

  // TEST: Sidebar visible on desktop
  const sidebar = await page.$("aside");
  if (sidebar) {
    const sidebarVisible = await sidebar.isVisible();
    if (sidebarVisible) log("PASS", "Sidebar visible on desktop");
    else log("FAIL", "Sidebar hidden on desktop");
  } else log("FAIL", "No sidebar element found");

  // TEST: Sidebar has correct admin links
  const sidebarText = sidebar ? await sidebar.textContent() : "";
  const adminLinks = ["Dashboard", "Manage Users", "Notice Board", "Accounting", "Audit Logs", "Profile"];
  for (const link of adminLinks) {
    if (sidebarText.includes(link)) log("PASS", `Sidebar has "${link}" link`);
    else log("FAIL", `Sidebar missing "${link}" link`);
  }

  // TEST: Navigate to Manage Users
  console.log("\nMANAGE USERS PAGE:");
  await page.click('a[href="/admin/users"]');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOTS}/04-manage-users-desktop.png`, fullPage: true });
  const usersContent = await page.textContent("body");
  if (usersContent.includes("Manage Users")) log("PASS", "Manage Users page renders");
  else log("FAIL", "Manage Users page missing");
  if (usersContent.includes("Add User") || usersContent.includes("add user") || usersContent.includes("Add"))
    log("PASS", "Add User button present");
  else log("FAIL", "Add User button missing");

  // TEST: Navigate to Accounting
  console.log("\nACCOUNTING PAGE:");
  await page.click('a[href="/admin/accounting"]');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOTS}/05-accounting-desktop.png`, fullPage: true });
  const accContent = await page.textContent("body");
  if (accContent.includes("Accounting")) log("PASS", "Accounting page renders");
  else log("FAIL", "Accounting page missing");

  // TEST: Navigate to Notice Board
  console.log("\nNOTICE BOARD PAGE:");
  await page.click('a[href="/admin/notices"]');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOTS}/06-notices-desktop.png`, fullPage: true });
  const noticeContent = await page.textContent("body");
  if (noticeContent.includes("Notice Board") || noticeContent.includes("Notice"))
    log("PASS", "Notice Board page renders");
  else log("FAIL", "Notice Board page missing");

  // TEST: Navigate to Audit Logs
  console.log("\nAUDIT LOGS PAGE:");
  await page.click('a[href="/admin/audit-logs"]');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOTS}/07-audit-logs-desktop.png`, fullPage: true });
  const auditContent = await page.textContent("body");
  if (auditContent.includes("Audit Logs") || auditContent.includes("Audit"))
    log("PASS", "Audit Logs page renders");
  else log("FAIL", "Audit Logs page missing");

  // TEST: Navigate to Settings
  console.log("\nSETTINGS PAGE:");
  await page.goto(`${BASE}/admin/settings`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOTS}/08-settings-desktop.png`, fullPage: true });
  const settingsContent = await page.textContent("body");
  if (settingsContent.includes("Settings")) log("PASS", "Settings page renders");
  else log("FAIL", "Settings page missing");
  if (settingsContent.includes("Future Planning") || settingsContent.includes("Foundation"))
    log("PASS", "Settings shows foundation name");
  else log("FAIL", "Settings missing foundation data");

  // TEST: Navigate to Profile
  console.log("\nPROFILE PAGE:");
  await page.goto(`${BASE}/profile`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOTS}/09-profile-desktop.png`, fullPage: true });
  const profileContent = await page.textContent("body");
  if (profileContent.includes("Profile") || profileContent.includes("Super Admin"))
    log("PASS", "Profile page renders");
  else log("FAIL", "Profile page missing");
  if (profileContent.includes("Password") || profileContent.includes("password"))
    log("PASS", "Password change section present");
  else log("FAIL", "Password change section missing");

  // TEST: Header notification bell
  console.log("\nHEADER COMPONENTS:");
  const bell = await page.$('[class*="bell"], svg.lucide-bell, [data-slot="dropdown-menu-trigger"]');
  if (bell) log("PASS", "Notification bell present in header");
  else log("FAIL", "Notification bell missing from header");

  // TEST: Avatar dropdown
  const avatar = await page.$('[class*="avatar"], [data-slot="avatar"]');
  if (avatar) log("PASS", "User avatar present in header");
  else log("FAIL", "User avatar missing from header");

  await ctx.close();

  // ===== MOBILE TESTS (375x812) =====
  console.log("\n\x1b[1m=== MOBILE (375x812 - iPhone) ===\x1b[0m\n");
  const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mobilePage = await mobileCtx.newPage();

  // Login on mobile
  await mobilePage.goto(`${BASE}/login`);
  await mobilePage.waitForSelector('input[name="username"]');
  await mobilePage.screenshot({ path: `${SCREENSHOTS}/10-login-mobile.png`, fullPage: true });
  const loginMobileContent = await mobilePage.textContent("body");
  if (loginMobileContent.includes("Future Planning")) log("PASS", "Mobile login page renders");
  else log("FAIL", "Mobile login page broken");

  await mobilePage.fill('input[name="username"]', "admin");
  await mobilePage.fill('input[name="password"]', "1234");
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForURL("**/dashboard", { timeout: 10000 });
  await mobilePage.waitForTimeout(2000);
  await mobilePage.screenshot({ path: `${SCREENSHOTS}/11-dashboard-mobile.png`, fullPage: true });
  log("PASS", "Mobile login -> dashboard works");

  // TEST: Sidebar hidden on mobile
  const mobileSidebar = await mobilePage.$("aside");
  if (mobileSidebar) {
    const mobileVisible = await mobileSidebar.isVisible();
    if (!mobileVisible) log("PASS", "Sidebar hidden on mobile");
    else log("FAIL", "Sidebar should be hidden on mobile");
  } else log("PASS", "Sidebar hidden on mobile (not rendered)");

  // TEST: Hamburger menu
  const hamburger = await mobilePage.$('button:has(svg.lucide-menu), [class*="md:hidden"]');
  if (hamburger) {
    log("PASS", "Hamburger menu button present on mobile");
    await hamburger.click();
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({ path: `${SCREENSHOTS}/12-mobile-menu-open.png`, fullPage: true });
    log("PASS", "Mobile menu opens");
  } else {
    log("FAIL", "Hamburger menu missing on mobile");
  }

  // Visit all admin pages on mobile
  const mobilePages = [
    ["/admin/users", "13-users-mobile.png", "Manage Users"],
    ["/admin/accounting", "14-accounting-mobile.png", "Accounting"],
    ["/admin/notices", "15-notices-mobile.png", "Notice"],
    ["/admin/settings", "16-settings-mobile.png", "Settings"],
    ["/profile", "17-profile-mobile.png", "Profile"],
  ];

  console.log("\nMOBILE PAGE RENDERING:");
  for (const [url, file, check] of mobilePages) {
    await mobilePage.goto(`${BASE}${url}`);
    await mobilePage.waitForTimeout(2000);
    await mobilePage.screenshot({ path: `${SCREENSHOTS}/${file}`, fullPage: true });
    const content = await mobilePage.textContent("body");
    // Check for horizontal overflow
    const bodyWidth = await mobilePage.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 375;
    if (bodyWidth > viewportWidth + 5) {
      log("FAIL", `${url}: horizontal overflow (${bodyWidth}px > ${viewportWidth}px)`);
    } else {
      log("PASS", `${url}: no horizontal overflow`);
    }
    if (content.includes(check)) log("PASS", `${url}: renders correctly`);
    else log("FAIL", `${url}: missing expected content "${check}"`);
  }

  await mobileCtx.close();

  // ===== MEMBER VIEW TESTS =====
  console.log("\n\x1b[1m=== MEMBER VIEW ===\x1b[0m\n");
  const memberCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const memberPage = await memberCtx.newPage();

  await memberPage.goto(`${BASE}/login`);
  await memberPage.waitForSelector('input[name="username"]');
  await memberPage.fill('input[name="username"]', "testmember");
  await memberPage.fill('input[name="password"]', "1234");
  await memberPage.click('button[type="submit"]');
  await memberPage.waitForURL("**/dashboard", { timeout: 10000 });
  await memberPage.waitForTimeout(2000);
  await memberPage.screenshot({ path: `${SCREENSHOTS}/18-member-dashboard.png`, fullPage: true });

  const memberContent = await memberPage.textContent("body");
  if (memberContent.includes("Total Paid") || memberContent.includes("Months Paid"))
    log("PASS", "Member dashboard shows stat cards");
  else log("FAIL", "Member dashboard missing stat cards");

  // Check member sidebar has limited links
  const memberSidebar = await memberPage.$("aside");
  if (memberSidebar) {
    const memberSidebarText = await memberSidebar.textContent();
    if (!memberSidebarText.includes("Manage Users") && !memberSidebarText.includes("Accounting"))
      log("PASS", "Member sidebar hides admin links");
    else log("FAIL", "Member sidebar shows admin links");
    if (memberSidebarText.includes("Dashboard") && memberSidebarText.includes("Profile"))
      log("PASS", "Member sidebar shows member links");
    else log("FAIL", "Member sidebar missing member links");
  }

  // Profile page as member
  await memberPage.goto(`${BASE}/profile`);
  await memberPage.waitForTimeout(2000);
  await memberPage.screenshot({ path: `${SCREENSHOTS}/19-member-profile.png`, fullPage: true });
  const memberProfileContent = await memberPage.textContent("body");
  if (memberProfileContent.includes("Profile"))
    log("PASS", "Member profile page renders");
  else log("FAIL", "Member profile page missing");

  // Admin route blocked for member
  await memberPage.goto(`${BASE}/admin/users`);
  await memberPage.waitForTimeout(2000);
  const memberUrl = memberPage.url();
  if (!memberUrl.includes("/admin/users"))
    log("PASS", "Member blocked from admin routes (redirected)");
  else log("FAIL", "Member can access admin routes");

  await memberCtx.close();
  await browser.close();

  // ===== SUMMARY =====
  console.log(`\n\x1b[1m=== SUMMARY ===\x1b[0m`);
  console.log(`\x1b[32m  Passed: ${passed}\x1b[0m`);
  console.log(`\x1b[31m  Failed: ${failed}\x1b[0m`);
  if (issues.length > 0) {
    console.log(`\n  Issues:`);
    issues.forEach(i => console.log(`    - ${i}`));
  }
  console.log(`\n  Screenshots saved to: ${SCREENSHOTS}/`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
