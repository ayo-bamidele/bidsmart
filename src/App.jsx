import React, { useState, useEffect } from "react";

// ─── Constants ────────────────────────────────────────────────
const BUYERS_PREMIUM_RATE = 0.11;
const GST_RATE = 0.1;
const PARTNERS = 3;
const STORAGE_KEY = "bidsmart-history-v1";
const multiplier = 1 + BUYERS_PREMIUM_RATE * (1 + GST_RATE);

// ─── Helpers ──────────────────────────────────────────────────
function calcDeal({ hammerPrice, estimatedRepairs, targetSellPrice, regoRoadworthy = 300 }) {
  const premium = hammerPrice * BUYERS_PREMIUM_RATE;
  const premiumGST = premium * GST_RATE;
  const totalBuyersPremium = premium + premiumGST;
  const landedCost = hammerPrice + totalBuyersPremium + estimatedRepairs + regoRoadworthy;
  const grossProfit = targetSellPrice - landedCost;
  const profitPerPerson = grossProfit / PARTNERS;
  const roi = ((grossProfit / landedCost) * 100).toFixed(1);
  return { landedCost, grossProfit, profitPerPerson, roi, totalBuyersPremium };
}

function getVerdict(roi, grossProfit) {
  if (grossProfit <= 0) return { emoji: "🚫", text: "AVOID", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)" };
  if (roi < 10) return { emoji: "⚠️", text: "MARGINAL", color: "#eab308", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.3)" };
  if (roi < 20) return { emoji: "✅", text: "SOLID DEAL", color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.3)" };
  return { emoji: "🔥", text: "GREAT FLIP", color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.4)" };
}

const fmt = (n) => "$" + Math.round(n).toLocaleString();

// ─── API Call via Vercel backend ──────────────────────────────
async function callClaude(prompt, useWebSearch = false) {
  const res = await fetch("/api/analyse-car", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, useWebSearch }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Analysis failed");
  return data.result || "";
}

// ─── Design Tokens ────────────────────────────────────────────
const sans = "'Geist', 'Inter', system-ui, sans-serif";
const displayFont = "'Syne', sans-serif";
const bg0 = "#f8f7f4", bg1 = "#ffffff", bg2 = "#f3f2ef";
const border1 = "#e8e6e1", border2 = "#d9d7d1";
const muted = "#9c9a94", text = "#1a1916", textSub = "#4a4845", orange = "#e8470a";

const inputBase = {
  width: "100%", background: "#ffffff", border: "1.5px solid " + border2,
  borderRadius: "10px", color: text, padding: "12px 16px",
  fontSize: "14px", fontFamily: sans, outline: "none",
  boxSizing: "border-box", transition: "all 0.2s", fontWeight: "500",
};
const labelBase = {
  display: "block", fontSize: "11px", letterSpacing: "0.06em",
  textTransform: "uppercase", color: muted, marginBottom: "8px", fontFamily: sans, fontWeight: "600",
};
const sectionHead = {
  fontSize: "11px", letterSpacing: "0.08em", color: orange,
  marginBottom: "18px", textTransform: "uppercase", fontFamily: sans, fontWeight: "700",
};

const DEFECT_CATEGORIES = [
  { id: "body", label: "Body & Panel", icon: "🚗", items: ["Dents", "Scratches", "Rust", "Cracked bumper", "Broken mirror", "Hail damage", "Faded paint"] },
  { id: "mechanical", label: "Mechanical", icon: "🔧", items: ["Engine noise", "Oil leak", "Coolant leak", "Transmission slip", "Suspension issues", "Brake wear", "Exhaust smoke"] },
  { id: "electrical", label: "Electrical", icon: "⚡", items: ["Dead battery", "Warning lights", "AC not working", "Power windows fault", "Faulty sensors", "Blown fuses"] },
  { id: "interior", label: "Interior", icon: "🪑", items: ["Torn seats", "Cracked dash", "Stained carpet", "Broken trim", "Missing panels"] },
  { id: "tyres", label: "Tyres & Wheels", icon: "🔘", items: ["Worn tyres", "Mismatched tyres", "Alloy damage", "Flat spare", "Wheel alignment"] },
];

// ─── Shared Components ────────────────────────────────────────
function Field({ label, value, onChange, type = "number", prefix = "$", placeholder = "0", highlight }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={labelBase}>{label}</label>
      <div style={{ position: "relative" }}>
        {prefix && (
          <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: focused ? orange : "#4b5563", fontFamily: sans, fontSize: "14px", transition: "color 0.2s" }}>
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...inputBase, paddingLeft: prefix ? "28px" : "14px", borderColor: highlight ? "rgba(249,115,22,0.5)" : focused ? orange : border2, background: highlight ? "rgba(249,115,22,0.04)" : bg2 }}
        />
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight, sub }) {
  return (
    <div style={{ background: highlight ? orange : bg1, border: "1.5px solid " + (highlight ? orange : border1), borderRadius: "12px", padding: "16px 18px", flex: 1, minWidth: "110px", boxShadow: highlight ? "0 4px 20px rgba(232,71,10,0.2)" : "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: highlight ? "rgba(255,255,255,0.7)" : muted, marginBottom: "6px", fontWeight: "600" }}>{label}</div>
      <div style={{ fontSize: "20px", fontWeight: "700", color: highlight ? "#fff" : text, letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", color: highlight ? "rgba(255,255,255,0.6)" : muted, marginTop: "3px" }}>{sub}</div>}
    </div>
  );
}

function TabBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: "10px 18px", background: active ? text : "transparent", color: active ? "#fff" : muted, border: "1.5px solid " + (active ? text : border2), borderRadius: "100px", fontSize: "12px", fontFamily: sans, cursor: "pointer", fontWeight: active ? "600" : "500", transition: "all 0.2s" }}>
      {label}
    </button>
  );
}

