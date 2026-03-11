// AI Radar v2 — SectionHeader (src/components/SectionHeader.jsx)
export default function SectionHeader({ icon, label, count, color = "#888" }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: "10px", paddingBottom: "8px",
      borderBottom: "1px solid #1a1a1f",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {icon && <span style={{ fontSize: "11px" }}>{icon}</span>}
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700, fontSize: "10px",
          letterSpacing: "2px", color,
        }}>
          {label}
        </span>
      </div>
      {count !== undefined && (
        <span style={{
          fontFamily: "monospace", fontSize: "10px",
          color: "#333", fontVariantNumeric: "tabular-nums",
        }}>
          {count}
        </span>
      )}
    </div>
  );
}
