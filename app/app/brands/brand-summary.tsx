import type { BrandKit } from "@/src/domain/brand-kit";

const COLOR_ROLES = ["primary", "secondary", "background", "text"] as const;

// Small identity preview shown on a brand card in the Brands list — enough
// to recognize a business at a glance before clicking into it.
export function BrandSummary({ brandKit }: { brandKit: BrandKit | null }) {
  if (!brandKit) return null;

  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="flex shrink-0 -space-x-1">
        {COLOR_ROLES.map((role) => (
          <span
            key={role}
            className="h-4 w-4 rounded-full border border-border"
            style={{ backgroundColor: brandKit.colors[role] }}
          />
        ))}
      </div>
      {brandKit.copy.tagline && <p className="truncate text-sm text-muted">{brandKit.copy.tagline}</p>}
    </div>
  );
}
