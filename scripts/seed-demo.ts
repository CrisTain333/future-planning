import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

const MEMBERS = [
  { fullName: "Rahim Uddin", username: "rahim", phone: "01711000001", bloodGroup: "A+", address: "Mirpur, Dhaka" },
  { fullName: "Karim Hossain", username: "karim", phone: "01711000002", bloodGroup: "B+", address: "Dhanmondi, Dhaka" },
  { fullName: "Jalal Ahmed", username: "jalal", phone: "01711000003", bloodGroup: "O+", address: "Gulshan, Dhaka" },
  { fullName: "Nasir Mahmud", username: "nasir", phone: "01711000004", bloodGroup: "A-", address: "Uttara, Dhaka" },
  { fullName: "Faruk Islam", username: "faruk", phone: "01711000005", bloodGroup: "B-", address: "Banani, Dhaka" },
  { fullName: "Shakil Rahman", username: "shakil", phone: "01711000006", bloodGroup: "O-", address: "Mohammadpur, Dhaka" },
  { fullName: "Tanvir Hasan", username: "tanvir", phone: "01711000007", bloodGroup: "AB+", address: "Farmgate, Dhaka" },
  { fullName: "Imran Khan", username: "imran", phone: "01711000008", bloodGroup: "A+", address: "Motijheel, Dhaka" },
  { fullName: "Sohel Rana", username: "sohel", phone: "01711000009", bloodGroup: "B+", address: "Khilgaon, Dhaka" },
  { fullName: "Masud Parvez", username: "masud", phone: "01711000010", bloodGroup: "O+", address: "Bashundhara, Dhaka" },
  { fullName: "Rafiq Sarker", username: "rafiq", phone: "01711000011", bloodGroup: "AB-", address: "Tejgaon, Dhaka" },
];

const MONTHS_DATA = [
  { month: 3, year: 2026, label: "March 2026" },
  { month: 4, year: 2026, label: "April 2026" },
  { month: 5, year: 2026, label: "May 2026" },
  { month: 6, year: 2026, label: "June 2026" },
  { month: 7, year: 2026, label: "July 2026" },
  { month: 8, year: 2026, label: "August 2026" },
  { month: 9, year: 2026, label: "September 2026" },
  { month: 10, year: 2026, label: "October 2026" },
  { month: 11, year: 2026, label: "November 2026" },
  { month: 12, year: 2026, label: "December 2026" },
  { month: 1, year: 2027, label: "January 2027" },
  { month: 2, year: 2027, label: "February 2027" },
  { month: 3, year: 2027, label: "March 2027" },
];

