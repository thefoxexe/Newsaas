import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { brands } from "@/src/db/schema";
import { getCurrentSession } from "@/src/supabase/get-session";
import { getDictionary } from "@/src/i18n/locale";
import { Generator } from "../../../generator";

export default async function BrandGeneratePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const [brand] = await db.select().from(brands).where(eq(brands.id, id));

  if (!brand || brand.userId !== session.user.id) {
    redirect("/app/brands");
  }

  // A brand must go through the review/save step before it can generate —
  // this is what actually enforces "only saved brands are usable" (see
  // app/api/brands/[id]/save/route.ts).
  if (!brand.saved) {
    redirect(`/app/brands/${id}/review`);
  }

  const { t } = await getDictionary();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{brand.name}</h1>
      <p className="mt-2 text-muted">{t.generator.subtitle}</p>
      <div className="mt-8">
        <Generator brandId={id} t={t.generator} />
      </div>
    </div>
  );
}
