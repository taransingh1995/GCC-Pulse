import { Agency, BriefItem, DealItem, DealType, RatingItem, Sector } from "./types";
import { nowIso } from "./time";

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

const CURRENCY_RE = /\b(USD|US\$|AED|SAR|QAR|KWD|BHD|OMR|EUR|GBP)\b/gi;
const SIZE_RE = /\b(\d+(?:\.\d+)?)\s?(bn|billion|mn|million)\b/gi;
const TENOR_RE = /\b(\d{1,2})\s?(year|yr|years|month|months|m)\b/gi;

const AGENCY_HINTS: Array<[Agency, RegExp]> = [
  ["S&P", /\bS&P\b|\bStandard\s*&\s*Poor'?s\b/i],
  ["Moody's", /\bMoody'?s\b/i],
  ["Fitch", /\bFitch\b/i],
];

const RATING_RE = /\b(AAA|AA\+|AA|AA-|A\+|A|A-|BBB\+|BBB|BBB-|BB\+|BB|BB-|B\+|B|B-|CCC\+|CCC|CCC-|CC|C|D)\b/i;
const OUTLOOK_RE = /\b(Stable|Positive|Negative|Developing)\b/i;

function pickAgency(text: string): Agency {
  for (const [a, re] of AGENCY_HINTS) {
    if (re.test(text)) return a;
  }
  return "Other";
}

function firstMatch(re: RegExp, text: string): string | undefined {
  const m = re.exec(text);
  if (!m) return undefined;
  return m[0];
}

function collectMatches(re: RegExp, text: string): string[] {
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  const rr = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  while ((m = rr.exec(text)) !== null) {
    out.add(m[0].replace(/\s+/g, " ").trim());
  }
  return Array.from(out);
}

function guessCountry(text: string): string | undefined {
  const countries = ["UAE","United Arab Emirates","Saudi","Saudi Arabia","KSA","Qatar","Kuwait","Bahrain","Oman"];
  const found = countries.find(c => new RegExp(`\\b${c.replace(/\s+/g,"\\s+")}\\b`, "i").test(text));
  if (!found) return undefined;
  if (found === "KSA") return "Saudi Arabia";
  if (found === "Saudi") return "Saudi Arabia";
  if (found === "United Arab Emirates") return "UAE";
  return found;
}

function extractRationaleBullets(text: string): string[] {
  // Take up to 4 “reason” sentences containing key words
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  const keys = /(due to|driven by|reflects|because|we expect|outlook|liquidity|leverage|cash flow|debt|fiscal|oil|growth|geopolit|sanction|risk)/i;
  const picked = sentences.filter(s => keys.test(s)).slice(0, 4);

  if (picked.length) return picked.map(s => s.length > 160 ? s.slice(0, 157) + "…" : s);
  // fallback: first 2 sentences
  return sentences.slice(0, 2).map(s => s.length > 160 ? s.slice(0, 157) + "…" : s);
}

export function parseRatingFromPaste(text: string): RatingItem {
  const agency = pickAgency(text);
  const rating = firstMatch(RATING_RE, text);
  const outlook = firstMatch(OUTLOOK_RE, text);
  const country = guessCountry(text);

  // entity heuristic: first line without agency words
  const firstLine = (text.split("\n").map(l=>l.trim()).filter(Boolean)[0] ?? "Unknown entity");
  const entity = firstLine.replace(/\b(S&P|Moody'?s|Fitch)\b/ig, "").trim();

  // action heuristic
  const action =
    /\bdowngrad/i.test(text) ? "Downgrade" :
    /\bupgrad/i.test(text) ? "Upgrade" :
    /\baffirm/i.test(text) ? "Affirmed" :
    /\bassign/i.test(text) ? "New rating" :
    /\bwatch|creditwatch/i.test(text) ? "Watch/Review" :
    "Action";

  const actionDate = undefined;

  return {
    id: uid("rat"),
    entity: entity || "Unknown entity",
    country,
    agency,
    rating,
    outlook,
    action,
    actionDate,
    rationaleBullets: extractRationaleBullets(text),
    source: "Paste",
    createdAtIso: nowIso(),
  };
}

export function parseDealFromPaste(text: string): DealItem {
  const country = guessCountry(text);
  const currencies = collectMatches(CURRENCY_RE, text).map(x => x.toUpperCase().replace("US$","USD"));
  const sizes = collectMatches(SIZE_RE, text);
  const tenors = collectMatches(TENOR_RE, text);

  const type: DealType =
    /\bsukuk\b/i.test(text) ? "Sukuk" :
    /\bbond|note|gmt[nn]\b/i.test(text) ? "Bond" :
    "Loan";

  const status =
    /\bpriced\b/i.test(text) ? "Priced" :
    /\bsigned\b/i.test(text) ? "Signed" :
    /\blaunched\b/i.test(text) ? "Launched" :
    /\bmandat/i.test(text) ? "Mandated" :
    /\brumou?r\b/i.test(text) ? "Rumor" :
    "Other";

  const sector: Sector =
    /\bsovereign|treasury|ministry of finance|ndmc\b/i.test(text) ? "Sovereign" :
    /\bbank|islamic bank|commercial bank\b/i.test(text) ? "FI" :
    /\bholding|group|company|llc|pjsc\b/i.test(text) ? "Corp" :
    /\bgov(?:ernment)?-related|gre\b/i.test(text) ? "GRE" :
    "Other";

  const firstLine = (text.split("\n").map(l=>l.trim()).filter(Boolean)[0] ?? "Unknown issuer");
  const issuer = firstLine.replace(/\b(loan|bond|sukuk|issue|issuance)\b/ig,"").trim() || "Unknown issuer";

  // naive bank extraction: look for "led by" / "bookrunner" / "MLA"
  const bankLine = text.match(/(led by|bookrunner|bookrunners|mla|arranger|coordinator)[:\s].{0,160}/i)?.[0];

  return {
    id: uid("deal"),
    issuer,
    country,
    sector,
    type,
    status,
    size: sizes[0],
    currency: currencies[0],
    tenor: tenors[0],
    banks: bankLine ? bankLine.replace(/\s+/g," ").trim() : undefined,
    notes: undefined,
    source: "Paste",
    createdAtIso: nowIso(),
  };
}

export function parseBriefFromPaste(text: string): BriefItem {
  const firstLine = (text.split("\n").map(l=>l.trim()).filter(Boolean)[0] ?? "Brief item");
  const headline = firstLine.length > 120 ? firstLine.slice(0, 117) + "…" : firstLine;

  const bucket =
    /israel|iran|yemen|houthi|gaza|sanction|conflict|war|shipping|red sea|strait|hormuz/i.test(text) ? "Geopolitics" :
    /opec|oil|brent|wti|lng|gas|energy/i.test(text) ? "Oil & Energy" :
    /fed|rates|treasur|ust|inflation|fx|dollar|peg|swap/i.test(text) ? "Rates & FX" :
    /liquidity|deposit|credit growth|npl|capital adequacy|basel|bank/i.test(text) ? "Banking & Liquidity" :
    /policy|regulat|tax|budget|fiscal|debt management/i.test(text) ? "Policy/Regulation" :
    "Other";

  const bullets = extractRationaleBullets(text);
  const summary = bullets[0] ?? "Summary unavailable.";
  const syndicationAngle =
    bucket === "Rates & FX" ? "Watch funding windows and investor risk appetite; rate volatility can widen spreads and shorten tenors." :
    bucket === "Oil & Energy" ? "Energy price moves affect GCC fiscal buffers and sovereign/GRE curves; expect knock-on effects in new issue pricing." :
    bucket === "Geopolitics" ? "Risk-off periods can shut primary markets; consider timing, currency, and investor base diversification." :
    bucket === "Banking & Liquidity" ? "Liquidity signals can impact FI issuance and loan pricing; monitor deposit trends and funding costs." :
    "Assess market tone and timing; consider covenant/headroom and investor messaging.";

  return {
    id: uid("brf"),
    bucket,
    headline,
    summary: summary.length > 200 ? summary.slice(0, 197) + "…" : summary,
    syndicationAngle,
    source: "Paste",
    createdAtIso: nowIso(),
  };
}
