import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename and create unique timestamp prefix
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${Date.now()}_${originalName}`;

    // Target directory: public/uploads
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, uniqueName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueName}`;

    return NextResponse.json(
      {
        url: publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/octet-stream",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to process file upload" },
      { status: 500 },
    );
  }
}
