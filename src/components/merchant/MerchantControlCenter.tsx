"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
} from "lucide-react";
import type { MerchantAgentCredentialMetadata } from "@/modules/merchant";
import type {
  MerchantCommerceIntelligence,
  MerchantControlCenter as MerchantControlCenterModel,
  MerchantControlExperience,
} from "@/modules/merchant/application/merchant-control-center";
import { analytics } from "@/lib/analytics";
import { AnalyticsEvent } from "@/lib/analytics-events";
import {
  MERCHANT_DISTRIBUTION_SOURCE_LABELS,
  type MerchantDistributionReport,
} from "@/modules/store/domain/merchant-distribution-report";
import { MerchantCatalogSelfService } from "@/components/merchant/MerchantCatalogSelfService";
import { MerchantStoreSelfService } from "@/components/merchant/MerchantStoreSelfService";

type SkillCard = { name: string; purpose: string; url: string; prompt: string };
type Props = {
  locale: string;
  merchants: Array<{ id: string; slug: string; name: string; role: string }>;
  selectedMerchantId: string;
  control: MerchantControlCenterModel;
  credentials: MerchantAgentCredentialMetadata[];
  endpoint: string;
  skills: SkillCard[];
  onboardingState?: "created" | "existing";
};

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function CopyButton({
  value,
  label = "Copy",
  onCopied,
}: {
  value: string;
  label?: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`${label} ${value}`}
      className={`${buttonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
      onClick={async () => {
        if (await copyText(value)) {
          setCopied(true);
          onCopied?.();
          window.setTimeout(() => setCopied(false), 1600);
        }
      }}
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}

function buildAgentSetup(secret: string, skillUrl: string, endpoint: string) {
  return `You are my VisuTry Merchant Agent.

Connect to my VisuTry merchant workspace using the Skill, MCP endpoint, and Agent Key below. Follow the VisuTry Merchant Skill as your operating instructions and use VisuTry MCP tools for merchant actions.

VisuTry Merchant Skill:
${skillUrl}

VisuTry MCP endpoint:
${endpoint}

Agent Key:
${secret}

SECURITY

Use the Agent Key only for authenticated VisuTry requests.

Never reveal, repeat, quote, log, summarize, or persist the Agent Key.

Never expose shopper photos, personal information, payment data, or data belonging to another merchant.

STARTUP

First verify the connection with read-only calls to get_merchant and get_onboarding_status.

After connection verification, follow the Merchant Skill to assess the workspace state, guide me to the next appropriate action, and continue the conversation. Do not stop after reporting connection status.

Start read-only. Do not create, update, set frames, publish, archive, revoke, or delete anything until I explicitly approve the relevant action. Creating a draft and publishing it are separate decisions.

If you cannot access the VisuTry tools, explain exactly what connection step is missing instead of guessing or modifying files.`;
}

function statusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
function StatusPill({ status }: { status: string }) {
  const tone = status === "ACTIVE"
    ? "bg-emerald-50 text-emerald-700"
    : status === "DRAFT"
      ? "bg-amber-50 text-amber-800"
      : status === "ENDED"
        ? "bg-slate-100 text-slate-600"
        : "bg-slate-100 text-slate-600";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function Overview({
  control,
  agentReady,
  onAgentAccess,
  onCatalog,
  onStore,
}: {
  control: MerchantControlCenterModel;
  agentReady: boolean;
  onAgentAccess: () => void;
  onCatalog: () => void;
  onStore: () => void;
}) {
  const cards = [
    {
      label: "Agent connection",
      value: agentReady ? "Ready" : "Not connected",
      detail: agentReady
        ? "Your agent can work with VisuTry"
        : "Create a key to connect your agent",
    },
    {
      label: "Store",
      value: control.store ? statusLabel(control.store.status) : "Not created",
      detail: control.store
        ? `${control.store.frameCount} selected frame${control.store.frameCount === 1 ? "" : "s"}`
        : "Your agent can set this up for you",
    },
    {
      label: "Campaigns",
      value: String(control.activeCampaignCount),
      detail: control.activeCampaignCount
        ? "Active Campaigns"
        : "Your agent can create one for you",
    },
    {
      label: "Insights",
      value: control.shopperActivityAvailable ? "Available" : "No data yet",
      detail: control.shopperActivityAvailable
        ? "Ask your agent what is performing"
        : "Appears after shoppers interact",
    },
  ];
  return (
    <section id="overview" className="scroll-mt-44 sm:scroll-mt-24">
      <div className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_80%_0%,rgba(191,219,254,0.45),transparent_34%),linear-gradient(135deg,#ffffff,#f7fbff)] p-6 shadow-[0_25px_80px_-55px_rgba(15,23,42,0.55)] sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          Merchant workspace
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
          Bring your eyewear catalog to life.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Start with your store URL, a CSV, or a few products manually. Review
          what VisuTry found, approve the valid rows, and keep your catalog in
          your own merchant workspace.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className={`${buttonClass} bg-slate-950 text-white hover:bg-slate-800`}
            onClick={onAgentAccess}
          >
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            {agentReady ? "Open agent connection" : "Connect your Agent"}
          </button>
          {control.catalog.total > 0 ? <button
            type="button"
            className={`${buttonClass} border border-blue-200 bg-white text-blue-800 hover:border-blue-400`}
            onClick={onStore}
          >
            {control.store ? "Open Store setup" : "Create your Store"}
          </button> : null}
          <button
            type="button"
            className={`${buttonClass} border border-slate-300 bg-white text-slate-800 hover:border-blue-300`}
            onClick={onCatalog}
          >
            {control.catalog.total > 0 ? "Manage catalog" : "Add eyewear catalog"}
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {card.value}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {card.detail}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function WorkspaceDetails({
  merchantId,
  initialName,
  initialWebsiteUrl,
}: {
  merchantId: string;
  initialName: string;
  initialWebsiteUrl?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/merchant/${merchantId}/profile`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, websiteUrl: websiteUrl || null }),
      });
      const body = (await response.json()) as {
        data?: unknown;
        error?: string;
      };
      if (!response.ok)
        throw new Error(body.error || "Unable to save workspace details.");
      setMessage("Saved");
      router.refresh();
    } catch (requestError) {
      setMessage(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save workspace details.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        onClick={() => setOpen((current) => !current)}
      >
        <span>
          <span className="block text-sm font-semibold text-slate-900">
            Workspace details
          </span>
          <span className="mt-1 block text-xs text-slate-500">
            Optional — update your brand name or website anytime.
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div className="border-t border-slate-100 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="text-xs font-semibold text-slate-700"
                htmlFor="workspace-name"
              >
                Brand or store name
              </label>
              <input
                id="workspace-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label
                className="text-xs font-semibold text-slate-700"
                htmlFor="workspace-website"
              >
                Website{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="workspace-website"
                type="url"
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="https://your-store.example"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy || name.trim().length < 2}
              className={`${buttonClass} bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-50`}
              onClick={() => void save()}
            >
              {busy ? "Saving…" : "Save details"}
            </button>
            {message ? (
              <span
                className={`text-xs ${message === "Saved" ? "text-emerald-700" : "text-red-700"}`}
                role="status"
              >
                {message}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function insightRate(value: number | null) {
  return value === null ? "—" : `${value}%`;
}

function formatInsightDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

function insightWindowLabel(period: MerchantCommerceIntelligence["period"]) {
  return `${formatInsightDate(period.from)} – ${formatInsightDate(period.to)}`;
}

function insightDelta(value: number | null) {
  if (value === null) return "No prior activity";
  if (value === 0) return "No change vs previous period";
  return `${value > 0 ? "+" : ""}${value}% vs previous period`;
}

function catalogSourceLabel(source: string) {
  return source === "SEED" ? "Seed" : source === "MANUAL" ? "Manual" : source === "CSV" ? "CSV" : source === "EXTERNAL" ? "External" : source;
}

function readinessLabel(status: MerchantControlExperience["readiness"]["status"]) {
  if (status === "VALID") return "Catalog ready";
  if (status === "NEEDS_ATTENTION") return "Needs attention";
  return "Select products to continue";
}

function SourceDistribution({
  report,
  period,
  highlights,
}: {
  report?: MerchantDistributionReport;
  period: MerchantCommerceIntelligence["period"];
  highlights: MerchantCommerceIntelligence["sourceHighlights"];
}) {
  if (!report) return null;
  return (
    <div className="mt-6 border-t border-slate-200 pt-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            Source → decision actions
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Durable Store/Campaign sessions grouped by first-touch source class.
          </p>
        </div>
        <span className="text-right text-xs font-medium text-slate-400">
          Window: {insightWindowLabel(period)}
        </span>
      </div>
      {report.sources.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">
          No source-class activity yet.
        </p>
      ) : (
        <>
          <div className="mt-3 grid gap-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs sm:grid-cols-3">
            <div><span className="text-slate-500">Most visitors</span><p className="mt-1 font-semibold text-slate-900">{highlights.topVisitors ?? "No reliable leader yet"}</p></div>
            <div><span className="text-slate-500">Most downstream intent</span><p className="mt-1 font-semibold text-slate-900">{highlights.topDownstreamIntent ?? "No reliable leader yet"}</p></div>
            <div><span className="text-slate-500">Most high-intent</span><p className="mt-1 font-semibold text-slate-900">{highlights.topHighIntent ?? "No reliable leader yet"}</p></div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {report.sources.map((source) => (
            <article
              key={source.sourceClass}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-semibold text-slate-900">
                  {MERCHANT_DISTRIBUTION_SOURCE_LABELS[source.sourceClass]}
                </h4>
                <span className="text-sm font-semibold tabular-nums text-slate-950">
                  {source.visitors} visitors
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <dt className="text-slate-500">Engaged</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-slate-900">
                    {source.engagedShoppers}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Recommendation</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-slate-900">
                    {source.recommendationActivity}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Try-On</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-slate-900">
                    {source.tryOnCompletions}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Compare</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-slate-900">
                    {source.compareActivity}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Downstream intent</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-slate-900">
                    {source.productClicks + source.inquiries}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">High-intent</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-slate-900">
                    {source.highIntentShoppers}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
          </div>
        </>
      )}
      <p className="mt-3 text-xs leading-5 text-slate-500">
        {report.consumerEventBoundary}
      </p>
    </div>
  );
}

function CommerceIntelligence({
  insights,
  onAgentAccess = () =>
    document
      .getElementById("agent-access")
      ?.scrollIntoView({ behavior: "smooth" }),
}: {
  insights?: MerchantCommerceIntelligence;
  onAgentAccess?: () => void;
}) {
  if (!insights) return null;
  const windowLabel = insightWindowLabel(insights.period);
  const cards = [
    ["Visitors", insights.totals.visitors, "shopper sessions", insights.comparison.deltas.visitors],
    [
      "Engaged Shoppers",
      insights.totals.engagedShoppers,
      `${insightRate(insights.rates.engagement)} engagement rate`,
      insights.comparison.deltas.engagedShoppers,
    ],
    [
      "Recommendation",
      insights.totals.recommendationActivity,
      `${insightRate(insights.rates.recommendation)} of visitors`,
      insights.comparison.deltas.recommendationActivity,
    ],
    [
      "Try-On",
      insights.totals.tryOnCompletions,
      `${insightRate(insights.rates.tryOn)} of visitors`,
      insights.comparison.deltas.tryOnCompletions,
    ],
    [
      "Compare",
      insights.totals.compareActivity,
      `${insightRate(insights.rates.compare)} of visitors`,
      insights.comparison.deltas.compareActivity,
    ],
    [
      "Product Click",
      insights.totals.productClicks,
      "merchant destination intent",
      insights.comparison.deltas.productClicks,
    ],
    [
      "High-Intent Shoppers",
      insights.totals.highIntentShoppers,
      "aggregate behavioral signal",
      insights.comparison.deltas.highIntentShoppers,
    ],
  ] as const;
  return (
    <section
      id="insights"
      className="scroll-mt-44 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:scroll-mt-24 sm:p-8"
      aria-labelledby="commerce-intelligence-heading"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            Commerce Intelligence
          </p>
          <h2
            id="commerce-intelligence-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl"
          >
            Understand shopper intent
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Aggregate behavior in a rolling 30-day window, separated by Store
            and Campaign. No shopper photos, identity, revenue, or purchase
            claims are shown.
          </p>
          <div className="mt-4 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:gap-3">
            <span className="font-semibold text-slate-700">
              Data window (UTC)
            </span>
            <span>{windowLabel}</span>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <button
            type="button"
            className={`${buttonClass} border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100`}
            onClick={onAgentAccess}
          >
            Continue with Agent
          </button>
          <BarChart3
            className="mt-1 h-7 w-7 shrink-0 text-blue-600"
            aria-hidden="true"
          />
        </div>
      </div>
      {!insights.hasActivity ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            No shopper activity yet
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
            Share a published Store or Campaign to start collecting decision
            signals. Your Agent can help review the next approved action.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(([label, value, detail, delta]) => (
              <article
                key={label}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">
                  {value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{detail}</p>
                <p className="mt-2 text-[11px] font-medium text-blue-700">{insightDelta(delta)}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">What to review next</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{insights.interpretation.summary}</p>
                </div>
                <button type="button" className={`${buttonClass} shrink-0 border border-blue-200 bg-white text-blue-800 hover:bg-blue-50`} onClick={onAgentAccess}>
                  {insights.interpretation.nextAction}
                </button>
              </div>
              {insights.interpretation.evidence.length > 1 ? (
                <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-600">
                  {insights.interpretation.evidence.slice(1, 3).map((item) => <li key={item}>• {item}</li>)}
                </ul>
              ) : null}
            </article>
            <article className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">Experience performance</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{insights.experiencePerformance.reliable ? "A reliable relative comparison for this window." : "Not enough activity for a reliable comparison."}</p>
                </div>
                <span className="text-xs font-medium text-slate-500">Previous: {insightWindowLabel(insights.comparison.previousPeriod)}</span>
              </div>
              <div className="mt-3 space-y-2">
                {insights.experiencePerformance.ranked.slice(0, 3).map((experience, index) => (
                  <div key={experience.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate font-medium text-slate-800">{index + 1}. {experience.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-slate-500">{experience.visitors} visitors · {experience.highIntentShoppers} high-intent</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    Store / Campaign context
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Metrics remain scoped to the Experience that received the
                    session.
                  </p>
                </div>
              </div>
              <div className="mt-3 grid gap-3">
                {insights.experiences.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">
                    No Store or Campaign context yet.
                  </p>
                ) : (
                  insights.experiences.map((experience) => (
                    <article
                      key={experience.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${experience.type === "CAMPAIGN" ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"}`}
                        >
                          {experience.type === "CAMPAIGN"
                            ? "Campaign"
                            : "Store"}
                        </span>
                        {experience.referenceData ? (
                          <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800">
                            Reference / Simulation
                          </span>
                        ) : null}
                        <span className="text-xs text-slate-500">
                          {experience.status}
                        </span>
                      </div>
                      <h4 className="mt-2 font-semibold text-slate-900">
                        {experience.name}
                      </h4>
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                        <div>
                          <dt className="text-slate-500">Visitors</dt>
                          <dd className="mt-1 font-semibold tabular-nums text-slate-900">
                            {experience.visitors}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Engaged</dt>
                          <dd className="mt-1 font-semibold tabular-nums text-slate-900">
                            {experience.engagedShoppers}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Try-On</dt>
                          <dd className="mt-1 font-semibold tabular-nums text-slate-900">
                            {experience.tryOnCompletions}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Product Click</dt>
                          <dd className="mt-1 font-semibold tabular-nums text-slate-900">
                            {experience.productClicks}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ))
                )}
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-950">
                Acquisition Source
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                First-touch source persisted on each shopper session.
              </p>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                {insights.acquisitionSources.length === 0 ? (
                  <p className="px-4 py-5 text-sm text-slate-500">
                    No source data yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {insights.acquisitionSources.map((source) => (
                      <li
                        key={source.source}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                      >
                        <span className="min-w-0 truncate font-medium text-slate-700">
                          {source.source}
                        </span>
                        <span className="shrink-0 tabular-nums font-semibold text-slate-950">
                          {source.visitors}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          <SourceDistribution
            report={insights.distributionReport}
            period={insights.period}
            highlights={insights.sourceHighlights}
          />
        </>
      )}
    </section>
  );
}

function SecretModal({
  setupText,
  copied,
  onCopy,
  onClose,
}: {
  setupText: string;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeButton.current?.focus();
  }, []);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="one-time-secret-title"
    >
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3
              id="one-time-secret-title"
              className="text-xl font-semibold text-slate-950"
            >
              Your Agent startup prompt is ready
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {copied
                ? "The startup prompt is copied to your clipboard."
                : "Clipboard access was blocked. Copy the startup prompt below before continuing."}{" "}
              Paste it as your first message to your Agent. It includes the
              Skill, MCP endpoint, and one-time Agent Key. The Key will not be
              shown again after closing this window.
            </p>
          </div>
        </div>
        <pre className="mt-6 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-slate-800">
          {setupText}
        </pre>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span
            className={`text-xs font-semibold ${copied ? "text-emerald-700" : "text-amber-700"}`}
          >
            {copied ? "Startup prompt copied" : "Copy before closing"}
          </span>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              ref={closeButton}
              type="button"
              className={`${buttonClass} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`}
              onClick={onClose}
            >
              Continue to Agent
            </button>
            <button
              type="button"
              aria-label="Copy Agent startup prompt"
              className={`${buttonClass} bg-slate-950 text-white hover:bg-slate-800`}
              onClick={onCopy}
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copy startup prompt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentAccess({
  merchantId,
  endpoint,
  skills,
  initialCredentials,
  onCredentialsChanged,
}: {
  merchantId: string;
  endpoint: string;
  skills: SkillCard[];
  initialCredentials: MerchantAgentCredentialMetadata[];
  onCredentialsChanged: (
    credentials: MerchantAgentCredentialMetadata[],
  ) => void;
}) {
  const [credentials, setCredentials] = useState(initialCredentials);
  const name = "VisuTry Agent";
  const [secret, setSecret] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skill = skills[0];
  const hasActiveKey = credentials.some(
    (credential) => credential.status === "ACTIVE",
  );
  const refreshCredentials = async () => {
    const response = await fetch(
      `/api/merchant/${merchantId}/agent-credentials`,
      { cache: "no-store" },
    );
    if (!response.ok) throw new Error("Unable to load Agent Keys.");
    const body = (await response.json()) as {
      data: { credentials: MerchantAgentCredentialMetadata[] };
    };
    setCredentials(body.data.credentials);
    onCredentialsChanged(body.data.credentials);
    return body.data.credentials;
  };
  const createKey = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/merchant/${merchantId}/agent-credentials`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name }),
        },
      );
      const body = (await response.json()) as {
        data?: { secret: string };
        error?: string;
      };
      if (!response.ok || !body.data?.secret)
        throw new Error(body.error || "Unable to create Agent Key.");
      const setupText = skill
        ? buildAgentSetup(body.data.secret, skill.url, endpoint)
        : body.data.secret;
      setSecret(body.data.secret);
      setSecretCopied(await copyText(setupText));
      await refreshCredentials();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create Agent Key.",
      );
    } finally {
      setBusy(false);
    }
  };
  const rotateKey = async (credentialId: string) => {
    if (
      !window.confirm(
        "The current key will stop working immediately. Rotate this Agent Key?",
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/merchant/${merchantId}/agent-credentials/${credentialId}/rotate`,
        { method: "POST" },
      );
      const body = (await response.json()) as {
        data?: { secret: string };
        error?: string;
      };
      if (!response.ok || !body.data?.secret)
        throw new Error(body.error || "Unable to rotate Agent Key.");
      const setupText = skill
        ? buildAgentSetup(body.data.secret, skill.url, endpoint)
        : body.data.secret;
      setSecret(body.data.secret);
      setSecretCopied(await copyText(setupText));
      await refreshCredentials();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to rotate Agent Key.",
      );
    } finally {
      setBusy(false);
    }
  };
  const revokeKey = async (credentialId: string) => {
    if (!window.confirm("This Agent Key will stop working. Revoke it?")) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/merchant/${merchantId}/agent-credentials/${credentialId}/revoke`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error("Unable to revoke Agent Key.");
      await refreshCredentials();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to revoke Agent Key.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      id="agent-access"
      className="scroll-mt-44 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:scroll-mt-24 sm:p-8"
    >
      <div className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            Agent connection
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Connect your Agent, then grow your workspace
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            VisuTry copies a guided startup prompt with the Skill, endpoint, and
            Agent Key. Paste it as the first message in ChatGPT, Claude, Cursor,
            or your preferred agent, and it will guide the next best action.
          </p>
          <p className="mt-3 max-w-2xl text-xs leading-5 text-slate-500">
            Human approval remains required before publish, archive, revoke, or
            delete actions. Default Agent scopes cover workspace, catalog,
            Store/Campaign, and analytics operations.
          </p>
        </div>
        <ShieldCheck className="h-7 w-7 text-emerald-600" aria-hidden="true" />
      </div>
      <ol className="mt-6 grid gap-4 lg:grid-cols-3">
        <li
          className={`rounded-2xl border p-5 ${hasActiveKey ? "border-emerald-200 bg-emerald-50/50" : "border-blue-200 bg-blue-50/60"}`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${hasActiveKey ? "bg-emerald-600 text-white" : "bg-slate-950 text-white"}`}
            >
              {hasActiveKey ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                "1"
              )}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Create your secure key
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                One key connects your agent to this workspace.
              </p>
              {!hasActiveKey ? (
                <button
                  type="button"
                  disabled={busy}
                  className={`${buttonClass} mt-4 bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-50`}
                  onClick={() => void createKey()}
                >
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  Create key
                </button>
              ) : (
                <p className="mt-3 text-sm font-semibold text-emerald-700">
                  Key ready.
                </p>
              )}
            </div>
          </div>
        </li>
        <li
          className={`rounded-2xl border p-5 ${hasActiveKey ? "border-blue-200 bg-blue-50/60" : "border-slate-200 bg-slate-50/60"}`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${hasActiveKey ? "bg-slate-950 text-white" : "bg-slate-200 text-slate-500"}`}
            >
              {hasActiveKey ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                "2"
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">
                Copy the Agent prompt
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                It includes connection, onboarding, conversation, and safety
                instructions.
              </p>
              {hasActiveKey ? (
                <p className="mt-3 text-sm font-semibold text-emerald-700">
                  Ready in your clipboard after setup.
                </p>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  Create a key first.
                </p>
              )}
            </div>
          </div>
        </li>
        <li
          className={`rounded-2xl border p-5 ${hasActiveKey ? "border-blue-200 bg-blue-50/60" : "border-slate-200 bg-slate-50/60"}`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${hasActiveKey ? "bg-slate-950 text-white" : "bg-slate-200 text-slate-500"}`}
            >
              3
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Talk to your Agent
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Paste the Agent prompt as your first message and let it guide
                the next step.
              </p>
            </div>
          </div>
        </li>
      </ol>
      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <details className="mt-5 rounded-2xl border border-slate-200 px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-700 [&::-webkit-details-marker]:hidden">
          About the VisuTry Merchant Skill{" "}
          <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
        </summary>
        <div className="mt-4 grid gap-2 text-sm leading-6 text-slate-600 sm:grid-cols-3">
          <span>Set up Store</span>
          <span>Create Campaigns</span>
          <span>Read insights</span>
        </div>
        {skill ? (
          <p className="mt-4 break-all text-xs text-slate-500">
            Skill link: {skill.url}
          </p>
        ) : null}
      </details>
      <details className="mt-4 rounded-2xl border border-slate-200 px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-700 [&::-webkit-details-marker]:hidden">
          Advanced connection details{" "}
          <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
        </summary>
        <div className="mt-4 space-y-4 text-sm text-slate-600">
          <p>
            Your agent uses this secure VisuTry endpoint behind the Skill. Most
            users never need to open this.
          </p>
          <code className="block break-all rounded-xl bg-slate-50 px-3.5 py-3 text-xs text-slate-600">
            {endpoint}
          </code>
          <div className="border-t border-slate-100 pt-4">
            <p className="font-semibold text-slate-800">Manage keys</p>
            <div className="mt-3 grid gap-3">
              {credentials.map((credential) => (
                <div
                  key={credential.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {credential.name}
                      </p>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {credential.masked}
                      </p>
                    </div>
                    <StatusPill status={credential.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{credential.scopes.length} scopes</span>
                    <span>
                      Created{" "}
                      {new Date(credential.createdAt).toLocaleDateString()}
                    </span>
                    {credential.lastUsedAt ? (
                      <span>
                        Last used{" "}
                        {new Date(credential.lastUsedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span>Not used yet</span>
                    )}
                  </div>
                  {credential.status === "ACTIVE" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        className={`${buttonClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50`}
                        onClick={() => void rotateKey(credential.id)}
                      >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Rotate
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className={`${buttonClass} border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50`}
                        onClick={() => void revokeKey(credential.id)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Revoke
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>
      {secret ? (
        <SecretModal
          setupText={
            skill ? buildAgentSetup(secret, skill.url, endpoint) : secret
          }
          copied={secretCopied}
          onCopy={() => {
            void copyText(
              skill ? buildAgentSetup(secret, skill.url, endpoint) : secret,
            ).then(setSecretCopied);
          }}
          onClose={() => setSecret(null)}
        />
      ) : null}
    </section>
  );
}

function Experiences({
  experiences,
  catalog,
  onAgentAccess,
}: {
  experiences: MerchantControlExperience[];
  catalog: MerchantControlCenterModel["catalog"];
  onAgentAccess: () => void;
}) {
  return (
    <section
      id="experiences"
      className="scroll-mt-44 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:scroll-mt-24 sm:p-8"
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            Workspace status
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Store and Campaign status
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            See what is live, what is ready, and what your Agent can change next.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right text-xs text-slate-600">
          <span className="font-semibold text-slate-900">Catalog</span>{" "}
          {catalog.total} products · {catalog.active} active · {catalog.valid} valid
          {catalog.sourceCounts.length ? <span className="block text-[11px] text-slate-500">{catalog.sourceCounts.map((source) => `${catalogSourceLabel(source.source)} ${source.count}`).join(" · ")}</span> : null}
        </div>
      </div>
      {experiences.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
          Nothing here yet. Start a conversation with your VisuTry Skill.
        </p>
      ) : (
        <div className="mt-6 grid gap-3">
          {experiences.map((experience) => (
            <article
              key={experience.id}
              className="rounded-2xl border border-slate-200 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {experience.type === "STORE" ? "Store" : "Campaign"}
                    </span>
                    <StatusPill status={experience.status} />
                    {experience.referenceData ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Reference data
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 truncate text-lg font-semibold text-slate-950">
                    {experience.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {experience.selectedFrames.length} selected product
                    {experience.selectedFrames.length === 1 ? "" : "s"} · Updated{" "}
                    {new Date(experience.updatedAt).toLocaleDateString()}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full px-2 py-1 font-semibold ${experience.readiness.status === "VALID" ? "bg-emerald-50 text-emerald-700" : experience.readiness.status === "NEEDS_ATTENTION" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                      {readinessLabel(experience.readiness.status)}
                    </span>
                    {experience.readiness.invalidCount > 0 ? <span className="text-amber-800">{experience.readiness.invalidCount} selected item{experience.readiness.invalidCount === 1 ? "" : "s"} need catalog fixes</span> : null}
                    {experience.status === "ACTIVE" ? <span className="font-semibold text-emerald-700">Live</span> : experience.status === "DRAFT" ? <span className="text-slate-500">Private draft</span> : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={
                      experience.status === "DRAFT"
                        ? undefined
                        : experience.publicPath
                    }
                    target={
                      experience.status === "DRAFT" ? undefined : "_blank"
                    }
                    rel="noreferrer"
                    aria-disabled={experience.status === "DRAFT"}
                    className={`${buttonClass} ${experience.status === "DRAFT" ? "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    {experience.status === "DRAFT"
                      ? "Private draft"
                      : "Open public page"}
                  </a>
                  <CopyButton value={experience.publicPath} label="Copy URL" />
                  <button type="button" className={`${buttonClass} border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100`} onClick={onAgentAccess}>
                    Ask Agent to update
                  </button>
                </div>
              </div>
              {experience.selectedFrames.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-xs">
                  <span className="font-semibold text-slate-600">Selected catalog</span>
                  {experience.selectedFrames.slice(0, 3).map((frame) => <span key={frame.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{frame.name}</span>)}
                  {experience.selectedFrames.length > 3 ? <span className="text-slate-500">+{experience.selectedFrames.length - 3} more</span> : null}
                </div>
              ) : null}
              {experience.type === "CAMPAIGN" ? (
                <div className="mt-4 rounded-xl bg-violet-50/60 px-4 py-3 text-sm text-slate-700">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {experience.headline ? <span className="font-semibold text-slate-950">{experience.headline}</span> : null}
                    {experience.primaryCtaLabel ? <span className="text-xs font-semibold text-violet-800">CTA: {experience.primaryCtaLabel}</span> : null}
                    {experience.startAt || experience.endAt ? <span className="text-xs text-slate-500">{experience.startAt ? new Date(experience.startAt).toLocaleDateString() : "Now"} → {experience.endAt ? new Date(experience.endAt).toLocaleDateString() : "Open"}</span> : null}
                  </div>
                  {experience.description ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{experience.description}</p> : null}
                </div>
              ) : null}
              <dl className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-slate-500">Objective</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {experience.policy.objective ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Gate</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {experience.policy.gate ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Presentation</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {experience.policy.presentation}
                  </dd>
                </div>
              </dl>
              {experience.lastOperation ? <p className="mt-3 text-xs text-slate-500">Last recorded action: <span className="font-semibold text-slate-700">{experience.lastOperation.label} by {experience.lastOperation.actor}</span> · {formatInsightDate(experience.lastOperation.at)}</p> : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function MerchantControlCenter({
  locale,
  merchants,
  selectedMerchantId,
  control,
  credentials,
  endpoint,
  skills,
  onboardingState,
}: Props) {
  const router = useRouter();
  const selectedMerchant = useMemo(
    () => merchants.find((merchant) => merchant.id === selectedMerchantId),
    [merchants, selectedMerchantId],
  );
  const [agentReady, setAgentReady] = useState(
    control.credentialUsage.active > 0 ||
      credentials.some((credential) => credential.status === "ACTIVE"),
  );
  const [catalogAvailable, setCatalogAvailable] = useState(control.catalog.total > 0);
  useEffect(() => {
    analytics.trackCustomEvent(AnalyticsEvent.MerchantWorkspaceEntered, {
      merchant_id: selectedMerchantId,
      entry_point: "b2b",
      actor_type: "merchant_prospect",
      journey_type: "visutry_b2b_acquisition",
      source_journey: "business_merchant_entry",
      landing_surface: "merchant_workspace",
    });
  }, [selectedMerchantId]);
  const switchMerchant = (merchantId: string) =>
    router.push(
      `/${locale}/merchant?merchantId=${encodeURIComponent(merchantId)}`,
    );
  const handleCredentialsChanged = (
    nextCredentials: MerchantAgentCredentialMetadata[],
  ) =>
    setAgentReady(
      nextCredentials.some((credential) => credential.status === "ACTIVE"),
    );
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <a href="#overview" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight">
                VisuTry Merchant
              </span>
              <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                Your AI workspace
              </span>
            </span>
          </a>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="merchant-switcher">
              Active merchant
            </label>
            <div className="relative">
              <select
                id="merchant-switcher"
                value={selectedMerchantId}
                onChange={(event) => switchMerchant(event.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-9 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:w-56"
              >
                <option value={selectedMerchantId}>
                  {selectedMerchant?.name ?? control.merchant.name}
                </option>
                {merchants
                  .filter((merchant) => merchant.id !== selectedMerchantId)
                  .map((merchant) => (
                    <option key={merchant.id} value={merchant.id}>
                      {merchant.name}
                    </option>
                  ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
            </div>
            <nav
              className="flex flex-wrap gap-1 text-sm font-semibold text-slate-600"
              aria-label="Merchant workspace"
            >
              <a
                className="rounded-lg px-2.5 py-2 hover:bg-slate-100"
                href="#overview"
              >
                Overview
              </a>
              <a
                className="rounded-lg px-2.5 py-2 hover:bg-slate-100"
                href="#insights"
              >
                Insights
              </a>
              <a
                className="rounded-lg px-2.5 py-2 hover:bg-slate-100"
                href="#agent-access"
              >
                Setup
              </a>
              <a
                className="rounded-lg px-2.5 py-2 hover:bg-slate-100"
                href="#experiences"
              >
                Status
              </a>
              <a
                className="rounded-lg px-2.5 py-2 hover:bg-slate-100"
                href="#catalog"
              >
                Catalog
              </a>
            </nav>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        {onboardingState ? (
          <section
            data-onboarding-state={onboardingState}
            role="status"
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5 text-emerald-950 sm:px-6"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              {onboardingState === "created" ? "Merchant workspace created successfully" : "Merchant workspace ready"}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              Your workspace is ready.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-900/80">
              {onboardingState === "created"
                ? "You are the owner of this workspace. Your next step is to add your eyewear catalog."
                : "You are back in your existing workspace. Your next step is to add your eyewear catalog."}
            </p>
            <a
              href="#catalog"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-950"
            >
              Next: add your eyewear catalog <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </section>
        ) : null}
        <Overview
          control={control}
          agentReady={agentReady}
          onAgentAccess={() =>
            document
              .getElementById("agent-access")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          onCatalog={() =>
            document
              .getElementById("catalog")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          onStore={() =>
            document
              .getElementById("store")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        />
        <WorkspaceDetails
          merchantId={control.merchant.id}
          initialName={control.merchant.name}
          initialWebsiteUrl={control.merchant.websiteUrl}
        />
        <CommerceIntelligence insights={control.commerceIntelligence} />
        <AgentAccess
          merchantId={control.merchant.id}
          endpoint={endpoint}
          skills={skills}
          initialCredentials={credentials}
          onCredentialsChanged={handleCredentialsChanged}
        />
        <MerchantCatalogSelfService
          merchantId={control.merchant.id}
          initialTotal={control.catalog.total}
          onCatalogChanged={() => setCatalogAvailable(true)}
        />
        <MerchantStoreSelfService
          merchantId={control.merchant.id}
          initialCatalogCount={control.catalog.total}
          catalogAvailable={catalogAvailable}
        />
        <Experiences
          experiences={control.experiences}
          catalog={control.catalog}
          onAgentAccess={() =>
            document
              .getElementById("agent-access")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        />
      </div>
    </main>
  );
}
