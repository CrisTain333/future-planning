import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { v2 as cloudinary } from "cloudinary";
import { createAuditLog } from "@/lib/audit";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return NextResponse.json({ success: false, error: "Only JPG and PNG files are allowed" }, { status: 400 });
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File size must be less than 2MB" }, { status: 400 });
    }

    // Convert to buffer and upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "future-planning/profiles",
            resource_type: "image",
            transformation: [{ width: 200, height: 200, crop: "fill" }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as { secure_url: string });
          }
        )
        .end(buffer);
    });

    await dbConnect();
    const user = await User.findByIdAndUpdate(
      currentUser.userId,
      { profilePicture: result.secure_url },
      { new: true }
    ).select("-password");

    await createAuditLog("profile_picture_updated", currentUser.userId, {
      action_description: "Updated own profile picture",
      picture_url: result.secure_url,
    }, currentUser.userId);

    return NextResponse.json({
      success: true,
      data: user,
      message: "Profile picture updated successfully",
    });
  } catch (error) {
    console.error("Profile picture upload error:", error);
    const err = error as { http_code?: number; message?: string };
    if (err.http_code === 401) {
      return NextResponse.json({ success: false, error: "Cloudinary credentials are invalid. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local" }, { status: 500 });
    }
    const message = error instanceof Error ? error.message : "Failed to upload picture";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
