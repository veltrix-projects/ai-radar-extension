// AI Radar v2 — Dashboard (src/dashboard/DashboardApp.jsx)
import { useState, useEffect, useCallback, useRef } from "react";
import NewsCard      from "../components/NewsCard.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { getLatestNews, getBreakingNews, getTrending, getMetadata } from "../lib/api.js";
import { timeAgo } from "../lib/utils.js";

const REFRESH_MS = 5 * 60_000;

export default function DashboardApp() {
  const [items,       setItems]       = useState([]);
  const [breaking,    setBreaking]    = useState([]);
  const [trending,    setTrending]    = useState([]);
  const [metadata,    setMetadata]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tab,         setTab]         = useState("all");
  const [query,       setQuery]       = useState("");
  const [refreshing,  setRefreshing]  = useState(false);
  const intervalRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [news, brk, trnd, meta] = await Promise.all([
        getLatestNews(),
        getBreakingNews(),
        getTrending(),
        getMetadata(),
      ]);
      setItems(news);
      setBreaking(brk);
      setTrending(trnd);
      setMetadata(meta);
      setLastUpdated(Date.now());
      setLoading(false);
    } catch (err) {
      setError("Failed to load news. Check your backend URL in settings.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, REFRESH_MS);
    return () => clearInterval(intervalRef.current);
  }, [load]);

  useEffect(() => {
    const handler = msg => { if (msg.type === "REFRESH") load(); };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function openArchive() {
    chrome.tabs.create({ url: chrome.runtime.getURL("archive.html") });
  }

  const counts = {
    total:    items.length,
    model:    items.filter(i => i.type === "model").length,
    research: items.filter(i => i.type === "research").length,
    tool:     items.filter(i => i.type === "tool").length,
    news:     items.filter(i => i.type === "news").length,
    high:     items.filter(i => i.priority === "HIGH").length,
  };

  const filtered = items.filter(i => {
    if (tab !== "all" && i.type !== tab) return false;
    if (query) {
      const q = query.toLowerCase();
      return i.title?.toLowerCase().includes(q) || i.source?.toLowerCase().includes(q) || i.tags?.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const topModels   = items.filter(i => i.type === "model").slice(0, 6);
  const topResearch = items.filter(i => i.type === "research").slice(0, 6);
  const topTools    = items.filter(i => i.type === "tool").slice(0, 6);

  return (
    <div style={{ minHeight:"100vh", background:"#070708", color:"#E8E8E8", fontFamily:"'IBM Plex Mono', 'JetBrains Mono', monospace" }}>
      <Header lastUpdated={lastUpdated} refreshing={refreshing} onRefresh={handleRefresh} onArchive={openArchive} metadata={metadata} />

      {error && <ErrorBanner message={error} />}

      <main style={{ maxWidth:"1440px", margin:"0 auto", padding:"0 20px 80px" }}>
        {loading ? <LoadingState /> : (
          <>
            {/* Stats bar */}
            <StatsBar counts={counts} metadata={metadata} />

            {/* Breaking news ticker */}
            {breaking.length > 0 && <BreakingTicker items={breaking} />}

            {/* Main grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 280px", gap:"1px", background:"#1a1a1f", marginTop:"1px" }}>

              {/* Models */}
              <Panel>
                <SectionHeader icon="🤖" label="NEW MODELS" count={counts.model} color="#00F5FF" />
                {topModels.map(item => <NewsCard key={item.id} item={item} />)}
                {!topModels.length && <Empty />}
              </Panel>

              {/* Research */}
              <Panel>
                <SectionHeader icon="📄" label="RESEARCH" count={counts.research} color="#FFD600" />
                {topResearch.map(item => <NewsCard key={item.id} item={item} />)}
                {!topResearch.length && <Empty />}
              </Panel>

              {/* Tools */}
              <Panel>
                <SectionHeader icon="🔧" label="AI TOOLS" count={counts.tool} color="#00FF88" />
                {topTools.map(item => <NewsCard key={item.id} item={item} />)}
                {!topTools.length && <Empty />}
              </Panel>

              {/* Sidebar: Trending + Summary */}
              <div style={{ background:"#070708", padding:"16px", borderLeft:"1px solid #1a1a1f" }}>
                <TrendingPanel trending={trending} />
                {metadata?.lastUpdated && <SummaryPanel metadata={metadata} />}
              </div>
            </div>

            {/* Full feed */}
            <FullFeed
              items={filtered} total={items.length}
              tab={tab} onTab={setTab}
              query={query} onQuery={setQuery}
            />
          </>
        )}
      </main>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header({ lastUpdated, refreshing, onRefresh, onArchive, metadata }) {
  return (
    <header style={{
      position:"sticky", top:0, zIndex:100,
      background:"rgba(7,7,8,0.95)", backdropFilter:"blur(12px)",
      borderBottom:"1px solid #1a1a1f", padding:"0 20px",
    }}>
      <div style={{ maxWidth:"1440px", margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:"56px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <RadarLogo />
          <div>
            <div style={{ fontSize:"13px", fontWeight:700, letterSpacing:"3px", color:"#E8E8E8" }}>AI RADAR</div>
            <div style={{ fontSize:"9px", color:"#444", letterSpacing:"1px" }}>v2.0 · 16 SOURCES</div>
          </div>
          <LiveBadge />
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          {lastUpdated && (
            <span style={{ fontSize:"10px", color:"#333", fontFamily:"monospace" }}>
              {timeAgo(lastUpdated)}
            </span>
          )}
          <HeaderBtn onClick={onRefresh} disabled={refreshing} accent>
            {refreshing ? "⟳ SCANNING" : "⟳ REFRESH"}
          </HeaderBtn>
          <HeaderBtn onClick={onArchive}>📅 ARCHIVE</HeaderBtn>
          <HeaderBtn onClick={() => chrome.runtime.openOptionsPage()}>⚙</HeaderBtn>
        </div>
      </div>
    </header>
  );
}

function RadarLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" stroke="#00F5FF" strokeWidth="0.5" strokeDasharray="4 3" opacity="0.25" />
      <circle cx="16" cy="16" r="9"  stroke="#00F5FF" strokeWidth="0.5" opacity="0.5" />
      <circle cx="16" cy="16" r="4"  stroke="#00F5FF" strokeWidth="1" opacity="0.9" />
      <line x1="16" y1="16" x2="16" y2="2" stroke="#00F5FF" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="16" r="2" fill="#00F5FF" />
      <circle cx="23" cy="9"  r="2.5" fill="#00FF88" opacity="0.9" />
      <circle cx="23" cy="9"  r="4.5" fill="#00FF88" opacity="0.1" />
    </svg>
  );
}

function LiveBadge() {
  return (
    <div style={{
      display:"inline-flex", alignItems:"center", gap:"5px",
      border:"1px solid rgba(0,255,136,0.3)", borderRadius:"2px",
      padding:"2px 8px", fontSize:"9px", letterSpacing:"1.5px", color:"#00FF88",
      background:"rgba(0,255,136,0.05)",
    }}>
      <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#00FF88", display:"inline-block", animation:"pulse 2s infinite" }} />
      LIVE
    </div>
  );
}

function HeaderBtn({ onClick, disabled, accent, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: accent ? "rgba(0,245,255,0.08)" : "none",
      border: `1px solid ${accent ? "rgba(0,245,255,0.2)" : "#222"}`,
      borderRadius:"2px", color: disabled ? "#333" : accent ? "#00F5FF" : "#666",
      cursor: disabled ? "default" : "pointer",
      padding:"5px 10px", fontSize:"10px", fontFamily:"inherit", letterSpacing:"0.5px",
      transition:"all 0.15s",
    }}>
      {children}
    </button>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatsBar({ counts, metadata }) {
  const stats = [
    { label:"TOTAL",    value:counts.total,    color:"#E8E8E8" },
    { label:"MODELS",   value:counts.model,    color:"#00F5FF" },
    { label:"RESEARCH", value:counts.research, color:"#FFD600" },
    { label:"TOOLS",    value:counts.tool,     color:"#00FF88" },
    { label:"BREAKING", value:counts.high,     color:"#FF2D55" },
    { label:"SOURCES",  value:16,              color:"#888" },
  ];

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"1px", background:"#1a1a1f", margin:"1px 0 0" }}>
      {stats.map(s => (
        <div key={s.label} style={{ background:"#070708", padding:"14px 16px" }}>
          <div style={{ fontSize:"22px", fontWeight:700, color:s.color, fontVariantNumeric:"tabular-nums", lineHeight:1 }}>
            {s.value}
          </div>
          <div style={{ fontSize:"9px", color:"#333", letterSpacing:"1.5px", marginTop:"4px" }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Breaking ticker ────────────────────────────────────────────────────────────

function BreakingTicker({ items }) {
  return (
    <div style={{
      background:"rgba(255,45,85,0.05)", border:"1px solid rgba(255,45,85,0.15)",
      borderLeft:"3px solid #FF2D55", padding:"10px 16px",
      display:"flex", alignItems:"center", gap:"12px", marginTop:"1px", overflow:"hidden",
    }}>
      <span style={{ fontSize:"9px", color:"#FF2D55", letterSpacing:"2px", fontWeight:700, flexShrink:0 }}>
        ⚡ BREAKING
      </span>
      <div style={{ display:"flex", gap:"24px", overflow:"hidden" }}>
        {items.slice(0,3).map(item => (
          <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize:"11px", color:"#E8E8E8", whiteSpace:"nowrap", textDecoration:"none" }}
          >
            {item.title?.slice(0, 80)}
            <span style={{ color:"#FF2D55", marginLeft:"6px", fontSize:"9px" }}>
              {item.score?.toFixed(1)}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Trending panel ────────────────────────────────────────────────────────────

function TrendingPanel({ trending }) {
  if (!trending?.length) return null;
  return (
    <div style={{ marginBottom:"20px" }}>
      <div style={{ fontSize:"9px", color:"#444", letterSpacing:"2px", marginBottom:"10px" }}>TRENDING TOPICS</div>
      {trending.slice(0,8).map((t, i) => (
        <div key={t.tag} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #111" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ fontSize:"9px", color:"#333", width:"14px" }}>{String(i+1).padStart(2,"0")}</span>
            <span style={{ fontSize:"11px", color:"#888" }}>{t.tag}</span>
          </div>
          <span style={{ fontSize:"9px", color:"#00F5FF", fontVariantNumeric:"tabular-nums" }}>{t.count}</span>
        </div>
      ))}
    </div>
  );
}

// ── Summary panel ─────────────────────────────────────────────────────────────

function SummaryPanel({ metadata }) {
  return (
    <div>
      <div style={{ fontSize:"9px", color:"#444", letterSpacing:"2px", marginBottom:"10px" }}>STATUS</div>
      <div style={{ fontSize:"10px", color:"#555", lineHeight:"1.8" }}>
        <div>Last updated: <span style={{ color:"#888" }}>{timeAgo(new Date(metadata.lastUpdated).getTime())}</span></div>
        <div>Today: <span style={{ color:"#00F5FF" }}>{metadata.todayCount}</span> items</div>
        <div>Breaking: <span style={{ color:"#FF2D55" }}>{metadata.highCount}</span> items</div>
      </div>
    </div>
  );
}

// ── Full feed ─────────────────────────────────────────────────────────────────

function FullFeed({ items, total, tab, onTab, query, onQuery }) {
  const tabs = [
    { id:"all",      label:"ALL"      },
    { id:"model",    label:"MODELS"   },
    { id:"research", label:"RESEARCH" },
    { id:"tool",     label:"TOOLS"    },
    { id:"news",     label:"NEWS"     },
  ];

  return (
    <div style={{ border:"1px solid #1a1a1f", marginTop:"1px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #1a1a1f", padding:"0 16px", background:"#070708" }}>
        <div style={{ display:"flex" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => onTab(t.id)} style={{
              background:"none", border:"none", cursor:"pointer",
              padding:"12px 14px", fontSize:"9px", fontFamily:"inherit", letterSpacing:"1.5px",
              color: tab === t.id ? "#00F5FF" : "#333",
              borderBottom: tab === t.id ? "2px solid #00F5FF" : "2px solid transparent",
              transition:"all 0.15s",
            }}>
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="text" value={query} onChange={e => onQuery(e.target.value)}
          placeholder="SEARCH…"
          style={{
            background:"#0f0f12", border:"1px solid #222", borderRadius:"2px",
            color:"#E8E8E8", padding:"5px 10px", fontSize:"10px",
            fontFamily:"inherit", outline:"none", width:"180px", letterSpacing:"0.5px",
          }}
        />
      </div>
      <div style={{ padding:"0 16px" }}>
        {!items.length ? (
          <div style={{ padding:"32px 0", textAlign:"center", color:"#222", fontSize:"10px", letterSpacing:"1px" }}>
            {query ? "NO RESULTS" : "NO ITEMS YET"}
          </div>
        ) : (
          <>
            {items.map(item => <NewsCard key={item.id} item={item} />)}
            <div style={{ padding:"12px 0", color:"#222", fontSize:"9px", letterSpacing:"1px" }}>
              SHOWING {items.length} OF {total} ITEMS
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Misc ──────────────────────────────────────────────────────────────────────

function Panel({ children }) {
  return <div style={{ background:"#070708", padding:"16px", minHeight:"280px" }}>{children}</div>;
}

function Empty() {
  return <div style={{ color:"#222", fontSize:"10px", padding:"8px 0", letterSpacing:"1px" }}>NO ITEMS YET</div>;
}

function ErrorBanner({ message }) {
  return (
    <div style={{ background:"rgba(255,45,85,0.06)", borderBottom:"1px solid rgba(255,45,85,0.2)", padding:"10px 20px", fontSize:"11px", color:"#FF2D55", fontFamily:"monospace" }}>
      ⚠ {message}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"400px", gap:"16px" }}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="radar-spin">
        <circle cx="24" cy="24" r="20" stroke="#1a1a1f" strokeWidth="1" />
        <circle cx="24" cy="24" r="13" stroke="#1a1a1f" strokeWidth="1" />
        <circle cx="24" cy="24" r="7"  stroke="#00F5FF" strokeWidth="1" opacity="0.6" />
        <line x1="24" y1="24" x2="24" y2="4" stroke="#00F5FF" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="24" cy="24" r="2"  fill="#00F5FF" />
      </svg>
      <div style={{ color:"#333", fontSize:"10px", letterSpacing:"2px" }}>SCANNING 16 SOURCES…</div>
    </div>
  );
}
