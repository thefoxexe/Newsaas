import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/src/supabase/get-session";

const NAV = [
  { href: "/app", label: "Générateur" },
  { href: "/app/library", label: "Bibliothèque" },
  { href: "/app/brands", label: "Marques" },
  { href: "/app/billing", label: "Abonnement" },
  { href: "/app/settings", label: "Réglages" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <nav className="flex flex-wrap gap-4 border-b border-border pb-4 text-sm">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="text-muted hover:text-foreground">
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8">{children}</div>
    </div>
  );
}
