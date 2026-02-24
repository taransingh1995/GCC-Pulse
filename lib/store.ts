import { BriefItem, DealItem, PublicSource, RatingItem, Store } from "./types";
export type { Store } from "./types";
import { nowIso } from "./time";
import { parseBriefFromPaste, parseDealFromPaste, parseRatingFromPaste } from "./parse";

const LS_KEY = "gcc_pulse_store_v1";

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function defaultStore(): Store {
  const sources: PublicSource[] = [
    { id: uid("src"), label: "S&P Ratings Actions (regulatory table)", url: "https://www.spglobal.com/ratings/en/regulatory/ratings-actions", kind: "rating-actions" },
    { id: uid("src"), label: "Moody's Ratings News (headlines)", url: "https://ratings.moodys.com/ratings-news", kind: "rating-actions" },
    { id: uid("src"), label: "Fitch Latest Rating Actions", url: "https://www.fitchratings.com/latest-rating-actions", kind: "rating-actions" },
    { id: uid("src"), label: "UAE MoF Issuance Programme (AED T-Bonds/T-Sukuk calendar)", url: "https://mof.gov.ae/en/public-finance/public-debt/issuance-programme/", kind: "calendar" },
    { id: uid("src"), label: "KSA NDMC Local Sukuk Calendar", url: "https://www.ndmc.gov.sa/en/IssuancePrograms/Pages/Issuance_Calendar.aspx", kind: "calendar" },
    { id: uid("src"), label: "IILM Indicative Sukuk Calendar", url: "https://iilm.com/v2/en/indicative-issuance-calendar/", kind: "calendar" },
  ];

  return {
    meta: { version: 1, lastSeenIso: nowIso() },
    settings: { refreshMinutes: 10, maxDaysToKeep: 30 },
    watchlist: {
      countries: ["UAE","Saudi Arabia","Qatar","Kuwait","Bahrain","Oman"],
      issuers: [
        // MVP seed list – you can edit freely in Settings
        "Saudi Aramco","PIF","SABIC","Ma'aden","STC",
        "ADNOC","Emirates NBD","First Abu Dhabi Bank","DP World","e& (Etisalat)",
        "QatarEnergy","QNB","Ooredoo","Industries Qatar","Qatar Airways",
        "Kuwait Petroleum Corporation (KPC)","Kuwait Finance House","National Bank of Kuwait","Zain","Boubyan Bank",
        "BAPCO","ALBA","Bahrain National Bank","Gulf Air","Bahrain Mumtalakat",
        "OQ","Bank Muscat","Omantel","Oman LNG","Nama Group"
      ],
      banks: [
        "First Abu Dhabi Bank","Emirates NBD","ADCB",
        "Saudi National Bank","Al Rajhi","Riyad Bank",
        "QNB","Qatar Islamic Bank",
        "National Bank of Kuwait","Kuwait Finance House",
        "National Bank of Bahrain","BBK",
        "Bank Muscat","Bank Dhofar"
      ],
    },
    sources,
    ratings: [],
    deals: [],
    brief: [],
  };
}

export function upsertStore(input?: Store, opts?: { load?: boolean; save?: boolean }): Store {
  let s = input ?? defaultStore();
  if (opts?.load && typeof window !== "undefined") {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) {
      try { s = JSON.parse(raw) as Store; } catch { /* ignore */ }
    }
  }
  if (opts?.save && typeof window !== "undefined") {
    window.localStorage.setItem(LS_KEY, JSON.stringify(s));
  }
  return s;
}

export function exportStore(store: Store): Blob {
  return new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
}

export function importStore(current: Store, jsonText: string): Store {
  const parsed = JSON.parse(jsonText) as Store;
  // minimal merge to keep latest settings if missing
  return {
    ...current,
    ...parsed,
    meta: { ...current.meta, ...parsed.meta },
    settings: { ...current.settings, ...parsed.settings },
    watchlist: { ...current.watchlist, ...parsed.watchlist },
    sources: parsed.sources?.length ? parsed.sources : current.sources,
    ratings: parsed.ratings ?? current.ratings,
    deals: parsed.deals ?? current.deals,
    brief: parsed.brief ?? current.brief,
  };
}

export function pruneOld(store: Store): Store {
  const keepMs = store.settings.maxDaysToKeep * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - keepMs;
  const keep = (iso: string) => {
    const t = Date.parse(iso);
    return Number.isFinite(t) ? t >= cutoff : true;
  };
  return {
    ...store,
    ratings: store.ratings.filter(r => keep(r.createdAtIso)),
    deals: store.deals.filter(d => keep(d.createdAtIso)),
    brief: store.brief.filter(b => keep(b.createdAtIso)),
  };
}

export function addItemsFromPaste(store: Store, kind: "rating"|"deal"|"brief", text: string): { next: Store; added: number } {
  const chunks = text
    .split(/\n\s*\n+/) // blank-line separated
    .map(c => c.trim())
    .filter(c => c.length > 10)
    .slice(0, 20);

  let added = 0;
  let next = { ...store };

  for (const c of chunks) {
    if (kind === "rating") {
      const item = parseRatingFromPaste(c);
      next = { ...next, ratings: [item, ...next.ratings] };
      added++;
    } else if (kind === "deal") {
      const item = parseDealFromPaste(c);
      next = { ...next, deals: [item, ...next.deals] };
      added++;
    } else {
      const item = parseBriefFromPaste(c);
      next = { ...next, brief: [item, ...next.brief] };
      added++;
    }
  }
  return { next, added };
}

// Conservative public-source refresh: fetch titles + last-modified and create brief items.
// This avoids brittle scraping and keeps you compliant with paywalls.
export async function refreshPublicSources(store: Store): Promise<Store> {
  const sources = store.sources;
  const results: Array<{ sourceId: string; title: string; url: string }> = [];

  for (const src of sources) {
    try{
      const res = await fetch(`/api/fetch?u=${encodeURIComponent(src.url)}`);
      if (!res.ok) continue;
      const data = (await res.json()) as { title?: string; canonicalUrl?: string; };
      if (data.title) {
        results.push({ sourceId: src.id, title: data.title, url: data.canonicalUrl ?? src.url });
      }
    } catch {
      // ignore
    }
  }

  // Deduplicate by title
  const existingTitles = new Set(store.brief.map(b => b.headline));
  const newBrief: BriefItem[] = [];
  for (const r of results) {
    if (existingTitles.has(r.title)) continue;
    newBrief.push({
      id: uid("brf"),
      bucket: "Other",
      headline: r.title,
      summary: "Public source updated. Open the link and paste key paragraphs into Paste-to-Parse for structured extraction.",
      syndicationAngle: "If this affects GCC supply or risk appetite, consider timing and investor messaging.",
      source: "Public source",
      sourceUrl: r.url,
      createdAtIso: nowIso(),
    });
  }

  if (!newBrief.length) return store;
  return { ...store, brief: [...newBrief, ...store.brief] };
}
