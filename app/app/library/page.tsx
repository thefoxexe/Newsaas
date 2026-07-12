import { desc, eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { renders } from "@/src/db/schema";
import { getCurrentSession } from "@/src/supabase/get-session";

export default async function LibraryPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const rows = await db
    .select()
    .from(renders)
    .where(eq(renders.userId, session.user.id))
    .orderBy(desc(renders.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-bold">Bibliothèque</h1>
      {rows.length === 0 && <p className="mt-4 text-muted">Aucune vidéo générée pour l&apos;instant.</p>}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {rows.map((render) => (
          <div key={render.id} className="rounded-card border border-border bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-muted">
              {render.format} · {render.status}
            </p>
            {render.status === "done" && render.outputUrl ? (
              <video src={render.outputUrl} controls className="mt-2 w-full rounded-card" />
            ) : (
              <p className="mt-2 text-sm text-muted">
                {render.status === "failed" ? "Échec du rendu" : "En cours..."}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
