import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Meeting from "@/models/Meeting";
import User from "@/models/User";
import { createMeetingSchema } from "@/validations/meeting";
import { createCalendarEvent } from "@/lib/google/calendar";
import { createMeetingNotification } from "@/lib/meeting-notifications";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const query: Record<string, unknown> = {};

    // Members can only see meetings they are invited to
    if (currentUser.role !== "admin") {
      query.invitees = currentUser.userId;
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) (query.date as Record<string, unknown>).$gte = new Date(startDate);
      if (endDate) (query.date as Record<string, unknown>).$lte = new Date(endDate);
    }

    if (status) query.status = status;
    if (type) query.type = type;

    const total = await Meeting.countDocuments(query);
    const meetings = await Meeting.find(query)
      .populate("invitees", "fullName email")
      .populate("createdBy", "fullName")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: meetings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch meetings" }, { status: 500 });
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
    const parsed = createMeetingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { title, description, agenda, date, duration, type, invitees } = parsed.data;

    // Calculate end time for Google Calendar
    const startDateTime = new Date(date).toISOString();
    const endDateTime = new Date(new Date(date).getTime() + duration * 60000).toISOString();

    // Get invitee emails for Google Calendar
    const inviteeUsers = await User.find({ _id: { $in: invitees } }).select("email fullName");
    const attendeeEmails = inviteeUsers
      .filter((u) => u.email)
      .map((u) => ({ email: u.email }));

    // Create Google Calendar event with Meet link
    let googleEventId: string | null = null;
    let meetLink: string | null = null;
    let googleSyncMessage = "";

    const calendarResult = await createCalendarEvent({
      userId: currentUser.userId,
      summary: title,
      description: description || "",
      startDateTime,
      endDateTime,
      attendees: attendeeEmails,
    });

    if (calendarResult) {
      googleEventId = calendarResult.googleEventId;
      meetLink = calendarResult.meetLink;
      googleSyncMessage = "Meeting synced with Google Calendar.";
    } else {
      googleSyncMessage = "Meeting created without Google Calendar sync. Connect Google Calendar in settings to enable sync.";
    }

    // Initialize attendance records
    const attendance = invitees.map((userId: string) => ({
      user: userId,
      status: "not_marked",
      checkInTime: null,
      markedBy: "admin",
      markedByAdmin: null,
    }));

    // Initialize minutes structure
    const minutes = {
      mode: "structured",
      freeformContent: "",
      agendaItems: agenda.map((item: string) => ({
        title: item,
        discussion: "",
        decision: "",
      })),
      decisions: [],
      actionItems: [],
      status: "draft",
      finalizedAt: null,
    };

    const meeting = await Meeting.create({
      title,
      description: description || "",
      agenda,
      date: new Date(date),
      duration,
      type,
      googleEventId,
      meetLink,
      invitees,
      attendance,
      minutes,
      status: "scheduled",
      createdBy: currentUser.userId,
    });

    const populated = await Meeting.findById(meeting._id)
      .populate("invitees", "fullName email")
      .populate("createdBy", "fullName");

    // Create notifications for all invitees
    const meetingDate = new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    await createMeetingNotification(
      "meeting_created",
      invitees,
      meeting._id.toString(),
      `New Meeting: ${title}`,
      `You have been invited to "${title}" on ${meetingDate}.`
    );

    await createAuditLog("meeting_created", currentUser.userId, {
      action_description: `Created meeting: "${title}"`,
      meeting_title: title,
      meeting_date: date,
      meeting_type: type,
      invitee_count: invitees.length,
      google_synced: !!calendarResult,
    });

    return NextResponse.json(
      { success: true, data: populated, message: `Meeting created successfully. ${googleSyncMessage}` },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create meeting" }, { status: 500 });
  }
}
