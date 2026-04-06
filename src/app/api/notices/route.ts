import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Notice from "@/models/Notice";
import { createNoticeSchema } from "@/validations/notice";
import { createNoticeNotification } from "@/lib/notifications";
import { createAuditLog } from "@/lib/audit";
import { sendEmail } from "@/lib/email/send";
import { NoticeEmail } from "@/lib/email/templates/notice";
import User from "@/models/User";

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

    await createAuditLog("notice_created", currentUser.userId, {
      action_description: `Created notice: "${parsed.data.title}"`,
      notice_title: parsed.data.title,
      notice_body_preview: parsed.data.body.substring(0, 100),
    });
    await createNoticeNotification(notice._id.toString(), parsed.data.title);

    // Send notice email to all active members (non-blocking)
    const activeMembers = await User.find({
      isDisabled: false,
      email: { $exists: true, $ne: "" },
    }).select("_id email");
    const creatorName = typeof populated?.createdBy === "object"
      ? (populated.createdBy as { fullName: string }).fullName
      : "Admin";
    const noticeDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    for (const member of activeMembers) {
      sendEmail({
        to: member.email,
        toUserId: member._id.toString(),
        subject: `Notice: ${parsed.data.title}`,
        type: "notice",
        react: NoticeEmail({
          title: parsed.data.title,
          body: parsed.data.body,
          postedBy: creatorName,
          date: noticeDate,
        }),
        metadata: { noticeId: notice._id.toString() },
      }).catch(() => {}); // Fire-and-forget
    }

    return NextResponse.json({ success: true, data: populated, message: "Notice created successfully" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create notice" }, { status: 500 });
  }
}
