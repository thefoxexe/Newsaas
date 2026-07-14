import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { SupabaseVideoStorage } from "../src/storage/supabase-video-storage";

function fakeClient(overrides: { uploadError?: string; removeError?: string } = {}) {
  const upload = vi.fn().mockResolvedValue({ error: overrides.uploadError ? { message: overrides.uploadError } : null });
  const getPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: "https://example.supabase.co/storage/v1/object/public/renders/clip.mp4" } });
  const remove = vi.fn().mockResolvedValue({ error: overrides.removeError ? { message: overrides.removeError } : null });
  const from = vi.fn().mockReturnValue({ upload, getPublicUrl, remove });
  const client = { storage: { from } };
  return { client, upload, getPublicUrl, remove, from };
}

describe("SupabaseVideoStorage", () => {
  it("uploads the file's bytes and returns the bucket's public URL", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "reeljolt-storage-test-"));
    const localPath = path.join(dir, "clip.mp4");
    await writeFile(localPath, Buffer.from("hello video"));

    try {
      const { client, upload, from } = fakeClient();
      const storage = new SupabaseVideoStorage(client as never, "renders");

      const url = await storage.upload(localPath, "clip.mp4");

      expect(from).toHaveBeenCalledWith("renders");
      expect(upload).toHaveBeenCalledWith("clip.mp4", Buffer.from("hello video"), {
        contentType: "video/mp4",
        upsert: true,
      });
      expect(url).toBe("https://example.supabase.co/storage/v1/object/public/renders/clip.mp4");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("throws with the Supabase error message when upload fails", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "reeljolt-storage-test-"));
    const localPath = path.join(dir, "clip.mp4");
    await writeFile(localPath, Buffer.from("x"));

    try {
      const { client } = fakeClient({ uploadError: "bucket not found" });
      const storage = new SupabaseVideoStorage(client as never, "renders");

      await expect(storage.upload(localPath, "clip.mp4")).rejects.toThrow("bucket not found");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("removes the object by key", async () => {
    const { client, remove } = fakeClient();
    const storage = new SupabaseVideoStorage(client as never, "renders");

    await storage.remove("clip.mp4");

    expect(remove).toHaveBeenCalledWith(["clip.mp4"]);
  });

  it("throws with the Supabase error message when remove fails", async () => {
    const { client } = fakeClient({ removeError: "not found" });
    const storage = new SupabaseVideoStorage(client as never, "renders");

    await expect(storage.remove("clip.mp4")).rejects.toThrow("not found");
  });
});
