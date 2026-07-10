import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/app/(auth)/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { uploadToSupabaseStorage } from "@/lib/supabase/storage";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "application/pdf",
] as const;

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB
const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25MB

const FileSchema = z
  .object({
    file: z.instanceof(Blob),
  })
  .superRefine(({ file }, ctx) => {
    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Unsupported file type "${file.type}". Allowed: JPEG, PNG, WebP, GIF, HEIC, PDF.`,
      });
      return;
    }
    const isPdf = file.type === "application/pdf";
    const limit = isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit) {
      const limitMb = Math.round(limit / 1024 / 1024);
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `File too large. ${isPdf ? "PDFs" : "Images"} must be under ${limitMb}MB.`,
      });
    }
  });

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase storage is not configured" },
      { status: 503 }
    );
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const filename = (file as File).name ?? "upload";
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileBuffer = await file.arrayBuffer();
    const storagePath = `${session.user?.id ?? "anon"}/${Date.now()}-${safeName}`;

    const data = await uploadToSupabaseStorage(
      storagePath,
      fileBuffer,
      file.type
    );

    return NextResponse.json({
      url: data.url,
      pathname: data.pathname,
      name: filename,
      contentType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("file upload error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
