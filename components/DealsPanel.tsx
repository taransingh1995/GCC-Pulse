"use client";
import { useMemo, useState } from "react";
import { DealItem, Store } from "@/lib/types";

export function DealsPanel({ store, onUpdate }: { store: Store; onUpdate: (s: Store) => void }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"All"|"Loan"|"Bond"|"Sukuk">("All");
  const [onlyNew, setOnlyNew] = useState(false);

  const rows = useMemo(() => {
    const since = store.meta.lastSeenIso || "";
    return store.deals
      .filter(d => type==="All" ? true : d.type === type)
      .filter(d => !q || (d.issuer + " " + (d.country ?? "") + " " + d.sector).toLowerCase().includes(q.toLowerCase()))
      .filter(d => !onlyNew || d.createdAtIso > since)
      .slice(0, 250);
  }, [store.deals, q, type, onlyNew, store.meta.lastSeenIso]);

  function remove(id: string) {
    onUpdate({ ...store, deals: store.deals.filter(d => d.id !== id) });
  }

  return (
    <div>
      <div className="split">
        <input className="input" placeholder="Filter (issuer/country/sector)…" value={q} onChange={e=>setQ(e.target.value)} />
        <div className="split" style={{gridTemplateColumns:"1fr 1fr"}}>
          <select className="input" value={type} onChange={e=>setType(e.target.value as any)}>
            <option>All</option>
            <option>Loan</option>
            <option>Bond</option>
            <option>Sukuk</option>
          </select>
          <label className="pill" style={{ justifyContent:"space-between" }}>
            <span style={{display:"inline-flex", alignItems:"center", gap:8}}>
              <span className={"dot " + (onlyNew ? "new" : "")} />
              New since last mark
            </span>
            <input type="checkbox" checked={onlyNew} onChange={e=>setOnlyNew(e.target.checked)} />
          </label>
        </div>
      </div>

      <div className="hr" />

      {rows.length === 0 ? (
        <div className="small">No deals yet. Use “Paste to parse” to capture new loan / bond / sukuk items into a structured pipeline.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Issuer</th>
              <th>Type</th>
              <th>Status</th>
              <th>Size / CCY</th>
              <th>Tenor</th>
              <th>Banks</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d: DealItem) => (
              <tr key={d.id}>
                <td>
                  <div style={{fontWeight:700}}>{d.issuer}</div>
                  <div className="small">{d.country ?? "—"} • {d.sector} • {new Date(d.createdAtIso).toLocaleString()}</div>
                  {d.sourceUrl && <div className="small"><a href={d.sourceUrl} target="_blank" rel="noreferrer">Open source</a></div>}
                </td>
                <td>{d.type}</td>
                <td><span className="pill"><span className="dot warn" /> {d.status}</span></td>
                <td>{d.size ?? "—"} {d.currency ? `(${d.currency})` : ""}</td>
                <td>{d.tenor ?? "—"}</td>
                <td className="small">{d.banks ?? "—"}</td>
                <td><button className="btn danger" onClick={()=>remove(d.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