function AiBtn({ onClick, loading, children }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ width: "100%", padding: "14px", background: loading ? bg2 : orange, color: loading ? muted : "#fff", border: loading ? ("1.5px solid " + border2) : "none", borderRadius: "10px", fontSize: "13px", fontWeight: "600", fontFamily: sans, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", marginBottom: "10px", boxShadow: loading ? "none" : "0 4px 14px rgba(232,71,10,0.3)" }}>
      {loading ? "Working on it..." : children}
    </button>
  );
}

function ResultBox({ title, content: resultContent, accentColor = orange }) {
  if (!resultContent) return null;
  const lines = resultContent.split("\n").filter(l => l.trim());
  return (
    <div style={{ background: "rgba(232,71,10,0.04)", border: "1.5px solid rgba(232,71,10,0.15)", borderRadius: "12px", padding: "20px", marginTop: "14px" }}>
      <div style={{ fontSize: "11px", color: accentColor, marginBottom: "14px", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: accentColor }} />
        {title}
      </div>
      {lines.map((line, i) => {
        const html = line
          .replace(/\*\*(.*?)\*\*/g, '<span style="color:' + accentColor + ';font-weight:700">$1</span>')
          .replace(/^[-•]\s/, "· ");
        return <p key={i} dangerouslySetInnerHTML={{ __html: html }} style={{ margin: "6px 0", lineHeight: 1.8, color: textSub, fontSize: "13px" }} />;
      })}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("analyse");
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch {}
  }, [history]);

  const addToHistory = (entry) => setHistory(h => [{ ...entry, id: Date.now(), date: new Date().toLocaleDateString("en-AU") }, ...h].slice(0, 50));
  const removeFromHistory = (id) => setHistory(h => h.filter(e => e.id !== id));

  return (
    <div style={{ minHeight: "100vh", background: bg0, fontFamily: sans, padding: "28px 16px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        * { box-sizing: border-box; }
        textarea { font-family: ${sans}; }
        button:hover { opacity: 0.9; }
        input:focus, textarea:focus { border-color: ${orange} !important; box-shadow: 0 0 0 3px rgba(232,71,10,0.1); }
      `}</style>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "28px", borderBottom: "1.5px solid " + border1, paddingBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: orange }} />
                <span style={{ fontSize: "11px", letterSpacing: "0.1em", color: muted, textTransform: "uppercase", fontWeight: "600" }}>Pickles Auction Tool</span>
              </div>
              <h1 style={{ fontFamily: displayFont, fontSize: "clamp(32px, 6vw, 48px)", color: text, margin: 0, fontWeight: "800", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
                BidSmart<span style={{ color: orange }}>.</span>
              </h1>
              <p style={{ fontSize: "14px", color: muted, margin: "6px 0 0", fontWeight: "500" }}>Is it worth the bid?</p>
            </div>
            <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>🚗</div>
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "24px", flexWrap: "wrap" }}>
          {[["analyse", "📊 Analyse Car"], ["maxbid", "🎯 Max Bid Calc"], ["tracker", "💰 P&L Tracker"], ["history", "📁 History (" + history.length + ")"]].map(([id, label]) => (
            <TabBtn key={id} label={label} active={tab === id} onClick={() => setTab(id)} />
          ))}
        </div>
        {tab === "analyse" && <AnalyseTab addToHistory={addToHistory} />}
        {tab === "maxbid" && <MaxBidTab />}
        {tab === "tracker" && <TrackerTab history={history} updateHistory={setHistory} />}
        {tab === "history" && <HistoryTab history={history} removeFromHistory={removeFromHistory} />}
        <div style={{ textAlign: "center", color: muted, fontSize: "11px", marginTop: "40px" }}>BidSmart · 3 partners · AU market</div>
      </div>
    </div>
  );
}

// ─── TAB 1: ANALYSE ───────────────────────────────────────────
function AnalyseTab({ addToHistory }) {
  const [listingUrl, setListingUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlExtracted, setUrlExtracted] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteLoading, setPasteLoading] = useState(false);
  const [inputMode, setInputMode] = useState("url");
  const [form, setForm] = useState({ year: "", make: "", model: "", odometer: "", colour: "", hammerPrice: "", repairs: "", sellPrice: "", rego: "300", notes: "", mechanicNotes: "", mechanicQuote: "" });
  const [autoFilled, setAutoFilled] = useState({});
  const [defects, setDefects] = useState({});
  const [customDefects, setCustomDefects] = useState("");
  const [marketResult, setMarketResult] = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [defectResult, setDefectResult] = useState(null);
  const [defectLoading, setDefectLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = k => v => setForm(f => ({ ...f, [k]: v }));
  const toggleDefect = (cat, item) => {
    const key = cat + "::" + item;
    setDefects(d => ({ ...d, [key]: !d[key] }));
  };
  const selectedDefects = Object.entries(defects).filter(([, v]) => v).map(([k]) => k.split("::")[1]);

  const hammer = parseFloat(form.hammerPrice) || 0;
  const repairs = parseFloat(form.repairs) || 0;
  const sellPrice = parseFloat(form.sellPrice) || 0;
  const rego = parseFloat(form.rego) || 300;
  const ready = hammer > 0 && sellPrice > 0;
  const calc = ready ? calcDeal({ hammerPrice: hammer, estimatedRepairs: repairs, targetSellPrice: sellPrice, regoRoadworthy: rego }) : null;
  const verdict = calc ? getVerdict(parseFloat(calc.roi), calc.grossProfit) : null;
  const carDesc = [form.year, form.make, form.model].filter(Boolean).join(" ") || "this vehicle";

  function applyParsed(parsed) {
    const filled = {};
    if (parsed.year) { set("year")(String(parsed.year)); filled.year = true; }
    if (parsed.make) { set("make")(parsed.make); filled.make = true; }
    if (parsed.model) { set("model")(parsed.model); filled.model = true; }
    if (parsed.odometer) { set("odometer")(String(parsed.odometer)); filled.odometer = true; }
    if (parsed.colour) { set("colour")(parsed.colour); filled.colour = true; }
    const noteParts = [parsed.engine, parsed.transmission, parsed.fuel, parsed.notes, parsed.stockNo ? "Stock: " + parsed.stockNo : null].filter(Boolean);
    if (noteParts.length) { set("notes")(noteParts.join(" · ")); filled.notes = true; }
    if (parsed.defects && parsed.defects.length) { setCustomDefects(parsed.defects.filter(Boolean).join(", ")); filled.defects = true; }
    setAutoFilled(filled);
    setUrlExtracted(true);
  }

  async function handleURL(url) {
    if (!url || !url.includes("pickles")) { alert("Please paste a valid Pickles listing URL."); return; }
    setUrlLoading(true);
    setUrlExtracted(false);
    setAutoFilled({});
    try {
      const fetchRes = await fetch("/api/fetch-listing?url=" + encodeURIComponent(url));
      const fetchData = await fetchRes.json();
      if (!fetchRes.ok || fetchData.error) throw new Error(fetchData.error || "Could not fetch listing.");
      const pageText = fetchData.text || "";
      if (!pageText || pageText.length < 100) throw new Error("Pickles page returned empty content. The listing may have ended.");
      const prompt = "This is text from a Pickles auction vehicle listing. Extract vehicle details and return ONLY a raw JSON object — no markdown, no backticks. Format: {year, make, model, odometer (integer), colour, stockNo, engine, transmission, fuel, defects (array of strings), notes (string)}. Use null for missing fields. Text: " + pageText;
      let raw = await callClaude(prompt);
      raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse vehicle details from listing");
      applyParsed(JSON.parse(jsonMatch[0]));
    } catch (e) {
      alert("Could not read listing: " + e.message);
    }
    setUrlLoading(false);
  }

  async function handlePasteExtract() {
    if (!pasteText || pasteText.length < 50) { alert("Please paste more text from the listing."); return; }
    setPasteLoading(true);
    setAutoFilled({});
    try {
      const prompt = "This is text copied from a Pickles auction vehicle listing. Extract vehicle details and return ONLY a raw JSON object — no markdown, no backticks: {year, make, model, odometer (integer), colour, stockNo, engine, transmission, fuel, defects (array), notes}. Use null for missing. Text: " + pasteText.substring(0, 8000);
      let raw = await callClaude(prompt);
      raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse listing details");
      applyParsed(JSON.parse(jsonMatch[0]));
    } catch (e) { alert("Could not extract details: " + e.message); }
    setPasteLoading(false);
  }

  async function fetchMarketPrices() {
    if (!form.make && !form.model) { alert("Fill in at least Make and Model first."); return; }
    setMarketLoading(true); setMarketResult(null);
    const odo = form.odometer ? "around " + Number(form.odometer).toLocaleString() + "km" : "";
    try {
      const result = await callClaude(
        "Search for current Australian used car listings for: " + form.year + " " + form.make + " " + form.model + " " + odo + "\n\nSearch Carsales.com.au and Facebook Marketplace Australia. Find 3-5 comparable listings.\n\n**Market Summary**\n- Price range (low to high)\n- Average asking price\n- Demand (high/medium/low)\n\n**Comparable Listings**\n3-5 examples with year, odometer, price, source\n\n**Recommended Sell Price**\nWhat should this crew price it at to sell within 2-3 weeks? Be specific. Australian market only.",
        true
      );
      setMarketResult(result);
    } catch { setMarketResult("Market search failed. Try again."); }
    setMarketLoading(false);
  }

  async function runDefectAnalysis() {
    const defectList = [...selectedDefects, ...(customDefects ? customDefects.split(",").map(s => s.trim()) : [])].filter(Boolean);
    if (!defectList.length) { setDefectResult("No defects selected. Tick defects above or extract from listing first."); return; }
    setDefectLoading(true); setDefectResult(null);
    try {
      const result = await callClaude(
        "You are a mechanic in Australia helping a crew flip auction cars. Vehicle: " + carDesc + ". Defects: " + defectList.join(", ") + ". Notes: " + (form.notes || "none") + ".\n\nFor each defect:\n- What needs doing\n- Cost AUD: DIY vs Trade (labour ~$140-180/hr QLD)\n- Priority: HIGH / MEDIUM / LOW\n\nNumbered list. Practical and concise."
      );
      setDefectResult(result);
    } catch { setDefectResult("Failed. Try again."); }
    setDefectLoading(false);
  }

  async function runMarketAnalysis() {
    setAiLoading(true); setAiResult(null);
    const defectList = [...selectedDefects, ...(customDefects ? customDefects.split(",").map(s => s.trim()) : [])].filter(Boolean);
    try {
      const result = await callClaude(
        "Australian used car market expert. 3 friends flip Pickles Auction cars.\n\nVehicle: " + carDesc + "\nOdo: " + (form.odometer ? Number(form.odometer).toLocaleString() + "km" : "unknown") + "\nColour: " + (form.colour || "unknown") + "\nHammer: $" + hammer.toLocaleString() + "\nRepairs: $" + repairs.toLocaleString() + "\nRego: $" + rego + "\nLanded: $" + (calc ? Math.round(calc.landedCost) : "TBC") + "\nSell price: $" + sellPrice.toLocaleString() + "\nProfit: $" + (calc ? Math.round(calc.grossProfit) : "TBC") + "\nROI: " + (calc ? calc.roi : "TBC") + "%\nDefects: " + (defectList.join(", ") || "none") + "\n\nRespond with:\n**Demand** - how fast does this sell?\n**Pricing** - is the sell price realistic?\n**Key Risk** - one main risk\n**Recommendation** - one clear action\n\n4 short paragraphs. Australian context."
      );
      setAiResult(result);
    } catch { setAiResult("Analysis failed. Try again."); }
    setAiLoading(false);
  }

  function saveToHistory() {
    addToHistory({ car: carDesc, hammer, repairs, sellPrice, rego, landed: calc ? calc.landedCost : 0, profit: calc ? calc.grossProfit : 0, roi: calc ? calc.roi : 0, verdict: verdict ? verdict.text : "", defects: selectedDefects, customDefects, notes: form.notes, colour: form.colour, odometer: form.odometer, mechanicNotes: form.mechanicNotes, mechanicQuote: form.mechanicQuote, status: "analysed", actualSalePrice: null });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const card = { background: bg1, border: "1.5px solid " + border1, borderRadius: "16px", padding: "24px", marginBottom: "14px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>

      {/* Step 1 */}
      <div style={card}>
        <div style={sectionHead}>Step 1 — Paste Pickles Listing URL</div>
        <div style={{ display: "flex", gap: "6px", marginBottom: "16px", background: bg2, padding: "4px", borderRadius: "100px", width: "fit-content" }}>
          {[["url", "🔗 Paste URL"], ["paste", "📋 Paste Text"]].map(([mode, label]) => (
            <button key={mode} onClick={() => setInputMode(mode)} style={{ padding: "7px 16px", background: inputMode === mode ? "#fff" : "transparent", color: inputMode === mode ? text : muted, border: inputMode === mode ? ("1.5px solid " + border1) : "none", borderRadius: "100px", fontSize: "12px", fontWeight: "600", fontFamily: sans, cursor: "pointer", transition: "all 0.2s" }}>{label}</button>
          ))}
        </div>
        {inputMode === "url" && (
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", fontSize: "14px" }}>🔗</span>
              <input type="url" value={listingUrl} onChange={e => setListingUrl(e.target.value)} placeholder="https://www.pickles.com.au/used/details/cars/..." style={{ ...inputBase, paddingLeft: "36px", background: bg2 }} />
            </div>
            <button onClick={() => handleURL(listingUrl)} disabled={urlLoading || !listingUrl} style={{ padding: "11px 18px", background: urlLoading || !listingUrl ? bg2 : orange, color: urlLoading || !listingUrl ? muted : "#fff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", fontFamily: sans, cursor: urlLoading || !listingUrl ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
              {urlLoading ? "Reading..." : "⚡ Extract"}
            </button>
          </div>
        )}
        {inputMode === "paste" && (
          <div style={{ marginBottom: "12px" }}>
            <label style={labelBase}>Paste listing text here</label>
            <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Open Pickles listing → Ctrl+A → Ctrl+C → Ctrl+V here..." rows={6} style={{ ...inputBase, paddingLeft: "14px", resize: "vertical", fontSize: "12px" }} />
            <button onClick={handlePasteExtract} disabled={pasteLoading || !pasteText} style={{ width: "100%", marginTop: "8px", padding: "12px", background: pasteLoading || !pasteText ? bg2 : orange, color: pasteLoading || !pasteText ? muted : "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "600", fontFamily: sans, cursor: pasteLoading || !pasteText ? "not-allowed" : "pointer" }}>
              {pasteLoading ? "Extracting..." : "⚡ Extract from Text"}
            </button>
          </div>
        )}
        {(urlLoading || pasteLoading) && (
          <div style={{ fontSize: "12px", color: orange, animation: "pulse 1.2s infinite", textAlign: "center", padding: "8px" }}>
            Reading listing and extracting vehicle details...
          </div>
        )}
        {urlExtracted && (
          <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", color: "#15803d", fontWeight: "600" }}>✅ Details extracted — check fields below</div>
          </div>
        )}
      </div>

      {/* Step 2 */}
      <div style={card}>
        <div style={sectionHead}>Step 2 — Vehicle Details {urlExtracted ? <span style={{ color: "#22c55e", fontSize: "10px" }}>(auto-filled)</span> : <span style={{ color: muted, fontSize: "10px" }}>(fill manually)</span>}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr", gap: "10px", marginBottom: "12px" }}>
          {[["Year", "year", "2019", "number"], ["Make", "make", "Toyota", "text"], ["Model", "model", "Corolla", "text"]].map(([l, k, ph, t]) => (
            <div key={k}>
              <label style={labelBase}>{l}</label>
              <input type={t} value={form[k]} onChange={e => set(k)(e.target.value)} placeholder={ph} style={{ ...inputBase, paddingLeft: "12px", borderColor: autoFilled[k] ? "rgba(34,197,94,0.4)" : border2, background: autoFilled[k] ? "rgba(34,197,94,0.04)" : bg2 }} />
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
          {[["Odometer (km)", "odometer", "95000", "number"], ["Colour", "colour", "Silver", "text"]].map(([l, k, ph, t]) => (
            <div key={k}>
              <label style={labelBase}>{l}</label>
              <input type={t} value={form[k]} onChange={e => set(k)(e.target.value)} placeholder={ph} style={{ ...inputBase, paddingLeft: "12px", borderColor: autoFilled[k] ? "rgba(34,197,94,0.4)" : border2, background: autoFilled[k] ? "rgba(34,197,94,0.04)" : bg2 }} />
            </div>
          ))}
        </div>
        <label style={labelBase}>Notes</label>
        <textarea value={form.notes} onChange={e => set("notes")(e.target.value)} placeholder="Engine, transmission, condition notes..." rows={2} style={{ ...inputBase, paddingLeft: "12px", resize: "vertical", borderColor: autoFilled.notes ? "rgba(34,197,94,0.4)" : border2, background: autoFilled.notes ? "rgba(34,197,94,0.04)" : bg2 }} />
      </div>

      {/* Step 3 */}
      <div style={card}>
        <div style={sectionHead}>Step 3 — Live Market Prices</div>
        <p style={{ fontSize: "12px", color: muted, lineHeight: 1.7, marginBottom: "14px" }}>Searches Carsales & Facebook Marketplace right now — know what to price it before you bid.</p>
        <AiBtn onClick={fetchMarketPrices} loading={marketLoading}>🔍 Search What Similar Cars Sell For Now</AiBtn>
        {marketResult && <ResultBox title="Live Market Prices" content={marketResult} />}
      </div>

      {/* Step 4 */}
      <div style={card}>
        <div style={sectionHead}>Step 4 — Defects {autoFilled.defects ? <span style={{ color: "#22c55e", fontSize: "10px" }}>(extracted)</span> : ""}</div>
        {DEFECT_CATEGORIES.map(cat => (
          <div key={cat.id} style={{ marginBottom: "14px" }}>
            <div style={{ fontSize: "11px", color: textSub, marginBottom: "7px" }}>{cat.icon} {cat.label}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {cat.items.map(item => {
                const key = cat.id + "::" + item;
                const on = !!defects[key];
                return (
                  <button key={item} onClick={() => toggleDefect(cat.id, item)} style={{ padding: "5px 12px", fontSize: "11px", fontFamily: sans, background: on ? "#fef2f2" : bg0, color: on ? "#dc2626" : muted, border: "1.5px solid " + (on ? "#fecaca" : border2), borderRadius: "20px", cursor: "pointer" }}>
                    {on ? "✕ " : ""}{item}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <label style={labelBase}>Other defects {autoFilled.defects ? "(auto-filled)" : "(comma separated)"}</label>
        <input value={customDefects} onChange={e => setCustomDefects(e.target.value)} placeholder="e.g. cracked windscreen, missing spare key" style={{ ...inputBase, paddingLeft: "12px", borderColor: autoFilled.defects ? "rgba(34,197,94,0.4)" : border2, background: autoFilled.defects ? "rgba(34,197,94,0.04)" : bg2, marginBottom: "12px" }} />
        {(selectedDefects.length > 0 || customDefects) && (
          <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: "8px", marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", color: "#dc2626", fontWeight: "600", marginBottom: "4px" }}>{selectedDefects.length} defect{selectedDefects.length !== 1 ? "s" : ""} flagged</div>
            <div style={{ fontSize: "12px", color: textSub }}>{selectedDefects.join(" · ")}</div>
          </div>
        )}
        <AiBtn onClick={runDefectAnalysis} loading={defectLoading}>🔧 What Needs Fixing + Cost Estimates</AiBtn>
        {defectResult && <ResultBox title="Defect Repair Guide" content={defectResult} accentColor="#f87171" />}
      </div>

      {/* Step 4b - Mechanic */}
      <div style={card}>
        <div style={sectionHead}>🔧 Mechanic Assessment</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
          <div>
            <label style={labelBase}>Mechanic Notes</label>
            <textarea value={form.mechanicNotes} onChange={e => set("mechanicNotes")(e.target.value)} placeholder="Engine sounds fine, needs brake pads, front tyres worn..." rows={3} style={{ ...inputBase, paddingLeft: "12px", resize: "vertical" }} />
          </div>
          <Field label="Mechanic Quote ($)" value={form.mechanicQuote} onChange={set("mechanicQuote")} placeholder="1500" />
        </div>
        {form.mechanicQuote && form.repairs && parseFloat(form.mechanicQuote) !== parseFloat(form.repairs) && (
          <div style={{ marginTop: "10px", padding: "10px 14px", background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: "10px", fontSize: "12px", color: "#92400e" }}>
            ⚠️ Mechanic quote (${parseFloat(form.mechanicQuote).toLocaleString()}) differs from repairs estimate (${parseFloat(form.repairs).toLocaleString()})
          </div>
        )}
      </div>

      {/* Step 5 */}
      <div style={card}>
        <div style={sectionHead}>Step 5 — Deal Numbers</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <Field label="Hammer Price" value={form.hammerPrice} onChange={set("hammerPrice")} placeholder="8000" />
          <Field label="Repairs & Parts" value={form.repairs} onChange={set("repairs")} placeholder="1500" />
          <Field label="Rego / Roadworthy" value={form.rego} onChange={set("rego")} placeholder="300" />
          <Field label="Target Sell Price" value={form.sellPrice} onChange={set("sellPrice")} placeholder="12000" highlight={!!marketResult && !form.sellPrice} />
        </div>
      </div>

      {/* Results */}
      {calc && (
        <div style={{ animation: "fadeIn 0.3s ease", marginBottom: "14px" }}>
          <div style={{ background: verdict.bg, border: "1px solid " + verdict.border, borderRadius: "12px", padding: "18px 22px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "32px" }}>{verdict.emoji}</span>
            <div>
              <div style={{ fontSize: "26px", color: verdict.color, fontFamily: displayFont, fontWeight: "800" }}>{verdict.text}</div>
              <div style={{ fontSize: "12px", color: muted }}>{calc.roi}% ROI · {fmt(calc.grossProfit)} gross profit</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            <StatBox label="Landed Cost" value={fmt(calc.landedCost)} />
            <StatBox label="Gross Profit" value={fmt(calc.grossProfit)} highlight={calc.grossProfit > 0} />
            <StatBox label="Each (÷3)" value={fmt(calc.profitPerPerson)} sub="per partner" />
            <StatBox label="ROI" value={calc.roi + "%"} highlight />
          </div>
          <div style={{ background: bg1, border: "1px solid " + border1, borderRadius: "12px", padding: "18px 22px", marginBottom: "12px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: muted, marginBottom: "12px", textTransform: "uppercase" }}>Cost Breakdown</div>
            {[["Hammer Price", hammer], ["Buyer's Premium (11% + GST)", calc.totalBuyersPremium], ["Repairs & Parts", repairs], ["Rego / Roadworthy", rego]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid " + bg0, fontSize: "12px" }}>
                <span style={{ color: muted }}>{l}</span><span style={{ color: textSub }}>{fmt(v)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontSize: "13px", fontWeight: "700" }}>
              <span style={{ color: text }}>Total Landed</span><span style={{ color: orange }}>{fmt(calc.landedCost)}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
            <button onClick={runMarketAnalysis} disabled={aiLoading} style={{ flex: 1, padding: "14px", background: aiLoading ? bg1 : orange, color: aiLoading ? muted : "#fff", border: "none", borderRadius: "10px", fontSize: "12px", fontWeight: "700", fontFamily: sans, cursor: aiLoading ? "not-allowed" : "pointer" }}>
              {aiLoading ? "Analysing..." : "⚡ Full AI Deal Analysis"}
            </button>
            <button onClick={saveToHistory} style={{ padding: "14px 18px", background: saved ? "#f0fdf4" : bg0, color: saved ? "#15803d" : muted, border: "1.5px solid " + (saved ? "#bbf7d0" : border2), borderRadius: "10px", fontSize: "12px", fontFamily: sans, cursor: "pointer" }}>
              {saved ? "✓ Saved" : "💾 Save"}
            </button>
            <button onClick={() => {
              const defectList = [...selectedDefects, ...(customDefects ? customDefects.split(",").map(s => s.trim()) : [])].filter(Boolean);
              const msg = "🚗 *BidSmart Analysis*\n\n*" + carDesc + "*\n" + (form.odometer ? Number(form.odometer).toLocaleString() + "km" : "") + " " + (form.colour || "") + "\n\n💰 *Deal Numbers*\nHammer: $" + hammer.toLocaleString() + "\nRepairs: $" + repairs.toLocaleString() + "\nLanded: " + fmt(calc.landedCost) + "\nSell: $" + sellPrice.toLocaleString() + "\nProfit: " + fmt(calc.grossProfit) + "\nROI: " + calc.roi + "%\nEach (÷3): " + fmt(calc.profitPerPerson) + "\n\n" + verdict.emoji + " " + verdict.text + (defectList.length ? "\n\n🔧 Defects: " + defectList.join(", ") : "") + "\n\n_Sent from BidSmart_";
              window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
            }} style={{ padding: "14px", background: "#dcfce7", color: "#15803d", border: "1.5px solid #bbf7d0", borderRadius: "10px", fontSize: "16px", cursor: "pointer" }} title="Share to WhatsApp">📲</button>
          </div>
          {aiResult && <ResultBox title="AI Deal Analysis" content={aiResult} />}
        </div>
      )}
    </div>
  );
}

// ─── TAB 2: MAX BID ───────────────────────────────────────────
function MaxBidTab() {
  const [form, setForm] = useState({ sellPrice: "", repairs: "", rego: "300", targetProfit: "" });
  const set = k => v => setForm(f => ({ ...f, [k]: v }));
  const sell = parseFloat(form.sellPrice) || 0;
  const repairs = parseFloat(form.repairs) || 0;
  const rego = parseFloat(form.rego) || 300;
  const targetProfit = parseFloat(form.targetProfit) || 0;
  const maxHammer = sell > 0 ? Math.max(0, (sell - repairs - rego - targetProfit) / multiplier) : null;
  const perPerson = targetProfit > 0 ? targetProfit / PARTNERS : null;
  const scenarios = sell > 0 ? [
    { label: "Break Even", profit: 0 },
    { label: "10% ROI", roi: 0.10 },
    { label: "15% ROI", roi: 0.15 },
    { label: "20% ROI", roi: 0.20 },
  ].map(s => {
    let h, profit;
    if (s.roi !== undefined) { const lc = sell / (1 + s.roi); h = Math.max(0, (lc - repairs - rego) / multiplier); profit = sell - (h * multiplier + repairs + rego); }
    else { profit = s.profit; h = Math.max(0, (sell - repairs - rego - profit) / multiplier); }
    return { label: s.label, maxBid: h, profit, perPerson: profit / PARTNERS };
  }) : [];

  const card = { background: bg1, border: "1.5px solid " + border1, borderRadius: "16px", padding: "24px", marginBottom: "14px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" };

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={card}>
        <div style={sectionHead}>🎯 Max Bid Calculator</div>
        <p style={{ fontSize: "12px", color: muted, lineHeight: 1.8, marginBottom: "18px" }}>Enter what you can sell for → get your max hammer price. Know your walk-away number before the auction.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <Field label="Expected Sell Price" value={form.sellPrice} onChange={set("sellPrice")} placeholder="12000" />
          <Field label="Estimated Repairs" value={form.repairs} onChange={set("repairs")} placeholder="1500" />
          <Field label="Rego / Roadworthy" value={form.rego} onChange={set("rego")} placeholder="300" />
          <Field label="Target Profit (all 3)" value={form.targetProfit} onChange={set("targetProfit")} placeholder="2000" />
        </div>
      </div>
      {maxHammer !== null && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <div style={{ background: orange, borderRadius: "14px", padding: "24px", marginBottom: "14px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.06em", color: "rgba(255,255,255,0.7)", marginBottom: "6px", textTransform: "uppercase", fontWeight: "600" }}>Maximum Hammer Price</div>
            <div style={{ fontSize: "54px", fontFamily: displayFont, color: "#fff", lineHeight: 1 }}>{fmt(maxHammer)}</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: "6px" }}>Do NOT bid above this</div>
            {perPerson !== null && perPerson > 0 && (
              <div style={{ marginTop: "12px", padding: "10px 16px", background: bg2, borderRadius: "8px", fontSize: "13px", color: textSub, display: "inline-block" }}>
                Win at max bid → <span style={{ color: orange }}>{fmt(perPerson)}</span> each (÷3)
              </div>
            )}
          </div>
          {scenarios.length > 0 && (
            <div style={card}>
              <div style={sectionHead}>Bid Scenarios — Selling at {fmt(sell)}</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead><tr>{["Target", "Max Bid", "Total Profit", "Each (÷3)"].map(h => <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: muted, borderBottom: "1.5px solid " + border1, fontWeight: "600", fontSize: "11px", textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
                <tbody>{scenarios.map((s, i) => <tr key={i} style={{ borderBottom: "1px solid " + bg0 }}><td style={{ padding: "10px", color: textSub }}>{s.label}</td><td style={{ padding: "10px", color: orange, fontWeight: "700" }}>{fmt(s.maxBid)}</td><td style={{ padding: "10px", color: s.profit > 0 ? "#22c55e" : "#ef4444" }}>{fmt(s.profit)}</td><td style={{ padding: "10px", color: textSub }}>{fmt(s.perPerson)}</td></tr>)}</tbody>
              </table>
              <div style={{ marginTop: "12px", fontSize: "11px", color: muted, padding: "10px 14px", background: bg2, borderRadius: "8px" }}>
                💡 Target 15-20%+ ROI. Under 10%? Walk away — one surprise repair kills the deal.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── TAB 3: P&L TRACKER ──────────────────────────────────────
function TrackerTab({ history, updateHistory }) {
  const sold = history.filter(h => h.status === "sold");
  const active = history.filter(h => h.status !== "sold");
  const totalRealProfit = sold.reduce((s, h) => s + ((h.actualSalePrice || 0) - (h.landed || 0)), 0);

  function markSold(id, actualSalePrice) {
    updateHistory(h => h.map(e => e.id === id ? { ...e, status: "sold", actualSalePrice: parseFloat(actualSalePrice) || 0, soldDate: new Date().toLocaleDateString("en-AU") } : e));
  }
  function markActive(id) {
    updateHistory(h => h.map(e => e.id === id ? { ...e, status: "analysed", actualSalePrice: null, soldDate: null } : e));
  }

  if (!history.length) return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: muted }}>
      <div style={{ fontSize: "40px", marginBottom: "14px" }}>💰</div>
      <div style={{ fontSize: "13px", lineHeight: 1.8 }}>No cars tracked yet.<br />Save a car from Analyse tab first.</div>
    </div>
  );

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <StatBox label="Active Cars" value={active.length} />
        <StatBox label="Sold Cars" value={sold.length} />
        <StatBox label="Real Profit" value={fmt(totalRealProfit)} highlight={totalRealProfit > 0} sub="from sold" />
        <StatBox label="Each (÷3)" value={fmt(totalRealProfit / 3)} sub="actual" />
      </div>
      {active.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: orange, textTransform: "uppercase", marginBottom: "10px" }}>🔄 Active ({active.length})</div>
          {active.map(entry => <CarTrackerCard key={entry.id} entry={entry} onMarkSold={markSold} onMarkActive={markActive} />)}
        </div>
      )}
      {sold.length > 0 && (
        <div>
          <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: "#22c55e", textTransform: "uppercase", marginBottom: "10px" }}>✅ Sold ({sold.length})</div>
          {sold.map(entry => <CarTrackerCard key={entry.id} entry={entry} onMarkSold={markSold} onMarkActive={markActive} />)}
        </div>
      )}
    </div>
  );
}

function CarTrackerCard({ entry, onMarkSold, onMarkActive }) {
  const [salePrice, setSalePrice] = useState(entry.actualSalePrice || "");
  const [editing, setEditing] = useState(false);
  const isSold = entry.status === "sold";
  const realProfit = isSold ? (entry.actualSalePrice || 0) - (entry.landed || 0) : null;

  return (
    <div style={{ background: bg1, border: "1px solid " + (isSold ? "rgba(34,197,94,0.25)" : border1), borderRadius: "12px", padding: "18px 20px", marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div>
          <div style={{ fontSize: "15px", color: text, fontWeight: "700" }}>{entry.car || "Unknown"}</div>
          <div style={{ fontSize: "11px", color: muted, marginTop: "3px" }}>{entry.date}{entry.odometer ? " · " + Number(entry.odometer).toLocaleString() + "km" : ""}{entry.colour ? " · " + entry.colour : ""}</div>
        </div>
        <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: isSold ? "rgba(34,197,94,0.12)" : "rgba(249,115,22,0.08)", color: isSold ? "#22c55e" : orange }}>
          {isSold ? "✅ Sold" : "🔄 Active"}
        </span>
      </div>
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", fontSize: "12px", marginBottom: "12px" }}>
        {[["Landed", fmt(entry.landed)], ["Target", fmt(entry.sellPrice)], ["Proj. Profit", fmt(entry.profit)]].map(([l, v]) => (
          <div key={l}><div style={{ color: muted, fontSize: "10px", marginBottom: "2px", textTransform: "uppercase" }}>{l}</div><div style={{ color: textSub }}>{v}</div></div>
        ))}
        {isSold && [["Actual Sale", fmt(entry.actualSalePrice)], ["Real Profit", fmt(realProfit)], ["Each (÷3)", fmt(realProfit / 3)]].map(([l, v]) => (
          <div key={l}><div style={{ color: muted, fontSize: "10px", marginBottom: "2px", textTransform: "uppercase" }}>{l}</div><div style={{ color: realProfit > 0 ? "#22c55e" : "#f87171", fontWeight: "700" }}>{v}</div></div>
        ))}
      </div>
      {!isSold && (
        <div style={{ display: "flex", gap: "8px" }}>
          {editing ? (
            <>
              <div style={{ position: "relative", flex: 1 }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#4b5563", fontSize: "13px" }}>$</span>
                <input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="Actual sale price" style={{ ...inputBase, paddingLeft: "26px", padding: "10px 14px 10px 26px" }} autoFocus />
              </div>
              <button onClick={() => { onMarkSold(entry.id, salePrice); setEditing(false); }} style={{ padding: "10px 16px", background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px", fontSize: "12px", fontFamily: sans, cursor: "pointer" }}>✓ Confirm</button>
              <button onClick={() => setEditing(false)} style={{ padding: "10px 14px", background: bg2, color: muted, border: "1px solid " + border2, borderRadius: "8px", fontSize: "12px", fontFamily: sans, cursor: "pointer" }}>Cancel</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} style={{ padding: "10px 16px", background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "8px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", fontFamily: sans, cursor: "pointer" }}>
              ✅ Mark as Sold
            </button>
          )}
        </div>
      )}
      {isSold && (
        <button onClick={() => onMarkActive(entry.id)} style={{ padding: "8px 14px", background: "transparent", color: muted, border: "1px solid " + border2, borderRadius: "8px", fontSize: "11px", fontFamily: sans, cursor: "pointer" }}>↩ Reopen</button>
      )}
    </div>
  );
}

// ─── TAB 4: HISTORY ───────────────────────────────────────────
function HistoryTab({ history, removeFromHistory }) {
  if (!history.length) return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: muted }}>
      <div style={{ fontSize: "40px", marginBottom: "14px" }}>📁</div>
      <div style={{ fontSize: "13px", lineHeight: 1.8 }}>No bids saved yet.<br />Analyse a car and hit 💾 Save.</div>
    </div>
  );
  const totalProfit = history.reduce((s, h) => s + (h.profit || 0), 0);
  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <StatBox label="Cars Logged" value={history.length} />
        <StatBox label="Total Profit" value={fmt(totalProfit)} highlight={totalProfit > 0} />
        <StatBox label="Each (÷3)" value={fmt(totalProfit / PARTNERS)} sub="across all cars" />
      </div>
      {history.map(entry => {
        const v = entry.verdict ? getVerdict(parseFloat(entry.roi), entry.profit) : null;
        return (
          <div key={entry.id} style={{ background: bg1, border: "1px solid " + border1, borderRadius: "12px", padding: "18px 20px", marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <div>
                <div style={{ fontSize: "15px", color: text, fontWeight: "700" }}>{entry.car || "Unknown"}</div>
                <div style={{ fontSize: "11px", color: muted, marginTop: "3px" }}>{entry.date}{entry.odometer ? " · " + Number(entry.odometer).toLocaleString() + "km" : ""}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {v && <span style={{ fontSize: "11px", color: v.color, background: v.bg, border: "1px solid " + v.border, padding: "3px 10px", borderRadius: "20px" }}>{v.emoji} {v.text}</span>}
                <button onClick={() => removeFromHistory(entry.id)} style={{ background: "transparent", border: "none", color: border2, cursor: "pointer", fontSize: "18px" }}>✕</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", fontSize: "12px" }}>
              {[["Hammer", fmt(entry.hammer)], ["Repairs", fmt(entry.repairs)], ["Landed", fmt(entry.landed)], ["Sold For", fmt(entry.sellPrice)], ["Profit", fmt(entry.profit)], ["ROI", entry.roi + "%"]].map(([l, v]) => (
                <div key={l}><div style={{ color: muted, fontSize: "10px", marginBottom: "2px", textTransform: "uppercase" }}>{l}</div><div style={{ color: textSub }}>{v}</div></div>
              ))}
            </div>
            {entry.notes && <div style={{ marginTop: "6px", fontSize: "11px", color: textSub, fontStyle: "italic" }}>{entry.notes.slice(0, 120)}</div>}
          </div>
        );
      })}
    </div>
  );
}
