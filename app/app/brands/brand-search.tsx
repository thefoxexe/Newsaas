"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type BrandRow = { id: string; name: string; sourceUrl: string; status: string };

// Only rendered for plans that allow more than one business (see
// app/app/brands/page.tsx) — search + edit + delete are a multi-business
// management surface, not something a 1-business plan needs.
export function BrandSearch({
  brands,
  searchPlaceholder,
  editLabel,
  deleteLabel,
  deleteConfirmLabel,
}: {
  brands: BrandRow[];
  searchPlaceholder: string;
  editLabel: string;
  deleteLabel: string;
  deleteConfirmLabel: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? brands.filter(
        (brand) =>
          brand.name.toLowerCase().includes(normalizedQuery) || brand.sourceUrl.toLowerCase().includes(normalizedQuery),
      )
    : brands;

  async function handleDelete(id: string): Promise<void> {
    if (!window.confirm(deleteConfirmLabel)) return;
    setDeletingId(id);
    await fetch(`/api/brands/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={searchPlaceholder}
        className="mb-4 w-full rounded-pill border border-border bg-surface px-4 py-2.5 outline-none focus:border-primary"
      />
      <div className="flex flex-col gap-3">
        {filtered.map((brand) => (
          <div
            key={brand.id}
            className="card-hover flex flex-col gap-2 rounded-card border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <Link href={`/app/brands/${brand.id}/generate`} className="min-w-0 flex-1">
              <p className="font-semibold">{brand.name}</p>
              <p className="truncate text-sm text-muted">{brand.sourceUrl}</p>
            </Link>
            <div className="flex shrink-0 items-center gap-4">
              <Link href={`/app/brands/${brand.id}/review`} className="text-sm font-semibold text-muted hover:text-foreground">
                {editLabel}
              </Link>
              <button
                onClick={() => handleDelete(brand.id)}
                disabled={deletingId === brand.id}
                className="text-sm font-semibold text-danger disabled:opacity-50"
              >
                {deleteLabel}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
