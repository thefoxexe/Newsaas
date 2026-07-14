import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/src/supabase/get-session";
import { getDictionary } from "@/src/i18n/locale";
import { db } from "@/src/db/client";
import { hasCompletedPlanSelection } from "@/src/entitlements/get-user-plan";
import { AppLanguageSwitcher } from "./app-language-switcher";
import { MobileNav } from "./mobile-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/sign-in");
  }

  if (!(await hasCompletedPlanSelection(db, session.user.id))) {
    redirect("/onboarding/plan");
  }

  const { locale, t } = await getDictionary();

  const NAV = [
    { href: "/app/brands", label: t.appNav.brands },
    { href: "/app/library", label: t.appNav.library },
    { href: "/app/settings", label: t.appNav.settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/app/brands" className="flex shrink-0 items-center gap-2 font-display text-lg font-bold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              R
            </span>
            <span className="hidden sm:inline">ReelJolt</span>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center gap-1 text-sm sm:flex">
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

          <div className="flex shrink-0 items-center gap-2">
            <AppLanguageSwitcher locale={locale} />
            <MobileNav items={NAV} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
