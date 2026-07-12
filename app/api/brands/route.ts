import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { brands } from "@/src/db/schema";
import { getCurrentSession } from "@/src/auth/get-session";

const CreateBrandSchema = z.object({
  url: z.string().url(),
});

function nameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// Anonymous submissions are allowed on purpose: the free DA analysis works
// without an account (spec §8/§10) and is claimed after sign-up.
export async function POST(request: Request): Promise<Response> {
  const body = CreateBrandSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "invalid body", issues: body.error.issues }, { status: 400 });
  }

  const session = await getCurrentSession();

  const [brand] = await db
    .insert(brands)
    .values({
      userId: session?.user.id ?? null,
      name: nameFromUrl(body.data.url),
      sourceUrl: body.data.url,
      status: "pending",
    })
    .returning({ id: brands.id });

  if (!brand) {
    return NextResponse.json({ error: "failed to create brand" }, { status: 500 });
  }

  return NextResponse.json({ id: brand.id }, { status: 201 });
}

export async function GET(): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db.select().from(brands).where(eq(brands.userId, session.user.id));
  return NextResponse.json({ brands: rows });
}
