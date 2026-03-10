// AI Radar v2 — NewsCard (src/components/NewsCard.jsx)
import { timeAgo, typeLabel, typeColor, priorityColor, sourceShortName } from "../lib/utils.js";

export default function NewsCard({ item, compact = false }) {
  if (!item) return null;

  const tColor = typeColor(item.type);
  const pColor = priorityColor(item.priority);
  const hasScore = typeof item.score === "number" && item.score > 0;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        padding: compact ? "7px 0" : "10px 0",
        borderBottom: "1px solid #111",
        cursor: "pointer",
        textDecoration: "none",
        transition: "background 0.1s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#0d0d10"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>

        {/* Score bar — vertical accent on left */}
        {hasScore && !compact && (
          <div style={{
            width: "2px", alignSelf: "stretch", flexShrink: 0,
            background: item.priority === "HIGH"   ? "#FF2D55" :
                        item.priority === "MEDIUM" ? "#FF6B00" : "#2a2a2a",
            borderRadius: "1px", marginTop: "2px",
            minHeight: "32px",
          }} />
        )}

        {/* Type badge */}
        <span style={{
          flexShrink: 0, marginTop: "2px",
          display: "inline-flex", alignItems: "center",
          padding: "1px 5px",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "9px", fontWeight: 600, letterSpacing: "0.5px",
          borderRadius: "2px",
          color: tColor,
          background: `${tColor}14`,
          border: `1px solid ${tColor}33`,
        }}>
          {typeLabel(item.type)}
        </span>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: compact ? "11px" : "12px",
            color: "#D0D0D0",
            lineHeight: "1.45",
            marginBottom: "3px",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: compact ? 1 : 2,
            WebkitBoxOrient: "vertical",
            fontFamily: "'IBM Plex Mono', 'JetBrains Mono', monospace",
          }}>
            {item.title}
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            fontSize: "9px", color: "#444",
            fontFamily: "monospace",
          }}>
            <span style={{ color: "#555" }}>{item.sourceIcon} {sourceShortName(item.source)}</span>
            <span style={{ color: "#222" }}>·</span>
            <span>{timeAgo(item.timestamp || item.fetchedAt)}</span>

            {/* AI Score badge */}
            {hasScore && (
              <>
                <span style={{ color: "#222" }}>·</span>
                <span style={{
                  color: pColor, fontWeight: 600, fontSize: "9px",
                  fontFamily: "monospace",
                }}>
                  {item.score.toFixed(1)}
                </span>
              </>
            )}

            {/* Sentiment dot */}
            {item.sentiment && item.sentiment !== "neutral" && (
              <span style={{
                width: "5px", height: "5px", borderRadius: "50%", display: "inline-block",
                background: item.sentiment === "positive" ? "#00FF88" : "#FF2D55",
                flexShrink: 0,
              }} />
            )}

            {/* Tags - show first 2 */}
            {!compact && item.tags?.slice(0, 2).map(tag => (
              <span key={tag} style={{
                color: "#333", fontSize: "8px", fontFamily: "monospace",
                padding: "0px 4px", border: "1px solid #1a1a1f", borderRadius: "2px",
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </a>
  );
}
