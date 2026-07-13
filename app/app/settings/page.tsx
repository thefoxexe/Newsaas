import { getCurrentSession } from "@/src/supabase/get-session";
import { getDictionary } from "@/src/i18n/locale";
import { SignOutButton, DeleteAccountButton } from "./account-actions";
import { ManageSubscriptionButton } from "../billing/billing-actions";

export default async function SettingsPage() {
  const session = await getCurrentSession();
  if (!session) return null;
  const { t } = await getDictionary();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{t.settingsPage.title}</h1>

      <div className="mt-6 rounded-card border border-border bg-surface p-6">
        <p className="text-sm text-muted">{t.settingsPage.name}</p>
        <p className="font-semibold">{session.user.name}</p>
        <p className="mt-4 text-sm text-muted">{t.settingsPage.email}</p>
        <p className="font-semibold">{session.user.email}</p>
        <div className="mt-4">
          <ManageSubscriptionButton label={t.settingsPage.manageBilling} errorLabel={t.billingPage.manageError} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <SignOutButton label={t.settingsPage.signOut} />
        <DeleteAccountButton
          labels={{
            deleteAccount: t.settingsPage.deleteAccount,
            deleteWarning: t.settingsPage.deleteWarning,
            confirmDelete: t.settingsPage.confirmDelete,
            cancel: t.settingsPage.cancel,
          }}
        />
      </div>
    </div>
  );
}
