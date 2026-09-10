"use client";

import { useEffect, useState } from "react";
import { computeLevels, formatINR } from "../lib/levels";

const DEFAULT_ITEMS = [
  { id: "ex1", sym: "NIFTY 50", open: 24850.0, example: true },
  { id: "ex2", sym: "BANK NIFTY", open: 51230.0, example: true },
];

// The watchlist itself stays in the browser (localStorage) — it's just
// a per-trader convenience list, not something that needs the database.
// What the database gates is whether this component renders at all.
export default function Calculator() {
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [sym, setSym] = useState("");
  const [open, setOpen] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("rule028-watchlist") || "null"
      );
      if (saved && saved.length) setItems(saved);
    } catch {}
  }, []);

  function persist(next) {
    setItems(next);
    try {
      localStorage.setItem("rule028-watchlist", JSON.stringify(next));
    } catch {}
  }

  function addInstrument(e) {
    e.preventDefault();
    const openNum = parseFloat(open);
    if (!sym.trim() || !openNum || openNum <= 0) return;
    persist([
      ...items,
      { id: `i${Date.now()}`, sym: sym.trim().toUpperCase(), open: openNum, example: false },
    ]);
    setSym("");
    setOpen("");
  }

  function removeInstrument(id) {
    persist(items.filter((it) => it.id !== id));
  }

  return (
    <>
      <div className="card add-card">
        <h3>Add an instrument</h3>
        <form className="add-form" onSubmit={addInstrument}>
          <div className="field">
            <label htmlFor="symInput">Symbol</label>
            <input
              id="symInput"
              type="text"
              placeholder="e.g. NIFTY 50"
              maxLength={24}
              value={sym}
              onChange={(e) => setSym(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="openInput">Today&apos;s open (₹)</label>
            <input
              id="openInput"
              type="number"
              step="0.01"
              min="0"
              placeholder="24850.00"
              value={open}
              onChange={(e) => setOpen(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit">
            Add to ladder
          </button>
        </form>
      </div>

      <div className="watchlist">
        {items.map((item) => (
          <div className="instr-card" key={item.id}>
            <div className="instr-head">
              <div className="instr-name">
                <span className="sym">{item.sym}</span>
                <span className="open-val mono">open ₹{formatINR(item.open)}</span>
                {item.example && <span className="tag-example">Example</span>}
              </div>
              <button
                className="remove-btn"
                title="Remove"
                onClick={() => removeInstrument(item.id)}
              >
                ✕
              </button>
            </div>
            <div className="ladder">
              {computeLevels(item.open).map((L) => {
                const extra = L.key === "r1" ? " r1" : L.key === "s1" ? " s1" : "";
                return (
                  <div className={`rung ${L.side}${extra}`} key={L.key}>
                    <span className="lbl">{L.label}</span>
                    <span className="price mono">{formatINR(L.price)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
