import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getTokensFromCode, saveTokens } from "@/lib/google/calendar";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // userId
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(new URL("/admin/settings?google=error", req.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL("/admin/settings?google=error", req.url));
    }

    const tokens = await getTokensFromCode(code);
    if (!tokens) {
      return NextResponse.redirect(new URL("/admin/settings?google=error", req.url));
    }

    await dbConnect();
    const saved = await saveTokens(state, tokens);
    if (!saved) {
      return NextResponse.redirect(new URL("/admin/settings?google=error", req.url));
    }

    await createAuditLog("google_connected", state, {
      action_description: "Connected Google Calendar integration",
    });

    return NextResponse.redirect(new URL("/admin/settings?google=success", req.url));
  } catch (error) {
    return NextResponse.redirect(new URL("/admin/settings?google=error", req.url));
  }
}
