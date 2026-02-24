export type Agency = "S&P" | "Moody's" | "Fitch" | "Other";
export type Sector = "Sovereign" | "FI" | "Corp" | "GRE" | "Other";
export type DealType = "Loan" | "Bond" | "Sukuk";

export type RatingItem = {
  id: string;
  entity: string;
  country?: string;
  agency: Agency;
  rating?: string;
  outlook?: string;
  action?: string; // upgrade/downgrade/affirm/new/watch
  actionDate?: string; // ISO or free text
  rationaleBullets: string[];
  source?: string;
  sourceUrl?: string;
  createdAtIso: string;
};

export type DealItem = {
  id: string;
  issuer: string;
  country?: string;
  sector: Sector;
  type: DealType;
  status: "Rumor" | "Mandated" | "Launched" | "Priced" | "Signed" | "Other";
  size?: string;
  currency?: string;
  tenor?: string;
  banks?: string;
  notes?: string;
  source?: string;
  sourceUrl?: string;
  createdAtIso: string;
};

export type BriefItem = {
  id: string;
  bucket: "Geopolitics" | "Oil & Energy" | "Rates & FX" | "Banking & Liquidity" | "Policy/Regulation" | "Other";
  headline: string;
  summary: string;
  syndicationAngle: string;
  source?: string;
  sourceUrl?: string;
  createdAtIso: string;
};

export type PublicSource = {
  id: string;
  label: string;
  url: string;
  kind: "calendar" | "rating-actions" | "news";
};

export type Store = {
  meta: { version: number; lastSeenIso?: string };
  settings: {
    refreshMinutes: number;
    maxDaysToKeep: number;
  };
  watchlist: {
    countries: string[];
    issuers: string[];
    banks: string[];
  };
  sources: PublicSource[];
  ratings: RatingItem[];
  deals: DealItem[];
  brief: BriefItem[];
};
