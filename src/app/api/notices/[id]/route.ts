import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Notice from "@/models/Notice";
import { updateNoticeSchema } from "@/validations/notice";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const notice = await Notice.findById(id).populate("createdBy", "fullName");
    if (!notice || notice.isDeleted) {
      return NextResponse.json({ success: false, error: "Notice not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: notice });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch notice" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateNoticeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const before = await Notice.findById(id);

    const notice = await Notice.findByIdAndUpdate(id, parsed.data, { new: true }).populate("createdBy", "fullName");
    if (!notice) {
      return NextResponse.json({ success: false, error: "Notice not found" }, { status: 404 });
    }

    await createAuditLog("notice_edited", currentUser.userId, {
      action_description: `Edited notice: "${before?.title || id}"`,
      changes: Object.entries(parsed.data).filter(([, v]) => v !== undefined).map(([key, val]) => ({
        field: key,
        from: (before as Record<string, unknown>)?.[key],
        to: val,
      })),
    });

    return NextResponse.json({ success: true, data: notice, message: "Notice updated successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update notice" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const beforeNotice = await Notice.findById(id);

    const notice = await Notice.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!notice) {
      return NextResponse.json({ success: false, error: "Notice not found" }, { status: 404 });
    }

    await createAuditLog("notice_deleted", currentUser.userId, {
      action_description: `Deleted notice: "${beforeNotice?.title || id}"`,
      notice_title: beforeNotice?.title,
    });

    return NextResponse.json({ success: true, data: null, message: "Notice deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete notice" }, { status: 500 });
  }
}
