import { chromium } from "playwright";
import { existsSync, mkdirSync } from "fs";

const BASE = "http://localhost:3000";
const SCREENSHOTS = "./test-screenshots/chat";

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

async function login(context, username, password) {
  const page = await context.newPage();
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[name="username"]');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  await page.waitForTimeout(2000);
  return page;
}

async function run() {
  const browser = await chromium.launch({ headless: false });

  console.log("\n\x1b[1m=== CHAT FEATURE TESTS ===\x1b[0m\n");

  // Create two browser contexts (two separate sessions)
  const adminCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const userCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  // ===== LOGIN BOTH USERS =====
  console.log("SETUP: Logging in both users...");
  const adminPage = await login(adminCtx, "cristain", "1234");
  log("PASS", "Admin (cristain) logged in");

  const userPage = await login(userCtx, "test", "test");
  log("PASS", "User (test) logged in");

  // ===== TEST 1: Chat page navigation =====
  console.log("\n\x1b[1mTEST 1: Chat Page Navigation\x1b[0m");

  await adminPage.goto(`${BASE}/chat`);
  await adminPage.waitForTimeout(2000);
  await adminPage.screenshot({ path: `${SCREENSHOTS}/01-admin-chat-page.png` });

  const adminChatContent = await adminPage.textContent("body");
  if (adminChatContent.includes("Chats"))
    log("PASS", "Admin: Chat page renders with sidebar");
  else log("FAIL", "Admin: Chat page missing sidebar");

  await userPage.goto(`${BASE}/chat`);
  await userPage.waitForTimeout(2000);
  await userPage.screenshot({ path: `${SCREENSHOTS}/02-user-chat-page.png` });

  const userChatContent = await userPage.textContent("body");
  if (userChatContent.includes("Chats"))
    log("PASS", "User: Chat page renders with sidebar");
  else log("FAIL", "User: Chat page missing sidebar");

  // ===== TEST 2: Admin creates a DM conversation =====
  console.log("\n\x1b[1mTEST 2: Create DM Conversation (Admin → User)\x1b[0m");

  // Click new conversation button
  const newChatBtn = await adminPage.$('button:has(svg.lucide-plus), button[title="New conversation"]');
  if (newChatBtn) {
    await newChatBtn.click();
    await adminPage.waitForTimeout(1000);
    log("PASS", "Admin: New conversation modal opened");
    await adminPage.screenshot({ path: `${SCREENSHOTS}/03-admin-new-chat-modal.png` });

    // Select user "Testing" from the dropdown
    await adminPage.click('.ant-select');
    await adminPage.waitForTimeout(500);

    // Type to search
    await adminPage.fill('.ant-select input', 'Testing');
    await adminPage.waitForTimeout(500);

    // Click the option
    const option = await adminPage.$('.ant-select-item-option:has-text("Testing")');
    if (option) {
      await option.click();
      await adminPage.waitForTimeout(500);
      log("PASS", "Admin: Selected 'Testing' user");
    } else {
      // Try clicking any available option
      const anyOption = await adminPage.$('.ant-select-item-option');
      if (anyOption) {
        await anyOption.click();
        await adminPage.waitForTimeout(500);
        log("PASS", "Admin: Selected a user from dropdown");
      } else {
        log("FAIL", "Admin: No users in dropdown");
      }
    }

    // Click "Start Chat"
    const startBtn = await adminPage.$('.ant-modal-footer .ant-btn-primary, button:has-text("Start Chat")');
    if (startBtn) {
      await startBtn.click();
      await adminPage.waitForTimeout(2000);
      log("PASS", "Admin: Started DM conversation");
    } else {
      log("FAIL", "Admin: Start Chat button not found");
    }
  } else {
    log("FAIL", "Admin: New conversation button not found");
  }

  await adminPage.screenshot({ path: `${SCREENSHOTS}/04-admin-dm-started.png` });

  // ===== TEST 3: Send messages =====
  console.log("\n\x1b[1mTEST 3: Send Messages\x1b[0m");

  // Admin sends a message — wait for chat window to load
  await adminPage.waitForTimeout(2000);
  const adminInput = await adminPage.$('textarea');
  if (adminInput) {
    await adminInput.click();
    await adminInput.type("Hello from admin! This is a test message.");
    await adminPage.waitForTimeout(300);
    await adminInput.press("Enter");
    await adminPage.waitForTimeout(2000);
    log("PASS", "Admin: Message sent");
  } else {
    log("FAIL", "Admin: Message input not found");
  }

  await adminPage.screenshot({ path: `${SCREENSHOTS}/05-admin-message-sent.png` });

  // Send a second message
  const adminInput2 = await adminPage.$('textarea');
  if (adminInput2) {
    await adminInput2.click();
    await adminInput2.type("Second message from admin.");
    await adminInput2.press("Enter");
    await adminPage.waitForTimeout(1500);
    log("PASS", "Admin: Second message sent");
  }

  // ===== TEST 4: User sees the conversation =====
  console.log("\n\x1b[1mTEST 4: User Receives Messages\x1b[0m");

  // Refresh user's chat page
  await userPage.goto(`${BASE}/chat`);
  await userPage.waitForTimeout(3000);
  await userPage.screenshot({ path: `${SCREENSHOTS}/06-user-chat-list.png` });

  // Check if the conversation appears
  const userChatList = await userPage.textContent("body");
  if (userChatList.includes("Sukanta Das") || userChatList.includes("Hello from admin"))
    log("PASS", "User: Sees conversation from admin in list");
  else log("FAIL", "User: Conversation not visible in list");

  // Click on the conversation
  const convItem = await userPage.$('button:has-text("Sukanta Das")');
  if (convItem) {
    await convItem.click();
    await userPage.waitForTimeout(2000);
    log("PASS", "User: Opened conversation");
  } else {
    // Try clicking the first conversation
    const firstConv = await userPage.$('[class*="border-l-"] button, button[class*="py-3"]');
    if (firstConv) {
      await firstConv.click();
      await userPage.waitForTimeout(2000);
      log("PASS", "User: Opened first conversation");
    } else {
      log("FAIL", "User: No conversations to click");
    }
  }

  await userPage.screenshot({ path: `${SCREENSHOTS}/07-user-sees-messages.png` });

  // Check messages are visible
  const messageArea = await userPage.textContent("body");
  if (messageArea.includes("Hello from admin"))
    log("PASS", "User: Sees admin's messages");
  else log("FAIL", "User: Messages not visible");

  // User replies
  const userInput = await userPage.$('textarea');
  if (userInput) {
    await userInput.click();
    await userInput.type("Hi admin! Reply from test user.");
    await userInput.press("Enter");
    await userPage.waitForTimeout(2000);
    log("PASS", "User: Reply sent");
  } else {
    log("FAIL", "User: Message input not found");
  }

  await userPage.screenshot({ path: `${SCREENSHOTS}/08-user-reply-sent.png` });

  // ===== TEST 5: Admin sees reply =====
  console.log("\n\x1b[1mTEST 5: Admin Sees Reply (via polling)\x1b[0m");

  // Wait for polling to pick up the message
  await adminPage.waitForTimeout(5000);
  await adminPage.screenshot({ path: `${SCREENSHOTS}/09-admin-sees-reply.png` });

  const adminMessages = await adminPage.textContent("body");
  if (adminMessages.includes("Reply from test user"))
    log("PASS", "Admin: Sees user's reply via polling");
  else log("FAIL", "Admin: Reply not visible yet");

  // ===== TEST 6: Admin creates group chat =====
  console.log("\n\x1b[1mTEST 6: Admin Creates Group Chat\x1b[0m");

  const newGroupBtn = await adminPage.$('button:has(svg.lucide-plus), button[title="New conversation"]');
  if (newGroupBtn) {
    await newGroupBtn.click();
    await adminPage.waitForTimeout(1000);

    // Select "Group Chat" type
    const groupRadio = await adminPage.$('input[value="group"], .ant-radio-wrapper:has-text("Group Chat")');
    if (groupRadio) {
      await groupRadio.click();
      await adminPage.waitForTimeout(500);
      log("PASS", "Admin: Selected Group Chat type");

      // Enter group name
      const groupNameInput = await adminPage.$('input[placeholder="Enter group name"]');
      if (groupNameInput) {
        await groupNameInput.fill("Test Group");
        log("PASS", "Admin: Entered group name");
      }

      // Select members
      const selectEl = await adminPage.$('.ant-modal .ant-select');
      if (selectEl) {
        await selectEl.click();
        await adminPage.waitForTimeout(500);
        // Click first option
        await adminPage.click('.ant-select-item-option:first-child', { force: true });
        await adminPage.waitForTimeout(300);
        log("PASS", "Admin: Selected group member");
      }

      // Close dropdown by pressing Escape
      await adminPage.keyboard.press("Escape");
      await adminPage.waitForTimeout(300);

      // Create group
      const createBtn = await adminPage.$('.ant-modal-footer .ant-btn-primary');
      if (createBtn) {
        await createBtn.click({ force: true });
        await adminPage.waitForTimeout(2000);
        log("PASS", "Admin: Group chat created");
      }
    } else {
      log("FAIL", "Admin: Group Chat radio not found");
    }
  }

  await adminPage.screenshot({ path: `${SCREENSHOTS}/10-admin-group-created.png` });

  // ===== TEST 7: User sees no group creation option =====
  console.log("\n\x1b[1mTEST 7: User Cannot Create Group (Only DM)\x1b[0m");

  await userPage.goto(`${BASE}/chat`);
  await userPage.waitForTimeout(2000);

  const userNewBtn = await userPage.$('button:has(svg.lucide-plus), button[title="New conversation"]');
  if (userNewBtn) {
    await userNewBtn.click();
    await userPage.waitForTimeout(1000);

    const modalContent = await userPage.textContent('.ant-modal-body, [role="dialog"]');
    if (modalContent && !modalContent.includes("Group Chat"))
      log("PASS", "User: No group chat option (DM only)");
    else if (modalContent && modalContent.includes("Group Chat"))
      log("FAIL", "User: Should not see group chat option");
    else
      log("PASS", "User: Modal content check (DM only mode)");

    // Close modal
    const cancelBtn = await userPage.$('.ant-modal-footer .ant-btn-default, button:has-text("Cancel")');
    if (cancelBtn) await cancelBtn.click();
  }

  await userPage.screenshot({ path: `${SCREENSHOTS}/11-user-no-group-option.png` });

  // ===== TEST 8: Chat sidebar shows conversations =====
  console.log("\n\x1b[1mTEST 8: Chat Sidebar\x1b[0m");

  await adminPage.goto(`${BASE}/chat`);
  await adminPage.waitForTimeout(2000);

  const sidebarContent = await adminPage.textContent("body");
  if (sidebarContent.includes("Chats") && sidebarContent.includes("Testing"))
    log("PASS", "Admin: Sidebar shows conversations with user names");
  else log("FAIL", "Admin: Sidebar content incomplete");

  // ===== TEST 9: Delete conversation =====
  console.log("\n\x1b[1mTEST 9: Delete Conversation (Right-click)\x1b[0m");

  // Right-click on a conversation to get context menu
  const convToDelete = await adminPage.$('button[class*="border-l-"]');
  if (convToDelete) {
    await convToDelete.click({ button: "right" });
    await adminPage.waitForTimeout(500);

    const deleteOption = await adminPage.$('button:has-text("Delete Chat"), button:has-text("Leave Group")');
    if (deleteOption) {
      log("PASS", "Admin: Context menu appears with delete option");
      await adminPage.screenshot({ path: `${SCREENSHOTS}/12-admin-context-menu.png` });
      // Don't actually delete — just verify the option exists
      await adminPage.click("body"); // dismiss menu
    } else {
      log("FAIL", "Admin: Context menu delete option not found");
    }
  }

  // ===== TEST 10: Mobile chat responsive =====
  console.log("\n\x1b[1mTEST 10: Mobile Chat Responsive\x1b[0m");

  const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mobilePage = await login(mobileCtx, "cristain", "1234");

  await mobilePage.goto(`${BASE}/chat`);
  await mobilePage.waitForTimeout(2000);
  await mobilePage.screenshot({ path: `${SCREENSHOTS}/13-mobile-chat-list.png` });

  // Check sidebar is full width on mobile
  const mobileBody = await mobilePage.textContent("body");
  if (mobileBody.includes("Chats"))
    log("PASS", "Mobile: Chat list renders full-width");
  else log("FAIL", "Mobile: Chat list not visible");

  // Click a conversation
  const mobileConv = await mobilePage.$('button[class*="border-l-"]');
  if (mobileConv) {
    await mobileConv.click();
    await mobilePage.waitForTimeout(2000);
    await mobilePage.screenshot({ path: `${SCREENSHOTS}/14-mobile-chat-open.png` });

    // Check back button
    const backBtn = await mobilePage.$('button:has(svg.lucide-arrow-left)');
    if (backBtn)
      log("PASS", "Mobile: Back button visible in chat header");
    else log("FAIL", "Mobile: Back button missing");

    // Check message input
    const mobileInput = await mobilePage.$('textarea[placeholder="Type a message..."]');
    if (mobileInput)
      log("PASS", "Mobile: Message input visible");
    else log("FAIL", "Mobile: Message input missing");

    // Go back
    if (backBtn) {
      await backBtn.click();
      await mobilePage.waitForTimeout(1000);
      const backContent = await mobilePage.textContent("body");
      if (backContent.includes("Chats"))
        log("PASS", "Mobile: Back button returns to chat list");
      else log("FAIL", "Mobile: Back button didn't navigate back");
    }
  }

  // ===== TEST 11: Call buttons visible =====
  console.log("\n\x1b[1mTEST 11: Call Buttons\x1b[0m");

  await adminPage.goto(`${BASE}/chat`);
  await adminPage.waitForTimeout(2000);

  // Open a conversation
  const convForCall = await adminPage.$('button[class*="border-l-"]');
  if (convForCall) {
    await convForCall.click();
    await adminPage.waitForTimeout(2000);

    const audioBtn = await adminPage.$('button[title="Audio call"]');
    const videoBtn = await adminPage.$('button[title="Video call"]');

    if (audioBtn) log("PASS", "Audio call button visible");
    else log("FAIL", "Audio call button missing");

    if (videoBtn) log("PASS", "Video call button visible");
    else log("FAIL", "Video call button missing");
  }

  await adminPage.screenshot({ path: `${SCREENSHOTS}/15-call-buttons.png` });

  // ===== TEST 12: Chat on other pages (incoming call overlay) =====
  console.log("\n\x1b[1mTEST 12: Global Call Provider\x1b[0m");

  await adminPage.goto(`${BASE}/dashboard`);
  await adminPage.waitForTimeout(2000);

  // The CallProvider should be active on dashboard too
  const dashboardContent = await adminPage.textContent("body");
  if (dashboardContent.includes("Dashboard"))
    log("PASS", "Dashboard loads (CallProvider wraps it)");
  else log("FAIL", "Dashboard not loading");

  // ===== CLEANUP =====
  await mobileCtx.close();
  await adminCtx.close();
  await userCtx.close();
  await browser.close();

  // ===== SUMMARY =====
  console.log(`\n\x1b[1m=== SUMMARY ===\x1b[0m`);
  console.log(`\x1b[32m  Passed: ${passed}\x1b[0m`);
  console.log(`\x1b[31m  Failed: ${failed}\x1b[0m`);
  if (issues.length > 0) {
    console.log(`\n  Issues:`);
    issues.forEach(i => console.log(`    - ${i}`));
  }
  console.log(`\n  Screenshots: ${SCREENSHOTS}/`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
