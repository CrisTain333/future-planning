import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Notice from "@/models/Notice";
import { createNoticeSchema } from "@/validations/notice";
import { createNoticeNotification } from "@/lib/notifications";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const query = { isDeleted: false };
    const total = await Notice.countDocuments(query);
    const notices = await Notice.find(query)
      .populate("createdBy", "fullName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: notices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch notices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const parsed = createNoticeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const notice = await Notice.create({ ...parsed.data, createdBy: currentUser.userId });
    const populated = await Notice.findById(notice._id).populate("createdBy", "fullName");

    await createAuditLog("notice_created", currentUser.userId, { title: parsed.data.title });
    await createNoticeNotification(notice._id.toString(), parsed.data.title);

    return NextResponse.json({ success: true, data: populated, message: "Notice created successfully" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create notice" }, { status: 500 });
  }
}
