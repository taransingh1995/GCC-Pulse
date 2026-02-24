"use client";
import { useState } from "react";

export function PastePanel({ onPaste }: { onPaste: (kind: "rating"|"deal"|"brief", text: string) => void }) {
  const [kind, setKind] = useState<"rating"|"deal"|"brief">("deal");
  const [text, setText] = useState("");

  return (
    <div className="split">
      <div>
        <div className="small" style={{marginBottom:8}}>Type</div>
        <select className="input" value={kind} onChange={e=>setKind(e.target.value as any)}>
          <option value="deal">Deal (loan/bond/sukuk)</option>
          <option value="rating">Rating action</option>
          <option value="brief">Geo/markets brief</option>
        </select>

        <div className="hr" />

        <div className="small" style={{marginBottom:8}}>Paste content</div>
        <textarea className="input" value={text} onChange={e=>setText(e.target.value)} placeholder={`Paste a headline + key paragraph(s)…\n\nTip: separate multiple items with a blank line.`} />

        <div style={{display:"flex", gap:10, marginTop:10}}>
          <button className="btn primary" onClick={()=>{ if(text.trim().length>10) onPaste(kind, text); setText(""); }}>Parse & add</button>
          <button className="btn" onClick={()=>setText("")}>Clear</button>
        </div>
      </div>

      <div>
        <div className="small" style={{marginBottom:8}}>Examples you can paste</div>
        <div className="panel" style={{borderRadius:12}}>
          <div className="body">
            <div className="small"><b>Deal:</b> “Issuer X plans USD 500mn 5-year sukuk; bookrunners…; launch next week…”</div>
            <div className="hr" />
            <div className="small"><b>Rating:</b> “Moody’s upgrades UAE to Aa2; outlook stable; rationale: stronger fiscal buffers…”</div>
            <div className="hr" />
            <div className="small"><b>Brief:</b> “Red Sea shipping risk rises; impact on oil freight and risk sentiment…”</div>
          </div>
        </div>

        <div className="hr" />
        <div className="small">
          This MVP is intentionally conservative: it won’t scrape paywalled terminals. Instead, it helps you convert the intel you already have access to into a structured, searchable “mini-terminal”.
        </div>
      </div>
    </div>
  );
}
