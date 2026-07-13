"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteRenderButton({ renderId, label, confirmLabel }: { renderId: string; label: string; confirmLabel: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      onClick={async () => {
        if (!window.confirm(confirmLabel)) return;
        setPending(true);
        await fetch(`/api/renders/${renderId}`, { method: "DELETE" });
        router.refresh();
      }}
      disabled={pending}
      className="mt-2 text-xs font-semibold text-danger underline disabled:opacity-50"
    >
      {label}
    </button>
  );
}
