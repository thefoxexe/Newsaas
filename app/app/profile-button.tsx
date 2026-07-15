import Link from "next/link";

// A distinct, immediately-recognizable way to reach the account page from
// anywhere in the app — the plain "Settings" text link in the main nav
// already gets there, but a circular initial badge is the standard place
// users look for "my account" and reads better at a glance than more text.
export function ProfileButton({ name, email, label }: { name: string; email: string; label: string }) {
  const initial = (name || email || "?").charAt(0).toUpperCase();

  return (
    <Link
      href="/app/settings"
      aria-label={label}
      title={name || email}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border border-border bg-surface font-display text-sm font-bold text-foreground transition-colors hover:border-border-strong hover:bg-surface-elevated"
    >
      {initial}
    </Link>
  );
}
