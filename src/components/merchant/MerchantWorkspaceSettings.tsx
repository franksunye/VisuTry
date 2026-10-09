import { Globe2, Info, Store, User } from "lucide-react";
import { MerchantWorkspaceDetailsForm } from "@/components/merchant/MerchantWorkspaceDetailsForm";
import { MerchantBrandKitSettings } from "@/components/merchant/MerchantBrandKitSettings";

type MerchantWorkspaceSettingsProps = {
  merchantId: string;
  initialName: string;
  initialWebsiteUrl?: string | null;
  initialLogoUrl?: string | null;
  initialAccentColor?: string | null;
  liveExperiences?: number;
  brandOwner?: boolean;
};

export function MerchantWorkspaceSettings({
  merchantId,
  initialName,
  initialWebsiteUrl,
  initialLogoUrl,
  initialAccentColor,
  liveExperiences = 0,
  brandOwner = false,
}: MerchantWorkspaceSettingsProps) {
  return (
    <section className="space-y-6" aria-labelledby="merchant-settings-title">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">
          Workspace settings
        </p>
        <h1 id="merchant-settings-title" className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Manage your workspace identity and basic details.
        </p>
      </header>

      <div role="note" aria-label="Workspace profile information" className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-4 text-sm text-blue-950 sm:gap-4 sm:px-5 sm:py-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 sm:h-11 sm:w-11">
          <Info className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-semibold">These details help identify your workspace</p>
          <p className="mt-1 text-sm leading-5 text-blue-900/75 sm:leading-6">
            Your workspace name appears in the merchant workspace switcher and shopper-facing Store experiences. When configured, your website can appear as a public merchant link.
          </p>
        </div>
      </div>

      <MerchantBrandKitSettings merchantId={merchantId} merchantName={initialName} initialLogoUrl={initialLogoUrl ?? null} initialAccentColor={initialAccentColor ?? null} liveExperiences={liveExperiences} canEdit={brandOwner} />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]" aria-labelledby="workspace-details-title">
          <header className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <h2 id="workspace-details-title" className="text-lg font-semibold tracking-tight text-slate-950">
              Workspace details
            </h2>
            <p className="mt-1.5 text-sm leading-5 text-slate-600">
              Update your brand name or website. These details represent your workspace across VisuTry.
            </p>
          </header>
          <div className="px-5 py-5 sm:px-6 sm:py-6">
            <MerchantWorkspaceDetailsForm
              merchantId={merchantId}
              initialName={initialName}
              initialWebsiteUrl={initialWebsiteUrl}
              variant="settings"
            />
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm shadow-slate-900/[0.02] sm:px-6" aria-labelledby="about-workspace-details-title">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
            Workspace identity
          </p>
          <h2 id="about-workspace-details-title" className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
            Where these details appear
          </h2>
          <p className="mt-1 text-sm leading-5 text-slate-600">A quick guide to your workspace profile.</p>
          <ul className="mt-5 divide-y divide-slate-100">
            <li className="flex gap-3 py-4 first:pt-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                <User className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Merchant workspace</h3>
                <p className="mt-1 text-sm leading-5 text-slate-600">The name identifies your workspace in the merchant workspace switcher.</p>
              </div>
            </li>
            <li className="flex gap-3 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                <Store className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Shopper-facing experiences</h3>
                <p className="mt-1 text-sm leading-5 text-slate-600">Your workspace name appears with public Store and Campaign experiences.</p>
              </div>
            </li>
            <li className="flex gap-3 py-4 last:pb-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                <Globe2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Website</h3>
                <p className="mt-1 text-sm leading-5 text-slate-600">When set, your website can appear as a public merchant link.</p>
              </div>
            </li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
