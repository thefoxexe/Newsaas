import { getCurrentSession } from "@/src/auth/get-session";
import { SignOutButton, DeleteAccountButton } from "./account-actions";

export default async function SettingsPage() {
  const session = await getCurrentSession();
  if (!session) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold">Réglages</h1>

      <div className="mt-6 rounded-card border border-border bg-surface p-6">
        <p className="text-sm text-muted">Nom</p>
        <p className="font-semibold">{session.user.name}</p>
        <p className="mt-4 text-sm text-muted">Email</p>
        <p className="font-semibold">{session.user.email}</p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <SignOutButton />
        <DeleteAccountButton />
      </div>
    </div>
  );
}
