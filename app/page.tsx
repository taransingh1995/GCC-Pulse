"use client";

import { useEffect, useMemo, useState } from "react";
import { addItemsFromPaste, defaultStore, exportStore, importStore, pruneOld, refreshPublicSources, Store, upsertStore } from "@/lib/store";
import { formatLocalTime, nowIso, shortDate } from "@/lib/time";
import { RatingsPanel } from "@/components/RatingsPanel";
import { DealsPanel } from "@/components/DealsPanel";
import { BriefPanel } from "@/components/BriefPanel";
import { PastePanel } from "@/components/PastePanel";
import { SettingsPanel } from "@/components/SettingsPanel";

type Tab = "pulse" | "paste" | "settings";

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("pulse");
  const [store, setStore] = useState<Store>(() => defaultStore());
  const [status, setStatus] = useState<string>("Ready");
  const [tick, setTick] = useState(0);

  // load from localStorage
  useEffect(() => {
    const loaded = upsertStore(undefined, { load: true });
    setStore(loaded);
  }, []);

  // periodic refresh while open (intraday)
  useEffect(() => {
    const minutes = store.settings.refreshMinutes;
    const ms = Math.max(1, minutes) * 60_000;
    const id = setInterval(() => setTick((x) => x + 1), ms);
    return () => clearInterval(id);
  }, [store.settings.refreshMinutes]);

  useEffect(() => {
    // refresh public sources on tick
    (async () => {
      try {
        setStatus(`Refreshing (${formatLocalTime(new Date())})…`);
        const updated = await refreshPublicSources(store);
        const pruned = pruneOld(updated);
        setStore(upsertStore(pruned, { save: true }));
        setStatus(`Updated ${shortDate(new Date())}`);
      } catch (e: any) {
        setStatus(`Refresh failed: ${String(e?.message || e)}`);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const kpis = useMemo(() => {
    const since = store.meta.lastSeenIso || nowIso();
    const newRatings = store.ratings.filter(r => r.createdAtIso > since).length;
    const newDeals = store.deals.filter(d => d.createdAtIso > since).length;
    const newBrief = store.brief.filter(b => b.createdAtIso > since).length;
    return { newRatings, newDeals, newBrief };
  }, [store]);

  function markSeen() {
    const next = { ...store, meta: { ...store.meta, lastSeenIso: nowIso() } };
    setStore(upsertStore(next, { save: true }));
  }

  async function onPaste(kind: "rating" | "deal" | "brief", text: string) {
    const { next, added } = addItemsFromPaste(store, kind, text);
    setStore(upsertStore(next, { save: true }));
    setStatus(`Added ${added} item(s) from paste`);
    setTab("pulse");
  }

  function onExport() {
    const blob = exportStore(store);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gcc-pulse-export-${shortDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImport(file: File) {
    const text = await file.text();
    const next = importStore(store, text);
    setStore(upsertStore(next, { save: true }));
    setStatus("Imported successfully");
  }

  async function onManualRefresh() {
    try{
      setStatus("Refreshing…");
      const updated = await refreshPublicSources(store);
      const pruned = pruneOld(updated);
      setStore(upsertStore(pruned, { save: true }));
      setStatus(`Updated ${shortDate(new Date())}`);
    } catch(e:any){
      setStatus(`Refresh failed: ${String(e?.message || e)}`);
    }
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="logo" />
          <div>
            <div className="h1">GCC Pulse</div>
            <div className="sub">Ratings actions • Deals radar • Geo/markets brief (MVP)</div>
          </div>
        </div>
        <div className="row">
          <span className="badge">Auto-refresh: {store.settings.refreshMinutes}m</span>
          <button className="btn" onClick={markSeen}>Mark seen</button>
          <button className="btn primary" onClick={onManualRefresh}>Refresh now</button>
          <button className="btn" onClick={onExport}>Export</button>
          <label className="btn">
            Import
            <input
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImport(f);
              }}
            />
          </label>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 12 }}>
        <button className={`tab ${tab === "pulse" ? "active" : ""}`} onClick={() => setTab("pulse")}>Pulse</button>
        <button className={`tab ${tab === "paste" ? "active" : ""}`} onClick={() => setTab("paste")}>Paste to parse</button>
        <button className={`tab ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}>Settings</button>
        <span className="pill" title="New since last mark">
          <span className="dot new" />
          New: {kpis.newRatings + kpis.newDeals + kpis.newBrief} (R {kpis.newRatings} • D {kpis.newDeals} • B {kpis.newBrief})
        </span>
        <span className="pill"><span className="dot" /> {status}</span>
      </div>

      {tab === "pulse" && (
        <div className="grid">
          <div className="panel">
            <h2>Ratings Watch</h2>
            <div className="body">
              <RatingsPanel store={store} onUpdate={(s) => setStore(upsertStore(s, { save: true }))} />
            </div>
          </div>
          <div className="panel">
            <h2>Deals Radar</h2>
            <div className="body">
              <DealsPanel store={store} onUpdate={(s) => setStore(upsertStore(s, { save: true }))} />
            </div>
          </div>

          <div className="panel" style={{ gridColumn: "1 / -1" }}>
            <h2>Geo & Markets Brief</h2>
            <div className="body">
              <BriefPanel store={store} onUpdate={(s) => setStore(upsertStore(s, { save: true }))} />
            </div>
          </div>
        </div>
      )}

      {tab === "paste" && (
        <div className="panel">
          <h2>Paste from Bloomberg / Reuters / Debtwire / LoanConnector / FT</h2>
          <div className="body">
            <PastePanel onPaste={onPaste} />
            <div className="hr" />
            <div className="small">
              Tip: paste a headline + the key paragraph(s). The parser will try to extract issuer, size, currency, tenor, agencies, rating/outlook,
              lead banks, and a short “syndication angle”.
            </div>
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="panel">
          <h2>Settings & Watchlist</h2>
          <div className="body">
            <SettingsPanel store={store} onUpdate={(s) => setStore(upsertStore(s, { save: true }))} />
          </div>
        </div>
      )}
    </div>
  );
}
