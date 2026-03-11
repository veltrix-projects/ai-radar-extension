// AI Radar v2 — Options (src/options/OptionsApp.jsx)
import { useState, useEffect } from "react";

const DEFAULT_BACKEND = "https://YOUR_USERNAME.github.io/ai-radar-backend";

const SOURCES = [
  { name:"Hacker News",             active:true  },
  { name:"HuggingFace Papers",      active:true  },
  { name:"HuggingFace Models",      active:true  },
  { name:"ArXiv AI/ML/NLP",         active:true  },
  { name:"GitHub Trending AI",      active:true  },
  { name:"Reddit r/LocalLLaMA",     active:true  },
  { name:"Reddit r/MachineLearning",active:true  },
  { name:"Papers With Code",        active:true  },
  { name:"OpenAI Blog",             active:true  },
  { name:"Anthropic Blog",          active:true  },
  { name:"Google DeepMind",         active:true  },
  { name:"Meta AI Blog",            active:true  },
  { name:"NVIDIA Blog",             active:true  },
  { name:"VentureBeat AI",          active:true  },
  { name:"TechCrunch AI",           active:true  },
  { name:"Product Hunt AI",         active:false, note:"Optional API key in backend secrets" },
];

export default function OptionsApp() {
  const [backendUrl,    setBackendUrl]    = useState(DEFAULT_BACKEND);
  const [notifications, setNotifications] = useState(true);
  const [newTab,        setNewTab]        = useState(false);
  const [toast,         setToast]         = useState({ msg:"", show:false });
  const [testing,       setTesting]       = useState(false);
  const [testResult,    setTestResult]    = useState(null);
  const [clearConfirm,  setClearConfirm]  = useState(false);

  useEffect(() => {
    chrome.storage.local.get(["backendUrl","notificationsEnabled","newTabOverride"], r => {
      if (r.backendUrl)              setBackendUrl(r.backendUrl);
      if (r.notificationsEnabled != null) setNotifications(r.notificationsEnabled);
      if (r.newTabOverride != null)  setNewTab(r.newTabOverride);
    });
  }, []);

  function showToast(msg, ok = true) {
    setToast({ msg, show:true, ok });
    setTimeout(() => setToast(t => ({...t,show:false})), 3000);
  }

  async function testBackend() {
    setTesting(true);
    setTestResult(null);
    try {
      const url = backendUrl.replace(/\/$/, "");
      const res = await fetch(`${url}/metadata.json`, { cache:"no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const meta = await res.json();
      setTestResult({ ok:true, msg:`✓ Connected · ${meta.todayCount || "?"} items today · Last updated ${meta.lastUpdated ? new Date(meta.lastUpdated).toLocaleTimeString() : "unknown"}` });
    } catch (err) {
      setTestResult({ ok:false, msg:`✗ Failed: ${err.message}` });
    }
    setTesting(false);
  }

  function save() {
    chrome.storage.local.set({
      backendUrl:           backendUrl.trim().replace(/\/$/, ""),
      notificationsEnabled: notifications,
      newTabOverride:       newTab,
    }, () => showToast("✓ Settings saved"));
  }

  async function clearData() {
    if (!clearConfirm) { setClearConfirm(true); setTimeout(() => setClearConfirm(false), 4000); return; }
    await chrome.storage.local.remove(["lastVisit","lastNotifTime","notifiedIds"]);
    setClearConfirm(false);
    showToast("✓ Cache cleared");
  }

  return (
    <div style={{ minHeight:"100vh", background:"#070708", color:"#E8E8E8", fontFamily:"'JetBrains Mono','IBM Plex Mono',monospace", WebkitFontSmoothing:"antialiased" }}>

      {/* Header */}
      <div style={{ borderBottom:"1px solid #1a1a1f", padding:"0 40px", display:"flex", alignItems:"center", height:"56px", gap:"10px" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#00F5FF" strokeWidth="0.75" strokeDasharray="3 2" opacity="0.3"/>
          <circle cx="12" cy="12" r="6"  stroke="#00F5FF" strokeWidth="0.75" opacity="0.55"/>
          <circle cx="12" cy="12" r="3"  stroke="#00F5FF" strokeWidth="0.75" opacity="0.85"/>
          <line x1="12" y1="12" x2="12" y2="2" stroke="#00F5FF" strokeWidth="1.2"/>
          <circle cx="12" cy="12" r="1.5" fill="#00F5FF"/>
        </svg>
        <span style={{ fontWeight:700, fontSize:"13px", letterSpacing:"3px" }}>AI RADAR</span>
        <span style={{ color:"#333", fontSize:"10px", letterSpacing:"1px" }}>/ SETTINGS</span>
      </div>

      <div style={{ maxWidth:"600px", margin:"0 auto", padding:"40px 24px" }}>

        {/* Backend URL */}
        <Section label="BACKEND CONFIGURATION">
          <Field label="GITHUB PAGES URL" desc={<>Your backend repo URL. Format: <code style={{color:"#00F5FF",fontSize:"9px"}}>https://USERNAME.github.io/ai-radar-backend</code></>}>
            <input
              type="text" value={backendUrl}
              onChange={e => setBackendUrl(e.target.value)}
              placeholder="https://username.github.io/ai-radar-backend"
              style={inputStyle}
              spellCheck={false}
            />
          </Field>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginTop:"8px" }}>
            <Btn onClick={testBackend} disabled={testing} accent>
              {testing ? "TESTING…" : "TEST CONNECTION"}
            </Btn>
            {testResult && (
              <span style={{ fontSize:"10px", color:testResult.ok?"#00FF88":"#FF2D55", fontFamily:"monospace" }}>
                {testResult.msg}
              </span>
            )}
          </div>
        </Section>

        {/* Behavior */}
        <Section label="BEHAVIOR">
          <ToggleRow
            label="DESKTOP NOTIFICATIONS"
            desc="Show Chrome notifications for breaking AI news (score 9+)."
            value={notifications} onChange={setNotifications}
          />
          <ToggleRow
            label="NEW TAB OVERRIDE"
            desc="Open AI Radar dashboard when opening a new tab."
            value={newTab} onChange={setNewTab}
          />
        </Section>

        {/* Data */}
        <Section label="CACHE">
          <Field label="CLEAR VISIT HISTORY" desc="Resets unread badge count and notification history.">
            <Btn onClick={clearData} danger>
              {clearConfirm ? "⚠ CONFIRM — CLEAR?" : "CLEAR CACHE"}
            </Btn>
          </Field>
        </Section>

        {/* Sources */}
        <Section label={`ACTIVE SOURCES · ${SOURCES.filter(s=>s.active).length} OF ${SOURCES.length}`}>
          <div>
            {SOURCES.map(s => (
              <div key={s.name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #0f0f12" }}>
                <span style={{ fontSize:"10px", color:"#666" }}>{s.name}</span>
                <span style={{ fontSize:"9px", letterSpacing:"1px", color:s.active?"#00FF88":"#FF6B00" }}>
                  {s.active ? "● ACTIVE" : "○ OPTIONAL"}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:"10px", fontSize:"9px", color:"#333", lineHeight:"1.6" }}>
            All sources are fetched by the backend every 5 minutes. Product Hunt requires an API key in your backend's GitHub Secrets.
          </div>
        </Section>

        {/* Save */}
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:"8px" }}>
          <button onClick={save} style={{ background:"#00F5FF", color:"#070708", border:"none", borderRadius:"2px", padding:"10px 24px", fontSize:"11px", fontFamily:"inherit", fontWeight:700, letterSpacing:"1px", cursor:"pointer" }}>
            SAVE SETTINGS
          </button>
        </div>

        <div style={{ marginTop:"32px", color:"#1a1a1f", fontSize:"9px", letterSpacing:"1px", textAlign:"center" }}>
          AI RADAR v2.0.0 · MANIFEST V3 · GITHUB PAGES BACKEND
        </div>
      </div>

      {/* Toast */}
      <div style={{ position:"fixed", bottom:"24px", right:"24px", background:"#111", border:"1px solid #1a1a1f", borderRadius:"2px", padding:"10px 16px", fontSize:"10px", color:"#00FF88", fontFamily:"monospace", letterSpacing:"0.5px", opacity:toast.show?1:0, transform:toast.show?"translateY(0)":"translateY(8px)", transition:"all 0.2s", pointerEvents:"none" }}>
        {toast.msg}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Section({ label, children }) {
  return (
    <div style={{ marginBottom:"20px", border:"1px solid #1a1a1f", borderRadius:"2px", overflow:"hidden" }}>
      <div style={{ padding:"10px 16px", borderBottom:"1px solid #1a1a1f", background:"#0a0a0c" }}>
        <span style={{ fontSize:"9px", letterSpacing:"2px", color:"#444" }}>{label}</span>
      </div>
      <div style={{ padding:"16px" }}>{children}</div>
    </div>
  );
}

function Field({ label, desc, children }) {
  return (
    <div style={{ marginBottom:"14px" }}>
      <div style={{ fontSize:"9px", color:"#555", letterSpacing:"1px", marginBottom:"4px" }}>{label}</div>
      {desc && <div style={{ fontSize:"9px", color:"#333", lineHeight:"1.6", marginBottom:"8px" }}>{desc}</div>}
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"16px", marginBottom:"14px" }}>
      <div>
        <div style={{ fontSize:"10px", color:"#666", letterSpacing:"0.5px" }}>{label}</div>
        <div style={{ fontSize:"9px", color:"#333", lineHeight:"1.5", marginTop:"2px" }}>{desc}</div>
      </div>
      <div onClick={() => onChange(!value)} style={{ width:"32px", height:"18px", borderRadius:"9px", position:"relative", background:value?"#00F5FF":"#1a1a1f", cursor:"pointer", transition:"background 0.2s", flexShrink:0 }}>
        <div style={{ position:"absolute", top:"2px", left:value?"16px":"2px", width:"14px", height:"14px", borderRadius:"50%", background:value?"#070708":"#333", transition:"left 0.2s" }} />
      </div>
    </div>
  );
}

function Btn({ onClick, disabled, accent, danger, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: accent ? "rgba(0,245,255,0.08)" : "none",
      border: `1px solid ${accent ? "rgba(0,245,255,0.25)" : danger ? "rgba(255,45,85,0.3)" : "#1a1a1f"}`,
      borderRadius:"2px",
      color: disabled ? "#333" : accent ? "#00F5FF" : danger ? "#FF2D55" : "#666",
      cursor: disabled ? "default" : "pointer",
      padding:"7px 14px", fontSize:"10px", fontFamily:"inherit", letterSpacing:"0.5px",
    }}>
      {children}
    </button>
  );
}

const inputStyle = {
  background:"#0f0f12", border:"1px solid #1a1a1f", borderRadius:"2px",
  color:"#E8E8E8", padding:"8px 12px", fontSize:"10px",
  fontFamily:"monospace", width:"100%", outline:"none", letterSpacing:"0.5px",
};
