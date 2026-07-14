"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { claimPendingBrandIfAny } from "../../claim-pending-brand";

// Mounted on the Brands page (the landing page for every auth path — see
// app/app/page.tsx) so a brand analyzed anonymously before signup gets
// attached to the new account no matter how the user authenticated
// (password sign-up/sign-in, or OAuth via auth/callback, which redirects
// here the same way and has no access to localStorage itself). A cheap
// no-op when there's nothing pending.
export function ClaimPendingRedirect() {
  const router = useRouter();

  useEffect(() => {
    void claimPendingBrandIfAny().then((brandId) => {
      if (brandId) {
        router.replace(`/app/brands/${brandId}/review`);
      }
    });
  }, [router]);

  return null;
}
