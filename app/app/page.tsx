import { Generator } from "./generator";

export default async function GeneratorPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const { brand } = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-bold">Générateur</h1>
      <p className="mt-2 text-muted">Colle une URL, valide la DA, choisis tes concepts, lance le rendu.</p>
      <div className="mt-8">
        <Generator initialBrandId={brand ?? null} />
      </div>
    </div>
  );
}
