import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { startStaticFileServer } from "../src/storage/static-file-server";

describe("startStaticFileServer", () => {
  let dir: string;
  const port = 41823;
  const base = `http://localhost:${port}/renders`;

  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "reeljolt-static-test-"));
    await writeFile(path.join(dir, "clip.mp4"), Buffer.from("0123456789"));
    startStaticFileServer(dir, "/renders", port);
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("serves an existing file with the right content", async () => {
    const response = await fetch(`${base}/clip.mp4`);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("0123456789");
    expect(response.headers.get("content-type")).toBe("video/mp4");
  });

  it("returns 404 for a missing file", async () => {
    const response = await fetch(`${base}/missing.mp4`);
    expect(response.status).toBe(404);
  });

  it("returns 404 for a path outside the render directory", async () => {
    const response = await fetch(`${base}/..%2f..%2fetc%2fpasswd`);
    expect(response.status).toBe(404);
  });

  it("honors a range request with a 206 partial response", async () => {
    const response = await fetch(`${base}/clip.mp4`, { headers: { Range: "bytes=2-5" } });
    expect(response.status).toBe(206);
    expect(await response.text()).toBe("2345");
    expect(response.headers.get("content-range")).toBe("bytes 2-5/10");
  });
});
