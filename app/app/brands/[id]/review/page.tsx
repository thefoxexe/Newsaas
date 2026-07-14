import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { brands } from "@/src/db/schema";
import { getCurrentSession } from "@/src/supabase/get-session";
import { getUserPlan } from "@/src/entitlements/get-user-plan";
import { PLAN_LIMITS } from "@/src/entitlements/plans";
import { getDictionary } from "@/src/i18n/locale";
import { ReviewForm } from "./review-form";

export default async function BrandReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const [brand] = await db.select().from(brands).where(eq(brands.id, id));

  if (!brand || brand.userId !== session.user.id) {
    redirect("/app/brands");
  }

  // A saved brand on a 1-business plan is permanent — nothing to edit,
  // there's no swapping. On multi-business plans, revisiting this page for
  // an already-saved brand is the "Edit" action from the Brands list.
  if (brand.saved) {
    const plan = await getUserPlan(db, session.user.id);
    if (PLAN_LIMITS[plan].maxBrands === 1) {
      redirect(`/app/brands/${id}/generate`);
    }
  }

  const { t } = await getDictionary();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{t.brandReviewPage.title}</h1>
      <p className="mt-2 text-muted">{t.brandReviewPage.subtitle}</p>
      <div className="mt-8 max-w-xl">
        <ReviewForm brandId={id} mode={brand.saved ? "edit" : "save"} t={t.brandReviewPage} />
      </div>
    </div>
  );
}
