import { getDictionary } from "@/src/i18n/locale";
import { Generator } from "./generator";

export default async function GeneratorPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const { brand } = await searchParams;
  const { t } = await getDictionary();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{t.generator.title}</h1>
      <p className="mt-2 text-muted">{t.generator.subtitle}</p>
      <div className="mt-8">
        <Generator initialBrandId={brand ?? null} t={t.generator} />
      </div>
    </div>
  );
}
