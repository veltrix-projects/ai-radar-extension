// AI Radar v2 — Popup (src/popup/PopupApp.jsx)
import { useState, useEffect } from "react";
import { getUnreadCount, markVisited } from "../lib/utils.js";

export default function PopupApp() {
  const [count,   setCount]   = useState(null);
  const [meta,    setMeta]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getUnreadCount(),
      chrome.storage.local.get("backendUrl").then(r => r.backendUrl || "https://YOUR_USERNAME.github.io/ai-radar-backend")
        .then(url => fetch(`${url}/metadata.json`, { cache:"no-store" }).then(r => r.json()).catch(() => null))
    ]).then(([cnt, m]) => {
      setCount(cnt);
      setMeta(m);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function openDashboard() {
    markVisited();
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
    window.close();
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
    window.close();
  }

  return (
    <div style={{
      width:"300px", height:"210px",
      background:"#070708", border:"1px solid #1a1a1f",
      display:"flex", flexDirection:"column",
      fontFamily:"'JetBrains Mono','IBM Plex Mono',monospace",
      WebkitFontSmoothing:"antialiased",
    }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px 0" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <RadarIcon />
          <span style={{ fontWeight:700, fontSize:"11px", letterSpacing:"3px", color:"#E8E8E8" }}>AI RADAR</span>
          <LiveBadge />
        </div>
        <button onClick={openOptions} style={{ background:"none", border:"none", color:"#333", cursor:"pointer", fontSize:"13px", padding:"2px 4px" }} title="Settings">⚙</button>
      </div>

      <div style={{ height:"1px", background:"#1a1a1f", margin:"10px 0 0" }} />

      {/* Body */}
      <div style={{ flex:1, display:"flex", alignItems:"center", padding:"0 14px", gap:"16px" }}>
        {loading ? (
          <span style={{ color:"#333", fontSize:"10px", letterSpacing:"1px" }}>SCANNING…</span>
        ) : (
          <>
            <div>
              <div style={{ fontWeight:700, fontSize:"38px", color:"#00F5FF", lineHeight:1, letterSpacing:"-2px", fontVariantNumeric:"tabular-nums" }}>
                {count ?? 0}
              </div>
              <div style={{ color:"#333", fontSize:"9px", marginTop:"3px", letterSpacing:"1px" }}>
                {count === 1 ? "NEW UPDATE" : "NEW UPDATES"}
              </div>
            </div>
            {meta && (
              <div style={{ borderLeft:"1px solid #1a1a1f", paddingLeft:"16px", display:"flex", flexDirection:"column", gap:"5px" }}>
                <Stat label="TODAY"    value={meta.todayCount   ?? "–"} color="#E8E8E8" />
                <Stat label="BREAKING" value={meta.highCount    ?? "–"} color="#FF2D55" />
                <Stat label="SOURCES"  value={16}                       color="#00FF88" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Trending tags */}
      {meta?.topTrending?.length > 0 && (
        <div style={{ padding:"6px 14px", display:"flex", gap:"5px", flexWrap:"wrap", borderTop:"1px solid #1a1a1f" }}>
          {meta.topTrending.slice(0,3).map(t => (
            <span key={t.tag} style={{ fontSize:"8px", color:"#444", border:"1px solid #1a1a1f", borderRadius:"2px", padding:"1px 5px", letterSpacing:"0.5px" }}>
              {t.tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <button onClick={openDashboard} style={{ background:"#00F5FF", color:"#070708", border:"none", padding:"10px 14px", fontSize:"10px", fontFamily:"inherit", fontWeight:700, letterSpacing:"1.5px", cursor:"pointer", width:"100%", textAlign:"left", flexShrink:0 }}>
        OPEN DASHBOARD →
      </button>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
      <span style={{ fontSize:"12px", fontWeight:700, color, fontVariantNumeric:"tabular-nums" }}>{value}</span>
      <span style={{ fontSize:"8px", color:"#333", letterSpacing:"1px" }}>{label}</span>
    </div>
  );
}

function RadarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="9"   stroke="#00F5FF" strokeWidth="0.75" strokeDasharray="3 2" opacity="0.25"/>
      <circle cx="11" cy="11" r="5.5" stroke="#00F5FF" strokeWidth="0.75" opacity="0.5"/>
      <circle cx="11" cy="11" r="2.5" stroke="#00F5FF" strokeWidth="0.75" opacity="0.85"/>
      <line x1="11" y1="11" x2="11" y2="2" stroke="#00F5FF" strokeWidth="1.2"/>
      <circle cx="11" cy="11" r="1.5" fill="#00F5FF"/>
      <circle cx="16" cy="6.5" r="2"   fill="#00FF88" opacity="0.9"/>
      <circle cx="16" cy="6.5" r="3.5" fill="#00FF88" opacity="0.1"/>
    </svg>
  );
}

function LiveBadge() {
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:"4px", border:"1px solid rgba(0,255,136,0.25)", borderRadius:"2px", padding:"1px 6px", fontSize:"8px", letterSpacing:"1.5px", color:"#00FF88", background:"rgba(0,255,136,0.04)" }}>
      <span style={{ width:"4px", height:"4px", borderRadius:"50%", background:"#00FF88", display:"inline-block" }} />
      LIVE
    </div>
  );
}
