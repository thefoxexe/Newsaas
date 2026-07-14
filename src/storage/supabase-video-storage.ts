import type { SupabaseClient } from "@supabase/supabase-js";
import type { VideoStorage } from "./video-storage";

// Real, durable storage for rendered videos — the worker has no persistent
// disk of its own once deployed (see the LocalDiskStorage comment), so a
// worker restart/redeploy previously wiped every render that was only ever
// copied to local disk. Using the same Supabase project already backing
// auth/DB means no new external account or credential to manage.
export class SupabaseVideoStorage implements VideoStorage {
  constructor(
    private readonly client: SupabaseClient,
    private readonly bucket: string,
  ) {}

  async upload(localFilePath: string, key: string): Promise<string> {
    const { readFile } = await import("node:fs/promises");
    const buffer = await readFile(localFilePath);

    const { error } = await this.client.storage.from(this.bucket).upload(key, buffer, {
      contentType: "video/mp4",
      upsert: true,
    });
    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = this.client.storage.from(this.bucket).getPublicUrl(key);
    return publicUrl;
  }

  async remove(key: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([key]);
    if (error) {
      throw new Error(`Supabase Storage remove failed: ${error.message}`);
    }
  }
}
