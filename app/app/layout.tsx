import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/src/supabase/get-session";
import { getDictionary } from "@/src/i18n/locale";
import { AppLanguageSwitcher } from "./app-language-switcher";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/sign-in");
  }

  const { locale, t } = await getDictionary();

  const NAV = [
    { href: "/app", label: t.appNav.generator },
    { href: "/app/library", label: t.appNav.library },
    { href: "/app/brands", label: t.appNav.brands },
    { href: "/app/billing", label: t.appNav.billing },
    { href: "/app/settings", label: t.appNav.settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/app" className="flex shrink-0 items-center gap-2 font-display text-lg font-bold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              R
            </span>
            <span className="hidden sm:inline">ReelJolt</span>
          </Link>

          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 whitespace-nowrap rounded-pill px-3 py-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="shrink-0">
            <AppLanguageSwitcher locale={locale} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
