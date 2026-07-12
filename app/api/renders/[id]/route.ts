import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { renders } from "@/src/db/schema";
import { getCurrentSession } from "@/src/auth/get-session";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const [render] = await db.select().from(renders).where(eq(renders.id, id));

  if (!render || render.userId !== session.user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ render });
}
