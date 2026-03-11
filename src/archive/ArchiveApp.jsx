// AI Radar v2 — Archive App (src/archive/ArchiveApp.jsx)
// Reads archive from GitHub Pages - no folder picker needed
import { useState, useEffect, useCallback } from "react";
import NewsCard      from "../components/NewsCard.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { getAvailableDates, getNewsByDate } from "../lib/api.js";
import { typeColor }   from "../lib/utils.js";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function dateKeyToDate(key) {
  const [dd, mm, yyyy] = key.split("-");
  return new Date(`${yyyy}-${mm}-${dd}`);
}

function dateToKey(d) {
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

function formatDateKey(key) {
  const d = dateKeyToDate(key);
  return d.toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
}

export default function ArchiveApp() {
  const [availableDates, setAvailableDates] = useState(new Set());
  const [selectedDate,   setSelectedDate]   = useState(null);
  const [items,          setItems]          = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [datesLoading,   setDatesLoading]   = useState(true);
  const [error,          setError]          = useState(null);
  const [tab,            setTab]            = useState("all");
  const [query,          setQuery]          = useState("");

  const now = new Date();
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  useEffect(() => {
    getAvailableDates()
      .then(dates => { setAvailableDates(new Set(dates)); setDatesLoading(false); })
      .catch(() => { setError("Could not load archive index. Check backend URL in settings."); setDatesLoading(false); });
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    setItems([]);
    getNewsByDate(selectedDate)
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => { setError("Failed to load this date."); setLoading(false); });
  }, [selectedDate]);

  const filtered = items.filter(i => {
    if (tab !== "all" && i.type !== tab) return false;
    if (query) {
      const q = query.toLowerCase();
      return i.title?.toLowerCase().includes(q) || i.source?.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    total:    items.length,
    model:    items.filter(i => i.type === "model").length,
    research: items.filter(i => i.type === "research").length,
    tool:     items.filter(i => i.type === "tool").length,
    news:     items.filter(i => i.type === "news").length,
    high:     items.filter(i => i.priority === "HIGH").length,
  };

  return (
    <div style={{ minHeight:"100vh", background:"#070708", color:"#E8E8E8", fontFamily:"'JetBrains Mono', monospace" }}>

      {/* Header */}
      <header style={{ borderBottom:"1px solid #1a1a1f", padding:"0 20px", position:"sticky", top:0, zIndex:100, background:"rgba(7,7,8,0.95)", backdropFilter:"blur(12px)" }}>
        <div style={{ maxWidth:"1200px", margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:"52px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#00F5FF" strokeWidth="0.75" strokeDasharray="3 2" opacity="0.3"/>
              <circle cx="12" cy="12" r="6"  stroke="#00F5FF" strokeWidth="0.75" opacity="0.55"/>
              <circle cx="12" cy="12" r="3"  stroke="#00F5FF" strokeWidth="0.75" opacity="0.85"/>
              <line x1="12" y1="12" x2="12" y2="2" stroke="#00F5FF" strokeWidth="1.2"/>
              <circle cx="12" cy="12" r="1.5" fill="#00F5FF"/>
            </svg>
            <span style={{ fontWeight:700, fontSize:"13px", letterSpacing:"3px" }}>AI RADAR</span>
            <span style={{ color:"#333", fontSize:"10px", letterSpacing:"1px" }}>/ ARCHIVE</span>
          </div>
          <button onClick={() => window.close()} style={{ background:"none", border:"1px solid #1a1a1f", borderRadius:"2px", color:"#444", cursor:"pointer", padding:"5px 10px", fontSize:"10px", fontFamily:"inherit" }}>
            ✕ CLOSE
          </button>
        </div>
      </header>

      {error && (
        <div style={{ background:"rgba(255,45,85,0.06)", borderBottom:"1px solid rgba(255,45,85,0.2)", padding:"10px 20px", fontSize:"11px", color:"#FF2D55", fontFamily:"monospace" }}>
          ⚠ {error}
        </div>
      )}

      <main style={{ maxWidth:"1200px", margin:"0 auto", padding:"24px 20px 80px", display:"grid", gridTemplateColumns:"300px 1fr", gap:"20px", alignItems:"start" }}>

        {/* LEFT: Calendar */}
        <div style={{ position:"sticky", top:"72px" }}>
          <CalendarPanel
            availableDates={availableDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            loading={datesLoading}
            calYear={calYear} setCalYear={setCalYear}
            calMonth={calMonth} setCalMonth={setCalMonth}
          />
        </div>

        {/* RIGHT: Feed */}
        <div>
          {!selectedDate ? (
            <EmptyPrompt />
          ) : loading ? (
            <LoadingDay />
          ) : (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:"15px", color:"#E8E8E8", letterSpacing:"0.5px" }}>
                    {formatDateKey(selectedDate)}
                  </div>
                  <div style={{ fontSize:"10px", color:"#333", marginTop:"3px", letterSpacing:"1px" }}>
                    {counts.total} ITEMS · {counts.high} BREAKING
                  </div>
                </div>
                <MiniStats counts={counts} />
              </div>
              <FeedPanel items={filtered} total={items.length} tab={tab} onTab={setTab} query={query} onQuery={setQuery} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────

function CalendarPanel({ availableDates, selectedDate, onSelectDate, loading, calYear, setCalYear, calMonth, setCalMonth }) {
  const today    = new Date();
  const todayKey = dateToKey(today);

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); }
    else setCalMonth(m => m-1);
  }
  function nextMonth() {
    const isCurrent = calYear === today.getFullYear() && calMonth === today.getMonth();
    if (isCurrent) return;
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); }
    else setCalMonth(m => m+1);
  }

  const firstDay   = new Date(calYear, calMonth, 1).getDay();
  const daysInMon  = new Date(calYear, calMonth+1, 0).getDate();
  const isCurrent  = calYear === today.getFullYear() && calMonth === today.getMonth();
  const cells      = [...Array(firstDay).fill(null), ...Array.from({length:daysInMon},(_,i)=>i+1)];

  return (
    <div style={{ border:"1px solid #1a1a1f", background:"#0a0a0c", borderRadius:"2px", overflow:"hidden" }}>
      <div style={{ padding:"12px 16px", borderBottom:"1px solid #1a1a1f", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:"10px", color:"#444", letterSpacing:"2px" }}>ARCHIVE CALENDAR</span>
        {loading && <span style={{ fontSize:"9px", color:"#333", letterSpacing:"1px" }}>LOADING…</span>}
      </div>

      {/* Month/Year nav */}
      <div style={{ padding:"10px 12px", borderBottom:"1px solid #111", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"8px" }}>
        <NavBtn onClick={prevMonth}>‹</NavBtn>
        <div style={{ display:"flex", gap:"6px", flex:1, justifyContent:"center" }}>
          <select value={calMonth} onChange={e => setCalMonth(Number(e.target.value))} style={selectStyle}>
            {MONTH_NAMES.map((n,i) => <option key={n} value={i}>{n}</option>)}
          </select>
          <select value={calYear} onChange={e => setCalYear(Number(e.target.value))} style={{...selectStyle,width:"70px"}}>
            {[0,1,2,3].map(i => <option key={i} value={today.getFullYear()-i}>{today.getFullYear()-i}</option>)}
          </select>
        </div>
        <NavBtn onClick={nextMonth} disabled={isCurrent}>›</NavBtn>
      </div>

      {/* Day headers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", padding:"8px 12px 4px", gap:"2px" }}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} style={{ textAlign:"center", fontSize:"9px", color:"#2a2a2a", letterSpacing:"0.5px", padding:"2px 0" }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", padding:"0 12px 12px", gap:"2px" }}>
        {cells.map((day,idx) => {
          if (!day) return <div key={`b${idx}`} />;
          const dd  = String(day).padStart(2,"0");
          const mm  = String(calMonth+1).padStart(2,"0");
          const key = `${dd}-${mm}-${calYear}`;
          const cellDate = new Date(calYear, calMonth, day);
          const isFuture = cellDate > today;
          const isToday  = key === todayKey;
          const hasSaved = availableDates.has(key);
          const isSelected = key === selectedDate;

          let bg="transparent", color="#2a2a2a", border="1px solid transparent", cursor="default";

          if (!isFuture) {
            if (isSelected)    { bg="#00F5FF"; color="#070708"; border="1px solid #00F5FF"; cursor="pointer"; }
            else if (isToday)  { bg="rgba(0,245,255,0.06)"; color="#00F5FF"; border="1px solid rgba(0,245,255,0.25)"; cursor="pointer"; }
            else if (hasSaved) { color="#888"; border="1px solid #1a1a1f"; cursor="pointer"; }
          }

          return (
            <div key={key} onClick={() => !isFuture && onSelectDate(key)}
              style={{ position:"relative", textAlign:"center", padding:"5px 2px 8px", borderRadius:"2px", fontSize:"10px", fontFamily:"monospace", fontWeight: isSelected||isToday ? 700 : 400, background:bg, color, border, cursor, transition:"all 0.1s", userSelect:"none" }}
            >
              {day}
              {!isFuture && hasSaved && !isSelected && (
                <span style={{ position:"absolute", bottom:"2px", left:"50%", transform:"translateX(-50%)", width:"3px", height:"3px", borderRadius:"50%", background:"#00FF88", display:"block" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ padding:"8px 16px 12px", borderTop:"1px solid #111", display:"flex", gap:"12px" }}>
        {[{dot:"#00F5FF",label:"Today"},{dot:"#00FF88",label:"Has data"},{dot:"#1a1a1f",label:"No data"}].map(({dot,label}) => (
          <div key={label} style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"9px", color:"#333" }}>
            <span style={{ width:"5px",height:"5px",borderRadius:"50%",background:dot,display:"inline-block",flexShrink:0 }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function NavBtn({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background:"none", border:"1px solid #1a1a1f", borderRadius:"2px", color:disabled?"#1a1a1f":"#555", cursor:disabled?"default":"pointer", width:"26px",height:"26px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",padding:0,flexShrink:0,fontFamily:"monospace" }}>
      {children}
    </button>
  );
}

const selectStyle = { background:"#111",border:"1px solid #1a1a1f",borderRadius:"2px",color:"#666",padding:"3px 6px",fontSize:"10px",fontFamily:"monospace",outline:"none",cursor:"pointer",flex:1 };

// ── Feed ──────────────────────────────────────────────────────────────────────

function FeedPanel({ items, total, tab, onTab, query, onQuery }) {
  const tabs = [{id:"all",label:"ALL"},{id:"model",label:"MODELS"},{id:"research",label:"RESEARCH"},{id:"tool",label:"TOOLS"},{id:"news",label:"NEWS"}];
  return (
    <div style={{ border:"1px solid #1a1a1f" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #1a1a1f", padding:"0 16px", background:"#0a0a0c" }}>
        <div style={{ display:"flex" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => onTab(t.id)} style={{ background:"none",border:"none",cursor:"pointer",padding:"10px 12px",fontSize:"9px",fontFamily:"monospace",letterSpacing:"1.5px",color:tab===t.id?"#00F5FF":"#333",borderBottom:tab===t.id?"2px solid #00F5FF":"2px solid transparent",transition:"all 0.15s" }}>
              {t.label}
            </button>
          ))}
        </div>
        <input type="text" value={query} onChange={e=>onQuery(e.target.value)} placeholder="SEARCH…" style={{ background:"#111",border:"1px solid #1a1a1f",borderRadius:"2px",color:"#E8E8E8",padding:"4px 8px",fontSize:"9px",fontFamily:"monospace",outline:"none",width:"160px",letterSpacing:"0.5px" }} />
      </div>
      <div style={{ padding:"0 16px" }}>
        {!items.length
          ? <div style={{ padding:"32px 0",textAlign:"center",color:"#1a1a1f",fontSize:"10px",letterSpacing:"1px" }}>{query?"NO RESULTS":"NO ITEMS FOR THIS DATE"}</div>
          : <>{items.map(item => <NewsCard key={item.id} item={item} />)}<div style={{ padding:"12px 0",color:"#1a1a1f",fontSize:"9px",letterSpacing:"1px" }}>SHOWING {items.length} OF {total}</div></>
        }
      </div>
    </div>
  );
}

// ── Misc ──────────────────────────────────────────────────────────────────────

function MiniStats({ counts }) {
  return (
    <div style={{ display:"flex", gap:"6px" }}>
      {[{label:"MODELS",v:counts.model,c:"#00F5FF"},{label:"PAPERS",v:counts.research,c:"#FFD600"},{label:"TOOLS",v:counts.tool,c:"#00FF88"}].map(s => (
        <div key={s.label} style={{ textAlign:"center",padding:"6px 10px",border:"1px solid #1a1a1f",borderRadius:"2px",background:"#0a0a0c" }}>
          <div style={{ fontWeight:700,fontSize:"16px",color:s.c,fontVariantNumeric:"tabular-nums" }}>{s.v}</div>
          <div style={{ fontSize:"8px",color:"#333",letterSpacing:"1px" }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function EmptyPrompt() {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"400px",gap:"12px",border:"1px solid #1a1a1f",color:"#222",fontSize:"10px",letterSpacing:"1.5px" }}>
      📅 SELECT A DATE TO VIEW ARCHIVE
    </div>
  );
}

function LoadingDay() {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"300px",gap:"12px",border:"1px solid #1a1a1f",color:"#333",fontSize:"10px",letterSpacing:"1px" }}>
      LOADING ARCHIVE…
    </div>
  );
}
