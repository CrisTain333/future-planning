import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { createAuditLog } from "@/lib/audit";
import { v2 as cloudinary } from "cloudinary";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const useCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== "your-cloud-name" &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

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

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return NextResponse.json({ success: false, error: "Only JPG and PNG files are allowed" }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File size must be less than 2MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let pictureUrl: string;

    if (useCloudinary) {
      // Upload to Cloudinary
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
      pictureUrl = result.secure_url;
    } else {
      // Save locally to public/uploads/profiles/
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "profiles");
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      const ext = file.type === "image/png" ? "png" : "jpg";
      const filename = `${currentUser.userId}-${Date.now()}.${ext}`;
      const filepath = path.join(uploadsDir, filename);
      await writeFile(filepath, buffer);
      pictureUrl = `/uploads/profiles/${filename}`;
    }

    await dbConnect();
    const user = await User.findByIdAndUpdate(
      currentUser.userId,
      { profilePicture: pictureUrl },
      { new: true }
    ).select("-password");

    await createAuditLog("profile_picture_updated", currentUser.userId, {
      action_description: "Updated own profile picture",
      picture_url: pictureUrl,
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
      return NextResponse.json({ success: false, error: "Cloudinary credentials are invalid" }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: "Failed to upload picture" }, { status: 500 });
  }
}
