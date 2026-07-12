export interface VideoStorage {
  upload(localFilePath: string, key: string): Promise<string>;
}

// Placeholder used until real object storage (Cloudflare R2 per spec §4) is
// wired up — needs credentials only the account owner can create. Serves
// files by writing them under a directory the web app can expose statically;
// fine for local/demo use, not for a real multi-instance deployment.
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
}
