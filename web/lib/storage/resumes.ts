import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeResumeFilename } from "@/lib/validation/resume";

export const RESUMES_BUCKET = "resumes";

let bucketEnsured = false;

/**
 * Ensures the private `resumes` bucket exists.
 * Uses the Supabase Storage admin API (service role).
 * If creation fails (e.g. permissions), create manually in the dashboard:
 *   Storage → New bucket → name `resumes`, public = false
 */
export async function ensureResumesBucket(): Promise<void> {
  if (bucketEnsured) {
    return;
  }

  const supabase = createAdminClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw new Error(`Failed to list storage buckets: ${listError.message}`);
  }

  const exists = buckets?.some((bucket) => bucket.name === RESUMES_BUCKET);
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(RESUMES_BUCKET, {
      public: false,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ],
    });

    if (createError && !createError.message.toLowerCase().includes("already exists")) {
      throw new Error(
        `Failed to create resumes bucket. Create it manually in Supabase Storage (private, name: ${RESUMES_BUCKET}). ${createError.message}`
      );
    }
  }

  bucketEnsured = true;
}

export function buildResumeStoragePath(
  userId: string,
  documentId: string,
  originalFilename: string
): string {
  const safeFilename = sanitizeResumeFilename(originalFilename);
  return `${userId}/${documentId}/${safeFilename}`;
}

export async function uploadResumeFile(
  storagePath: string,
  bytes: Buffer,
  mimeType: string
): Promise<void> {
  await ensureResumesBucket();

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(RESUMES_BUCKET)
    .upload(storagePath, bytes, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }
}

export async function downloadResumeFile(storagePath: string): Promise<Buffer> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(RESUMES_BUCKET)
    .download(storagePath);

  if (error || !data) {
    throw new Error(`Storage download failed: ${error?.message ?? "No data returned"}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function getResumeSignedUrl(
  storagePath: string,
  expiresInSeconds = 300
): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(RESUMES_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message ?? "Unknown error"}`);
  }

  return data.signedUrl;
}