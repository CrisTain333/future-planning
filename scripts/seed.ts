import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db!;

    // Seed Settings
    const settingsCollection = db.collection("settings");
    const existingSettings = await settingsCollection.findOne({});
    if (!existingSettings) {
      await settingsCollection.insertOne({
        foundationName: "Future Planning",
        monthlyAmount: 2000,
        initialAmount: 10000,
        startMonth: 3,
        startYear: 2026,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("Settings seeded");
    } else {
      console.log("Settings already exist, skipping");
    }

    // Seed Admin User
    const usersCollection = db.collection("users");
    const existingAdmin = await usersCollection.findOne({ username: "admin" });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("1234", 10);
      await usersCollection.insertOne({
        fullName: "Super Admin",
        username: "admin",
        password: hashedPassword,
        role: "admin",
        isDisabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("Admin user seeded (username: admin, password: 1234)");
    } else {
      console.log("Admin user already exists, skipping");
    }

    console.log("Seed complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
