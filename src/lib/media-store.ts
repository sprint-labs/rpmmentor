import { supabase } from "@/integrations/supabase/client";
import type { SessionUser } from "@/lib/auth";

export type MediaKind = "video" | "pdf" | "image" | "audio";

export interface MediaAsset {
  id: string;
  gk_id: string;
  title: string;
  notes: string | null;
  media_type: MediaKind;
  mime_type: string | null;
  file_path: string;
  file_size: number | null;
  uploaded_by_id: string | null;
  uploaded_by_name: string | null;
  uploaded_by_role: string | null;
  created_at: string;
}

export const MAX_FILE_BYTES = 200 * 1024 * 1024; // 200MB
export const BUCKET = "gk-media";

export const ACCEPT_BY_KIND: Record<MediaKind, string> = {
  video: "video/mp4,video/quicktime,video/webm,video/x-matroska",
  pdf: "application/pdf",
  image: "image/jpeg,image/png,image/webp,image/gif",
  audio: "audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/x-m4a,audio/aac",
};

export function detectKind(file: File): MediaKind | null {
  const t = file.type;
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("audio/")) return "audio";
  if (t === "application/pdf") return "pdf";
  return null;
}

export function formatBytes(n: number | null | undefined): string {
  if (!n && n !== 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
}

export async function uploadMedia(opts: {
  file: File;
  gkId: string;
  title: string;
  notes?: string;
  kind: MediaKind;
  user: SessionUser;
}): Promise<MediaAsset> {
  const { file, gkId, title, notes, kind, user } = opts;

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File exceeds the 200MB upload limit.");
  }

  const path = `${gkId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitizeName(file.name)}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

  const { data, error: dbErr } = await supabase
    .from("media_assets")
    .insert({
      gk_id: gkId,
      title,
      notes: notes || null,
      media_type: kind,
      mime_type: file.type || null,
      file_path: path,
      file_size: file.size,
      uploaded_by_id: user.id,
      uploaded_by_name: user.name,
      uploaded_by_role: user.role,
    })
    .select("*")
    .single();

  if (dbErr) {
    // Best-effort cleanup
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(`Could not save media record: ${dbErr.message}`);
  }
  return data as MediaAsset;
}

export async function listMedia(gkId?: string): Promise<MediaAsset[]> {
  let q = supabase.from("media_assets").select("*").order("created_at", { ascending: false });
  if (gkId) q = q.eq("gk_id", gkId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data || []) as MediaAsset[];
}

export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function deleteMedia(asset: MediaAsset): Promise<void> {
  await supabase.storage.from(BUCKET).remove([asset.file_path]);
  const { error } = await supabase.from("media_assets").delete().eq("id", asset.id);
  if (error) throw new Error(error.message);
}
