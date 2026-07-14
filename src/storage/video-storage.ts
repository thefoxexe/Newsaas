export interface VideoStorage {
  upload(localFilePath: string, key: string): Promise<string>;
  // Used by the 7-day retention sweep (see worker.ts) to actually free the
  // stored file once its DB row is deleted, not just orphan it in storage.
  remove(key: string): Promise<void>;
}

// Local-dev-only fallback — real deployments use SupabaseVideoStorage (see
// supabase-video-storage.ts). Serves files by writing them under a
// directory the web app can expose statically; fine when the worker and
// the web app share a disk (local dev), not for a real multi-instance
// deployment with no shared disk between them.
export class LocalDiskStorage implements VideoStorage {
  constructor(
    private readonly targetDir: string,
    private readonly publicBaseUrl: string,
  ) {}

  async upload(localFilePath: string, key: string): Promise<string> {
    const { copyFile, mkdir } = await import("node:fs/promises");
    const path = await import("node:path");

    const destination = path.join(this.targetDir, key);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(localFilePath, destination);

    return `${this.publicBaseUrl.replace(/\/$/, "")}/${key}`;
  }

  async remove(key: string): Promise<void> {
    const { rm } = await import("node:fs/promises");
    const path = await import("node:path");
    await rm(path.join(this.targetDir, key), { force: true });
  }
}
