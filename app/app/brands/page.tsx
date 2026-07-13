import { desc, eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { brands } from "@/src/db/schema";
import { getCurrentSession } from "@/src/supabase/get-session";
import { getDictionary } from "@/src/i18n/locale";

export default async function BrandsPage() {
  const session = await getCurrentSession();
  if (!session) return null;
  const { t } = await getDictionary();

  const rows = await db.select().from(brands).where(eq(brands.userId, session.user.id)).orderBy(desc(brands.createdAt));

  return (
    <div>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{t.brandsPage.title}</h1>
      {rows.length === 0 && <p className="mt-4 text-muted">{t.brandsPage.empty}</p>}
      <div className="mt-6 flex flex-col gap-3">
        {rows.map((brand) => (
          <div
            key={brand.id}
            className="card-hover flex flex-col gap-2 rounded-card border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-semibold">{brand.name}</p>
              <p className="truncate text-sm text-muted">{brand.sourceUrl}</p>
            </div>
            <span className="shrink-0 text-xs font-semibold uppercase tracking-widest text-primary">{brand.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
