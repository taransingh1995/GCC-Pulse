"use client";
import { useState } from "react";
import { PublicSource, Store } from "@/lib/types";

export function SettingsPanel({ store, onUpdate }: { store: Store; onUpdate: (s: Store) => void }) {
  const [refresh, setRefresh] = useState(store.settings.refreshMinutes);
  const [keep, setKeep] = useState(store.settings.maxDaysToKeep);

  function saveSettings() {
    onUpdate({ ...store, settings: { ...store.settings, refreshMinutes: Math.max(1, refresh), maxDaysToKeep: Math.max(1, keep) } });
  }

  function addSource() {
    const s: PublicSource = {
      id: `src_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`,
      label: "New source",
      url: "https://example.com",
      kind: "news",
    };
    onUpdate({ ...store, sources: [s, ...store.sources] });
  }

  function updateSource(id: string, patch: Partial<PublicSource>) {
    onUpdate({ ...store, sources: store.sources.map(s => s.id === id ? { ...s, ...patch } : s) });
  }

  function removeSource(id: string) {
    onUpdate({ ...store, sources: store.sources.filter(s => s.id !== id) });
  }

  function updateList(key: "countries"|"issuers"|"banks", value: string) {
    const arr = value.split("\n").map(x => x.trim()).filter(Boolean);
    onUpdate({ ...store, watchlist: { ...store.watchlist, [key]: arr } });
  }

  return (
    <div>
      <div className="split">
        <div className="panel" style={{borderRadius:12}}>
          <h2 style={{borderBottom:"1px solid var(--border)"}}>App settings</h2>
          <div className="body">
            <div className="small">Auto-refresh interval (minutes)</div>
            <input className="input" type="number" value={refresh} onChange={e=>setRefresh(Number(e.target.value))} />
            <div className="hr" />
            <div className="small">Keep items for (days)</div>
            <input className="input" type="number" value={keep} onChange={e=>setKeep(Number(e.target.value))} />
            <div style={{marginTop:10}}>
              <button className="btn primary" onClick={saveSettings}>Save settings</button>
            </div>
          </div>
        </div>

        <div className="panel" style={{borderRadius:12}}>
          <h2 style={{borderBottom:"1px solid var(--border)"}}>Watchlist</h2>
          <div className="body">
            <div className="small">Countries (one per line)</div>
            <textarea className="input" defaultValue={store.watchlist.countries.join("\n")} onBlur={e=>updateList("countries", e.target.value)} />
            <div className="hr" />
            <div className="small">Issuers (one per line)</div>
            <textarea className="input" defaultValue={store.watchlist.issuers.join("\n")} onBlur={e=>updateList("issuers", e.target.value)} />
            <div className="hr" />
            <div className="small">Banks (one per line)</div>
            <textarea className="input" defaultValue={store.watchlist.banks.join("\n")} onBlur={e=>updateList("banks", e.target.value)} />
            <div className="small" style={{marginTop:8}}>Edits save when you click out of the box.</div>
          </div>
        </div>
      </div>

      <div className="hr" />

      <div className="panel" style={{borderRadius:12}}>
        <h2 style={{borderBottom:"1px solid var(--border)"}}>Public sources (lightweight)</h2>
        <div className="body">
          <div className="small">
            These are used only for “page updated” signals and links. For richer extraction, open the source and paste key paragraphs into Paste-to-Parse.
          </div>
          <div style={{marginTop:10}}>
            <button className="btn primary" onClick={addSource}>Add source</button>
          </div>

          <div className="hr" />

          <table className="table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Kind</th>
                <th>URL</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {store.sources.map(s => (
                <tr key={s.id}>
                  <td style={{minWidth:180}}>
                    <input className="input" value={s.label} onChange={e=>updateSource(s.id, { label: e.target.value })} />
                  </td>
                  <td style={{width:160}}>
                    <select className="input" value={s.kind} onChange={e=>updateSource(s.id, { kind: e.target.value as any })}>
                      <option value="rating-actions">rating-actions</option>
                      <option value="calendar">calendar</option>
                      <option value="news">news</option>
                    </select>
                  </td>
                  <td>
                    <input className="input" value={s.url} onChange={e=>updateSource(s.id, { url: e.target.value })} />
                    <div className="small"><a href={s.url} target="_blank" rel="noreferrer">Open</a></div>
                  </td>
                  <td style={{width:120}}>
                    <button className="btn danger" onClick={()=>removeSource(s.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}
