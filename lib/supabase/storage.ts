import "server-only";

import { createSupabaseAdmin } from "./admin";

const UPLOADS_BUCKET = "uploads";

async function ensureUploadsBucket() {
  const supabase = createSupabaseAdmin();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === UPLOADS_BUCKET);

  if (!exists) {
    await supabase.storage.createBucket(UPLOADS_BUCKET, {
      public: true,
      fileSizeLimit: 25 * 1024 * 1024,
    });
  }
}

export async function uploadToSupabaseStorage(
  path: string,
  body: ArrayBuffer,
  contentType: string
): Promise<{ url: string; pathname: string }> {
  await ensureUploadsBucket();

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(UPLOADS_BUCKET)
    .upload(path, body, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(UPLOADS_BUCKET).getPublicUrl(data.path);

  return {
    url: publicUrl,
    pathname: data.path,
  };
}
