const STORAGE_KEY = "reeljolt:pending-brand-id";

export async function claimPendingBrandIfAny(): Promise<string | null> {
  const brandId = window.localStorage.getItem(STORAGE_KEY);
  if (!brandId) return null;

  window.localStorage.removeItem(STORAGE_KEY);

  const response = await fetch(`/api/brands/${brandId}/claim`, { method: "POST" });
  return response.ok ? brandId : null;
}
