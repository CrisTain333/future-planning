import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import AuditLog from "@/models/AuditLog";
import User from "@/models/User";

function parseUserAgent(ua: string) {
  // Browser
  let browser = "Unknown";
  if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera")) browser = "Opera";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Safari/")) browser = "Safari";

  // OS
  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X") || ua.includes("Macintosh")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  // Device type
  let device = "Desktop";
  if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) device = "Mobile";
  else if (ua.includes("iPad") || ua.includes("Tablet")) device = "Tablet";

  return { browser, os, device };
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { type, username } = body;

    // Get IP and user-agent from request
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "Unknown";
    const userAgent = req.headers.get("user-agent") || "Unknown";
    const { browser, os, device } = parseUserAgent(userAgent);

    if (type === "login_success") {
      // Get the logged-in user's session
      const session = await auth();
      const currentUser = session?.user as unknown as { userId: string; fullName: string; role: string } | undefined;

      if (currentUser) {
        await AuditLog.create({
          action: "user_login",
          performedBy: currentUser.userId,
          targetUser: currentUser.userId,
          details: {
            action_description: `${currentUser.fullName} logged in successfully`,
            username: username || currentUser.fullName,
            ip_address: ip,
            browser,
            operating_system: os,
            device_type: device,
            user_agent: userAgent.substring(0, 200),
            timestamp: new Date().toISOString(),
          },
        });
      }
    } else if (type === "login_failed") {
      // For failed logins, we don't have a session — find user by username if possible
      const user = username ? await User.findOne({ username: username.toLowerCase() }).select("_id fullName") : null;

      await AuditLog.create({
        action: "user_login_failed",
        performedBy: user?._id || undefined,
        details: {
          action_description: `Failed login attempt for username "${username || "unknown"}"`,
          attempted_username: username || "unknown",
          ip_address: ip,
          browser,
          operating_system: os,
          device_type: device,
          user_agent: userAgent.substring(0, 200),
          reason: body.reason || "Invalid credentials",
          timestamp: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as { message?: string; errors?: Record<string, { message: string }> };
    console.error("Auth audit error:", err.message, JSON.stringify(err.errors));
    return NextResponse.json({ success: true }); // Don't fail login because of audit
  }
}
