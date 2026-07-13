import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { brands } from "@/src/db/schema";
import { getCurrentSession } from "@/src/supabase/get-session";
import { getDictionary } from "@/src/i18n/locale";
import { AddBusinessForm } from "./add-business-form";

export default async function BrandsPage() {
  const session = await getCurrentSession();
  if (!session) return null;
  const { t } = await getDictionary();

  const rows = await db.select().from(brands).where(eq(brands.userId, session.user.id)).orderBy(desc(brands.createdAt));

  return (
    <div>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{t.brandsPage.title}</h1>

      <div className="mt-6">
        <AddBusinessForm
          placeholder={t.brandsPageExtra.addBusinessPlaceholder}
          addLabel={t.brandsPageExtra.addBusiness}
          limitReachedLabel={t.brandsPageExtra.limitReached}
          upgradeCta={t.brandsPageExtra.upgradeCta}
          genericErrorLabel={t.generator.submitError}
        />
      </div>

      {rows.length === 0 && <p className="mt-4 text-muted">{t.brandsPage.empty}</p>}
      <div className="flex flex-col gap-3">
        {rows.map((brand) => (
          <Link
            key={brand.id}
            href={`/app?brand=${brand.id}`}
            className="card-hover flex flex-col gap-2 rounded-card border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-semibold">{brand.name}</p>
              <p className="truncate text-sm text-muted">{brand.sourceUrl}</p>
            </div>
            <span className="shrink-0 text-xs font-semibold uppercase tracking-widest text-primary">{brand.status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
