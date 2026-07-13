import { desc, eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { renders } from "@/src/db/schema";
import { getCurrentSession } from "@/src/supabase/get-session";
import { getDictionary } from "@/src/i18n/locale";
import { DeleteRenderButton } from "./delete-render-button";

export default async function LibraryPage() {
  const session = await getCurrentSession();
  if (!session) return null;
  const { t } = await getDictionary();

  const rows = await db
    .select()
    .from(renders)
    .where(eq(renders.userId, session.user.id))
    .orderBy(desc(renders.createdAt));

  return (
    <div>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{t.libraryPage.title}</h1>
      {rows.length === 0 && <p className="mt-4 text-muted">{t.libraryPage.empty}</p>}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((render) => (
          <div key={render.id} className="card-hover rounded-card border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {render.format} · {render.status}
            </p>
            {render.status === "done" && render.outputUrl ? (
              <video src={render.outputUrl} controls className="mt-2 w-full rounded-card" />
            ) : (
              <p className="mt-2 text-sm text-muted">
                {render.status === "failed"
                  ? [t.libraryPage.failed, render.errorCode].filter(Boolean).join(": ")
                  : t.libraryPage.inProgress}
              </p>
            )}
            <DeleteRenderButton
              renderId={render.id}
              label={t.libraryPage.deleteButton}
              confirmLabel={t.libraryPage.deleteConfirm}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
