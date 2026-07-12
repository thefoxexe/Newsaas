import Link from "next/link";

const LINKS = [
  { href: "#demos", label: "Démos" },
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#tarifs", label: "Tarifs" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            R
          </span>
          ReelJolt
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground sm:block">
            Se connecter
          </Link>
          <Link
            href="/sign-up"
            className="rounded-pill bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            Essayer gratuitement
          </Link>
        </div>
      </div>
    </header>
  );
}
