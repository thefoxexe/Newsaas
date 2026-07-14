import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { brands } from "@/src/db/schema";
import { getCurrentSession } from "@/src/supabase/get-session";
import { getUserPlan } from "@/src/entitlements/get-user-plan";
import { PLAN_LIMITS } from "@/src/entitlements/plans";
import { getDictionary } from "@/src/i18n/locale";
import { AddBusinessForm } from "./add-business-form";
import { BrandSearch } from "./brand-search";
import { ClaimPendingRedirect } from "./claim-pending-redirect";

export default async function BrandsPage() {
  const session = await getCurrentSession();
  if (!session) return null;
  const { t } = await getDictionary();

  const plan = await getUserPlan(db, session.user.id);
  const maxBrands = PLAN_LIMITS[plan].maxBrands;
  const canManageBrands = maxBrands !== 1;

  const rows = await db
    .select()
    .from(brands)
    .where(and(eq(brands.userId, session.user.id), eq(brands.saved, true)))
    .orderBy(desc(brands.createdAt));

  const canAddMore = maxBrands === null || rows.length < maxBrands;

  return (
    <div>
      <ClaimPendingRedirect />
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{t.brandsPage.title}</h1>

      <div className="mt-6">
        {canAddMore ? (
          <AddBusinessForm
            placeholder={t.brandsPageExtra.addBusinessPlaceholder}
            addLabel={t.brandsPageExtra.addBusiness}
            genericErrorLabel={t.generator.submitError}
          />
        ) : (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface p-4">
            <p className="text-sm text-muted">
              {canManageBrands ? t.brandsPageExtra.limitReached : t.brandsPageExtra.deleteLocked}
            </p>
            <Link href="/app/billing" className="shrink-0 rounded-pill bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
              {t.brandsPageExtra.upgradeCta}
            </Link>
          </div>
        )}
      </div>

      {rows.length === 0 && <p className="mt-4 text-muted">{t.brandsPage.empty}</p>}

      {rows.length > 0 &&
        (canManageBrands ? (
          <BrandSearch
            brands={rows}
            searchPlaceholder={t.brandsPageExtra.searchPlaceholder}
            editLabel={t.brandsPageExtra.edit}
            deleteLabel={t.brandsPageExtra.delete}
            deleteConfirmLabel={t.brandsPageExtra.deleteConfirm}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((brand) => (
              <Link
                key={brand.id}
                href={`/app/brands/${brand.id}/generate`}
                className="card-hover flex flex-col gap-2 rounded-card border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{brand.name}</p>
                  <p className="truncate text-sm text-muted">{brand.sourceUrl}</p>
                </div>
              </Link>
            ))}
          </div>
        ))}
    </div>
  );
}
