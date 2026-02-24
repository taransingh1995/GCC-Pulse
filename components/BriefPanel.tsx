"use client";
import { useMemo, useState } from "react";
import { BriefItem, Store } from "@/lib/types";

export function BriefPanel({ store, onUpdate }: { store: Store; onUpdate: (s: Store) => void }) {
  const [q, setQ] = useState("");
  const [bucket, setBucket] = useState<string>("All");
  const [onlyNew, setOnlyNew] = useState(false);

  const rows = useMemo(() => {
    const since = store.meta.lastSeenIso || "";
    return store.brief
      .filter(b => bucket==="All" ? true : b.bucket === bucket)
      .filter(b => !q || (b.headline + " " + b.summary + " " + b.bucket).toLowerCase().includes(q.toLowerCase()))
      .filter(b => !onlyNew || b.createdAtIso > since)
      .slice(0, 300);
  }, [store.brief, q, bucket, onlyNew, store.meta.lastSeenIso]);

  function remove(id: string) {
    onUpdate({ ...store, brief: store.brief.filter(b => b.id !== id) });
  }

  return (
    <div>
      <div className="split">
        <input className="input" placeholder="Filter (headline/keywords)…" value={q} onChange={e=>setQ(e.target.value)} />
        <div className="split" style={{gridTemplateColumns:"1fr 1fr"}}>
          <select className="input" value={bucket} onChange={e=>setBucket(e.target.value)}>
            <option>All</option>
            <option>Geopolitics</option>
            <option>Oil & Energy</option>
            <option>Rates & FX</option>
            <option>Banking & Liquidity</option>
            <option>Policy/Regulation</option>
            <option>Other</option>
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
        <div className="small">No brief items yet. Public sources may add “updated” items; paste key paragraphs for richer parsing.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Bucket</th>
              <th>Headline</th>
              <th>Summary</th>
              <th>Syndication angle</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b: BriefItem) => (
              <tr key={b.id}>
                <td><span className="pill"><span className="dot" /> {b.bucket}</span></td>
                <td>
                  <div style={{fontWeight:700}}>{b.headline}</div>
                  <div className="small">{new Date(b.createdAtIso).toLocaleString()}</div>
                  {b.sourceUrl && <div className="small"><a href={b.sourceUrl} target="_blank" rel="noreferrer">Open source</a></div>}
                </td>
                <td className="small">{b.summary}</td>
                <td className="small">{b.syndicationAngle}</td>
                <td><button className="btn danger" onClick={()=>remove(b.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
