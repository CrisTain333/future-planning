import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { createUserSchema } from "@/validations/user";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as unknown as
      | { userId: string; role: string }
      | undefined;
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }
    if (role) query.role = role;
    if (status === "active") query.isDisabled = false;
    if (status === "disabled") query.isDisabled = true;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as
      | { userId: string; role: string }
      | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { password, ...rest } = parsed.data;

    // Check unique username
    const existing = await User.findOne({
      username: rest.username.toLowerCase(),
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Username already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ ...rest, password: hashedPassword });

    const userObj = user.toObject();
    delete userObj.password;

    return NextResponse.json(
      { success: true, data: userObj, message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    );
  }
}
