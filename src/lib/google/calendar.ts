import { google, calendar_v3 } from "googleapis";
import { encrypt, decrypt } from "./encrypt";
import dbConnect from "@/lib/db";
import User from "@/models/User";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(state: string): string {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state,
    prompt: "consent",
  });
}

export async function getTokensFromCode(code: string) {
  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error("Failed to exchange auth code for tokens:", error);
    return null;
  }
}

export async function saveTokens(
  userId: string,
  tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null; scope?: string | null }
) {
  try {
    await dbConnect();
    await User.findByIdAndUpdate(userId, {
      googleTokens: {
        accessToken: encrypt(tokens.access_token || ""),
        refreshToken: encrypt(tokens.refresh_token || ""),
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(),
        scope: tokens.scope || SCOPES.join(" "),
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to save tokens:", error);
    return false;
  }
}

export async function removeTokens(userId: string) {
  try {
    await dbConnect();
    await User.findByIdAndUpdate(userId, { googleTokens: null });
    return true;
  } catch (error) {
    console.error("Failed to remove tokens:", error);
    return false;
  }
}

async function getAuthenticatedClient(
  userId: string
): Promise<calendar_v3.Calendar | null> {
  try {
    await dbConnect();
    const user = await User.findById(userId);
    if (!user?.googleTokens) return null;

    const oauth2Client = createOAuth2Client();

    const accessToken = decrypt(user.googleTokens.accessToken);
    const refreshToken = decrypt(user.googleTokens.refreshToken);
    const expiresAt = new Date(user.googleTokens.expiresAt).getTime();

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiresAt,
    });

    // Auto-refresh if within 5 minutes of expiry
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() >= expiresAt - fiveMinutes) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);

      await User.findByIdAndUpdate(userId, {
        googleTokens: {
          accessToken: encrypt(credentials.access_token || ""),
          refreshToken: encrypt(credentials.refresh_token || refreshToken),
          expiresAt: credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : new Date(),
          scope: credentials.scope || user.googleTokens.scope,
        },
      });
    }

    return google.calendar({ version: "v3", auth: oauth2Client });
  } catch (error) {
    console.error("Failed to get authenticated calendar client:", error);
    return null;
  }
}

export async function createCalendarEvent(params: {
  userId: string;
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  attendees?: { email: string }[];
}): Promise<{ googleEventId: string; meetLink: string } | null> {
  try {
    const calendar = await getAuthenticatedClient(params.userId);
    if (!calendar) return null;

    const response = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      sendUpdates: "all",
      requestBody: {
        summary: params.summary,
        description: params.description,
        start: {
          dateTime: params.startDateTime,
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: params.endDateTime,
          timeZone: "Asia/Kolkata",
        },
        attendees: params.attendees,
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
      },
    });

    const googleEventId = response.data.id;
    const meetLink =
      response.data.conferenceData?.entryPoints?.find(
        (ep) => ep.entryPointType === "video"
      )?.uri || response.data.hangoutLink;

    if (!googleEventId || !meetLink) return null;

    return { googleEventId, meetLink };
  } catch (error) {
    console.error("Failed to create calendar event:", error);
    return null;
  }
}

export async function updateCalendarEvent(
  userId: string,
  googleEventId: string,
  updates: {
    summary?: string;
    description?: string;
    startDateTime?: string;
    endDateTime?: string;
    attendees?: { email: string }[];
  }
): Promise<boolean> {
  try {
    const calendar = await getAuthenticatedClient(userId);
    if (!calendar) return false;

    const requestBody: calendar_v3.Schema$Event = {};

    if (updates.summary) requestBody.summary = updates.summary;
    if (updates.description) requestBody.description = updates.description;
    if (updates.startDateTime) {
      requestBody.start = {
        dateTime: updates.startDateTime,
        timeZone: "Asia/Kolkata",
      };
    }
    if (updates.endDateTime) {
      requestBody.end = {
        dateTime: updates.endDateTime,
        timeZone: "Asia/Kolkata",
      };
    }
    if (updates.attendees) requestBody.attendees = updates.attendees;

    await calendar.events.patch({
      calendarId: "primary",
      eventId: googleEventId,
      sendUpdates: "all",
      requestBody,
    });

    return true;
  } catch (error) {
    console.error("Failed to update calendar event:", error);
    return false;
  }
}

export async function deleteCalendarEvent(
  userId: string,
  googleEventId: string
): Promise<boolean> {
  try {
    const calendar = await getAuthenticatedClient(userId);
    if (!calendar) return false;

    await calendar.events.delete({
      calendarId: "primary",
      eventId: googleEventId,
      sendUpdates: "all",
    });

    return true;
  } catch (error) {
    console.error("Failed to delete calendar event:", error);
    return false;
  }
}
