"use client";
import { useMemo, useState } from "react";
import { RatingItem, Store } from "@/lib/types";

export function RatingsPanel({ store, onUpdate }: { store: Store; onUpdate: (s: Store) => void }) {
  const [q, setQ] = useState("");
  const [onlyNew, setOnlyNew] = useState(false);

  const rows = useMemo(() => {
    const since = store.meta.lastSeenIso || "";
    return store.ratings
      .filter(r => !q || (r.entity + " " + (r.country ?? "") + " " + r.agency).toLowerCase().includes(q.toLowerCase()))
      .filter(r => !onlyNew || r.createdAtIso > since)
      .slice(0, 200);
  }, [store.ratings, q, onlyNew, store.meta.lastSeenIso]);

  function remove(id: string) {
    onUpdate({ ...store, ratings: store.ratings.filter(r => r.id !== id) });
  }

  return (
    <div>
      <div className="split">
        <input className="input" placeholder="Filter (entity/country/agency)…" value={q} onChange={e=>setQ(e.target.value)} />
        <label className="pill" style={{ justifyContent:"space-between" }}>
          <span style={{display:"inline-flex", alignItems:"center", gap:8}}>
            <span className={"dot " + (onlyNew ? "new" : "")} />
            New since last mark
          </span>
          <input type="checkbox" checked={onlyNew} onChange={e=>setOnlyNew(e.target.checked)} />
        </label>
      </div>

      <div className="hr" />

      {rows.length === 0 ? (
        <div className="small">No ratings items yet. Use “Paste to parse” for rating actions, or keep public sources enabled in Settings.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Entity</th>
              <th>Agency</th>
              <th>Rating / Outlook</th>
              <th>Action</th>
              <th>Rationale</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: RatingItem) => (
              <tr key={r.id}>
                <td>
                  <div style={{fontWeight:700}}>{r.entity}</div>
                  <div className="small">{r.country ?? "—"} • {new Date(r.createdAtIso).toLocaleString()}</div>
                  {r.sourceUrl && <div className="small"><a href={r.sourceUrl} target="_blank" rel="noreferrer">Open source</a></div>}
                </td>
                <td>{r.agency}</td>
                <td>
                  <span className="pill"><span className="dot good" /> {r.rating ?? "—"}</span>{" "}
                  <span className="pill"><span className="dot warn" /> {r.outlook ?? "—"}</span>
                </td>
                <td>{r.action ?? "—"}</td>
                <td>
                  <ul style={{margin:0, paddingLeft:16}}>
                    {r.rationaleBullets.slice(0,4).map((b, i) => <li key={i} className="small">{b}</li>)}
                  </ul>
                </td>
                <td>
                  <button className="btn danger" onClick={()=>remove(r.id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