const NOTICES = [
  { title: "Welcome to Future Planning", body: "We are excited to launch our digital accounting system. All members can now track their payments and download receipts online.", daysAgo: 365 },
  { title: "Monthly Meeting - April 2026", body: "Our monthly meeting will be held on April 5, 2026 at 7:00 PM at the community hall. All members are requested to attend. Agenda: Review of March collections and planning for upcoming events.", daysAgo: 350 },
  { title: "Eid Gathering", body: "A special Eid gathering has been organized for all members and their families on April 15, 2026. Food and refreshments will be provided. Please confirm your attendance.", daysAgo: 340 },
  { title: "Payment Reminder - May 2026", body: "This is a friendly reminder that May 2026 contributions are due. Please ensure timely payment to avoid any penalties. Contact admin if you have any concerns.", daysAgo: 300 },
  { title: "Annual Report Published", body: "The annual financial report for the first quarter has been published. Members can review the fund status on their dashboard. Total collections have exceeded our target.", daysAgo: 250 },
  { title: "New Member Welcome", body: "We are pleased to welcome Rafiq Sarker as our newest member. Please extend a warm welcome to him at the next meeting.", daysAgo: 200 },
  { title: "Fund Investment Update", body: "The foundation committee has decided to invest a portion of the fund in a fixed deposit scheme for better returns. Details will be shared at the next meeting.", daysAgo: 150 },
  { title: "Year-End Review Meeting", body: "A year-end review meeting is scheduled for December 28, 2026. We will discuss the fund status, achievements, and plans for 2027. Attendance is mandatory.", daysAgo: 90 },
  { title: "Happy New Year 2027!", body: "Wishing all members and their families a prosperous New Year! Let us continue our journey together towards a better future.", daysAgo: 60 },
  { title: "March 2027 Payment Due", body: "Reminder: March 2027 contributions of BDT 2,000 are due by March 15. Members with outstanding payments are requested to clear their dues at the earliest.", daysAgo: 5 },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected to MongoDB\n");

    const db = mongoose.connection.db!;
    const usersCol = db.collection("users");
    const paymentsCol = db.collection("payments");
    const noticesCol = db.collection("notices");
    const notificationsCol = db.collection("notifications");
    const auditLogsCol = db.collection("auditlogs");
    const settingsCol = db.collection("settings");

    // Clear existing data (except admin)
    const admin = await usersCol.findOne({ username: "admin" });
    if (!admin) {
      console.error("Admin user not found. Run 'npm run seed' first.");
      process.exit(1);
    }
    const adminId = admin._id;

    await paymentsCol.deleteMany({});
    await noticesCol.deleteMany({});
    await notificationsCol.deleteMany({});
    await auditLogsCol.deleteMany({});
    await usersCol.deleteMany({ username: { $ne: "admin" } });
    // Drop indexes to avoid stale duplicate key issues, they'll be recreated
    try { await paymentsCol.dropIndexes(); } catch {}
    console.log("Cleared existing demo data\n");

    // Ensure settings exist
    const existingSettings = await settingsCol.findOne({});
    if (!existingSettings) {
      await settingsCol.insertOne({
        foundationName: "Future Planning",
        monthlyAmount: 2000,
        initialAmount: 10000,
        startMonth: 3,
        startYear: 2026,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Create 11 members
    const hashedPassword = await bcrypt.hash("1234", 10);
    const memberIds: mongoose.Types.ObjectId[] = [];

    for (const member of MEMBERS) {
      const result = await usersCol.insertOne({
        ...member,
        email: `${member.username}@futureplan.org`,
        password: hashedPassword,
        role: "user",
        isDisabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      memberIds.push(result.insertedId as unknown as mongoose.Types.ObjectId);
      console.log(`  Created member: ${member.fullName} (${member.username})`);
    }
    console.log(`\n✓ Created ${MEMBERS.length} members\n`);

    // Create payments — simulate realistic payment patterns
    let receiptSeq2026 = 1;
    let receiptSeq2027 = 1;
    let totalPayments = 0;

    for (let mi = 0; mi < memberIds.length; mi++) {
      const memberId = memberIds[mi];
      const memberName = MEMBERS[mi].fullName;

      // Determine how many months this member has paid
      // Some members are up to date, some are behind
      let monthsToPay: number;
      if (mi < 4) {
        // First 4 members: fully up to date (all 13 months: Mar 2026 - Mar 2027)
        monthsToPay = 13;
      } else if (mi < 8) {
        // Next 4: slightly behind (10-12 months)
        monthsToPay = 10 + (mi % 3);
      } else {
        // Last 3: more behind (7-9 months)
        monthsToPay = 7 + (mi % 3);
      }

      for (let j = 0; j < monthsToPay; j++) {
        const monthData = MONTHS_DATA[j];
        const isInitial = j === 0;
        const baseAmount = isInitial ? 10000 : 2000;

        // Add some penalties for late payments (random)
        let penalty = 0;
        let penaltyReason = "";
        if (!isInitial && Math.random() < 0.15) {
          penalty = Math.random() < 0.5 ? 100 : 200;
          penaltyReason = "Late payment";
        }

        const receiptNo = monthData.year === 2026
          ? `FP-2026-${String(receiptSeq2026++).padStart(4, "0")}`
          : `FP-2027-${String(receiptSeq2027++).padStart(4, "0")}`;

        // Create payment with a realistic date
        const paymentDate = new Date(monthData.year, monthData.month - 1, Math.floor(Math.random() * 10) + 1);

        await paymentsCol.insertOne({
          userId: memberId,
          month: monthData.month,
          year: monthData.year,
          amount: baseAmount,
          penalty,
          penaltyReason: penaltyReason || undefined,
          note: isInitial ? "Initial contribution" : undefined,
          receiptNo,
          status: "approved",
          approvedBy: adminId,
          isDeleted: false,
          createdAt: paymentDate,
          updatedAt: paymentDate,
        });
        totalPayments++;
      }
      console.log(`  ${memberName}: ${monthsToPay} payments recorded`);
    }
    console.log(`\n✓ Created ${totalPayments} payment records\n`);

    // Create notices
    for (const notice of NOTICES) {
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - notice.daysAgo);
      await noticesCol.insertOne({
        title: notice.title,
        body: notice.body,
        createdBy: adminId,
        isDeleted: false,
        createdAt,
        updatedAt: createdAt,
      });
      console.log(`  Notice: ${notice.title}`);
    }
    console.log(`\n✓ Created ${NOTICES.length} notices\n`);

    // Create some notifications for all members
    const recentNotice = NOTICES[NOTICES.length - 1];
    for (const memberId of memberIds) {
      await notificationsCol.insertOne({
        userId: memberId,
        type: "notice_posted",
        title: "New Notice",
        message: `A new notice has been posted: "${recentNotice.title}"`,
        referenceId: new mongoose.Types.ObjectId(),
        isRead: false,
        createdAt: new Date(),
      });
    }
    // Payment notification for a few members
    for (let i = 0; i < 5; i++) {
      await notificationsCol.insertOne({
        userId: memberIds[i],
        type: "payment_recorded",
        title: "Payment Recorded",
        message: `Your payment of BDT 2,000 for March 2027 has been recorded.`,
        referenceId: new mongoose.Types.ObjectId(),
        isRead: false,
        createdAt: new Date(),
      });
    }
    console.log("✓ Created notifications for members\n");

    // Create audit logs
    const auditActions = [
      { action: "user_created", details: { username: "rahim" }, daysAgo: 365 },
      { action: "user_created", details: { username: "karim" }, daysAgo: 365 },
      { action: "payment_created", details: { amount: 10000, month: 3, year: 2026, member: "Rahim Uddin" }, daysAgo: 360 },
      { action: "payment_created", details: { amount: 10000, month: 3, year: 2026, member: "Karim Hossain" }, daysAgo: 360 },
      { action: "notice_created", details: { title: "Welcome to Future Planning" }, daysAgo: 365 },
      { action: "payment_edited", details: { changes: { penalty: 100, penaltyReason: "Late payment" } }, daysAgo: 300 },
      { action: "user_created", details: { username: "rafiq" }, daysAgo: 200 },
      { action: "notice_created", details: { title: "Fund Investment Update" }, daysAgo: 150 },
      { action: "settings_updated", details: { foundationName: "Future Planning" }, daysAgo: 100 },
      { action: "notice_created", details: { title: "March 2027 Payment Due" }, daysAgo: 5 },
      { action: "payment_created", details: { amount: 2000, month: 3, year: 2027, member: "Rahim Uddin" }, daysAgo: 3 },
      { action: "payment_created", details: { amount: 2000, month: 3, year: 2027, member: "Karim Hossain" }, daysAgo: 2 },
    ];

    for (const log of auditActions) {
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - log.daysAgo);
      await auditLogsCol.insertOne({
        action: log.action,
        performedBy: adminId,
        targetUser: log.details.username ? memberIds[MEMBERS.findIndex(m => m.username === log.details.username)] : undefined,
        details: log.details,
        createdAt,
      });
    }
    console.log(`✓ Created ${auditActions.length} audit log entries\n`);

    // Summary
    console.log("═══════════════════════════════════════");
    console.log("  DEMO DATA SEEDED SUCCESSFULLY!");
    console.log("═══════════════════════════════════════");
    console.log(`  Admin:    admin / 1234`);
    console.log(`  Members:  ${MEMBERS.map(m => m.username).join(", ")}`);
    console.log(`  Password: 1234 (all members)`);
    console.log(`  Payments: ${totalPayments} records`);
    console.log(`  Notices:  ${NOTICES.length} notices`);
    console.log("═══════════════════════════════════════\n");

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
