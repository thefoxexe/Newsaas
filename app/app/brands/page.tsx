import { desc, eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { brands } from "@/src/db/schema";
import { getCurrentSession } from "@/src/auth/get-session";

export default async function BrandsPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  const rows = await db.select().from(brands).where(eq(brands.userId, session.user.id)).orderBy(desc(brands.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-bold">Marques</h1>
      {rows.length === 0 && <p className="mt-4 text-muted">Aucune marque enregistrée pour l&apos;instant.</p>}
      <div className="mt-6 flex flex-col gap-3">
        {rows.map((brand) => (
          <div key={brand.id} className="flex items-center justify-between rounded-card border border-border bg-surface p-4">
            <div>
              <p className="font-semibold">{brand.name}</p>
              <p className="text-sm text-muted">{brand.sourceUrl}</p>
            </div>
            <span className="text-xs uppercase tracking-wide text-muted">{brand.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
