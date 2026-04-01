import { useState } from "react";

const theme = {
  bg: "linear-gradient(170deg, #0a1628 0%, #0d2847 40%, #0f3460 70%, #1a5276 100%)",
  accent: "#00E5CC",
  accent2: "#FFD93D",
  accent3: "#FF6B8A",
  accent4: "#A78BFA",
  surface: "rgba(0,229,204,0.08)",
  border: "rgba(0,229,204,0.15)",
  text: "#E8F4F0",
  textMuted: "rgba(232,244,240,0.5)",
  glow: "0 0 40px rgba(0,229,204,0.3)",
};

const TABS = ["Overview", "Quests", "Achievements"];

const Star = ({ filled, size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#FFD93D" : "rgba(255,255,255,0.12)"}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ProgressBar = ({ value, max, color, height = 6, glow = false, showLabel = false }) => (
  <div style={{ position: "relative" }}>
    <div style={{ width: "100%", height, borderRadius: height / 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <div
        style={{
          width: `${Math.min((value / max) * 100, 100)}%`,
          height: "100%",
          borderRadius: height / 2,
          background: `linear-gradient(90deg, ${color}CC, ${color})`,
          boxShadow: glow ? `0 0 12px ${color}60` : "none",
          transition: "width 0.6s ease",
        }}
      />
    </div>
    {showLabel && (
      <div style={{ position: "absolute", right: 0, top: -14, fontSize: 9, color: `${color}CC`, fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700 }}>
        {value}/{max}
      </div>
    )}
  </div>
);

const StatusBar = () => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px 4px", fontSize: 11, fontWeight: 600, color: theme.text, fontFamily: "'DM Sans', sans-serif" }}>
    <span>9:41</span>
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <span style={{ fontSize: 9 }}>●●●●○</span>
      <span style={{ fontSize: 10 }}>⚡87%</span>
    </div>
  </div>
);

const PatternOverlay = () => (
  <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0.035, pointerEvents: "none" }}>
    <defs>
      <pattern id="poly" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M20 0 L40 20 L20 40 L0 20Z" fill="none" stroke="#00E5CC" strokeWidth="0.5" />
        <circle cx="20" cy="20" r="3" fill="none" stroke="#00E5CC" strokeWidth="0.5" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#poly)" />
  </svg>
);

// ========== UNLOCK MODAL ==========
const UnlockModal = ({ zone, onClose }) => {
  const basePrice = zone.ethPrice;
  const discount = Math.floor((zone.currentStars / zone.starCost) * 100);
  const discountedPrice = (basePrice * (1 - discount / 100)).toFixed(4);
  const starPercent = Math.floor((zone.currentStars / zone.starCost) * 100);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "relative",
          background: "linear-gradient(180deg, #0f2a50, #0a1628)",
          borderRadius: "20px 20px 0 0",
          border: `1px solid ${theme.border}`,
          borderBottom: "none",
          padding: "20px 18px 28px",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* Zone Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 32 }}>{zone.icon}</span>
          <div>
            <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.2em", color: theme.accent, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
              Unlock Zone
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: theme.text, fontFamily: "'Chakra Petch', sans-serif" }}>
              {zone.name}
            </div>
            <div style={{ fontSize: 9, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>
              10 levels · Boss battle · Endless mode
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: theme.border, marginBottom: 14 }} />

        {/* TWO PATHS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {/* Path 1: Stars */}
          <div
            style={{
              flex: 1,
              background: `${theme.accent2}08`,
              border: `1px solid ${theme.accent2}20`,
              borderRadius: 14,
              padding: "12px 10px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${theme.accent2}60, transparent)` }} />
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: theme.accent2, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, marginBottom: 8 }}>
              Earn It
            </div>
            <div style={{ fontSize: 24, marginBottom: 2 }}>⭐</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: theme.accent2, fontFamily: "'Chakra Petch', sans-serif" }}>
              {zone.starCost}
            </div>
            <div style={{ fontSize: 8, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
              stars required
            </div>

            {/* Star Progress */}
            <div style={{ width: "100%", marginBottom: 4 }}>
              <ProgressBar value={zone.currentStars} max={zone.starCost} color={theme.accent2} height={5} glow />
            </div>
            <div style={{ fontSize: 9, color: theme.accent2, fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700 }}>
              {zone.currentStars}/{zone.starCost}
            </div>
            <div style={{ fontSize: 7, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>
              {zone.starCost - zone.currentStars} more to go
            </div>

            {zone.currentStars >= zone.starCost ? (
              <button
                style={{
                  marginTop: 8,
                  width: "100%",
                  padding: "8px",
                  borderRadius: 8,
                  border: "none",
                  background: theme.accent2,
                  color: "#0a1628",
                  fontSize: 10,
                  fontWeight: 800,
                  fontFamily: "'Chakra Petch', sans-serif",
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                }}
              >
                UNLOCK FREE
              </button>
            ) : (
              <div style={{ marginTop: 8, fontSize: 8, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", textAlign: "center" }}>
                Keep playing to earn stars
              </div>
            )}
          </div>

          {/* OR Divider */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 2px" }}>
            <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.08)" }} />
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: theme.textMuted,
                fontFamily: "'DM Sans', sans-serif",
                padding: "6px 0",
              }}
            >
              OR
            </div>
            <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Path 2: Pay */}
          <div
            style={{
              flex: 1,
              background: `${theme.accent}08`,
              border: `1px solid ${theme.accent}20`,
              borderRadius: 14,
              padding: "12px 10px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${theme.accent}60, transparent)` }} />
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: theme.accent, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, marginBottom: 8 }}>
              Skip Ahead
            </div>
            <div style={{ fontSize: 24, marginBottom: 2 }}>◆</div>

            {discount > 0 ? (
              <>
                <div style={{ fontSize: 11, color: theme.textMuted, fontFamily: "'Chakra Petch', sans-serif", textDecoration: "line-through", fontWeight: 600 }}>
                  {basePrice} ETH
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: theme.accent, fontFamily: "'Chakra Petch', sans-serif" }}>
                  {discountedPrice}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 20, fontWeight: 900, color: theme.accent, fontFamily: "'Chakra Petch', sans-serif" }}>
                {basePrice}
              </div>
            )}
            <div style={{ fontSize: 8, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>
              ETH
            </div>

            {/* Discount Badge */}
            {discount > 0 && (
              <div
                style={{
                  background: `linear-gradient(135deg, ${theme.accent3}, ${theme.accent3}CC)`,
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 800,
                  fontFamily: "'Chakra Petch', sans-serif",
                  padding: "3px 8px",
                  borderRadius: 6,
                  marginBottom: 4,
                  letterSpacing: "0.03em",
                }}
              >
                {discount}% OFF
              </div>
            )}

            <div style={{ fontSize: 7, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", textAlign: "center", marginBottom: 6, lineHeight: 1.4 }}>
              {discount > 0
                ? `Your ${zone.currentStars}★ saved you ${discount}%`
                : "Price drops as you earn stars"
              }
            </div>

            <button
              style={{
                marginTop: "auto",
                width: "100%",
                padding: "8px",
                borderRadius: 8,
                border: "none",
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}CC)`,
                color: "#0a1628",
                fontSize: 10,
                fontWeight: 800,
                fontFamily: "'Chakra Petch', sans-serif",
                cursor: "pointer",
                letterSpacing: "0.05em",
                boxShadow: `0 0 16px ${theme.accent}40`,
              }}
            >
              BUY NOW
            </button>
          </div>
        </div>

        {/* Discount Scale Visual */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: `1px solid rgba(255,255,255,0.05)`,
            borderRadius: 10,
            padding: "10px 12px",
          }}
        >
          <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.12em", color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginBottom: 8 }}>
            Star Discount Scale
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 36, marginBottom: 6 }}>
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((pct, i) => {
              const isActive = starPercent >= pct;
              const isCurrent = starPercent >= pct && starPercent < pct + 10;
              return (
                <div
                  key={pct}
                  style={{
                    flex: 1,
                    height: `${30 + i * 7}%`,
                    borderRadius: 2,
                    background: isActive
                      ? isCurrent
                        ? `linear-gradient(180deg, ${theme.accent3}, ${theme.accent3}88)`
                        : `${theme.accent}50`
                      : "rgba(255,255,255,0.05)",
                    transition: "all 0.3s",
                    position: "relative",
                  }}
                >
                  {isCurrent && (
                    <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 7, color: theme.accent3, fontWeight: 700, fontFamily: "'Chakra Petch', sans-serif", whiteSpace: "nowrap" }}>
                      YOU
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 7, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif" }}>0★ = Full price</span>
            <span style={{ fontSize: 7, color: theme.accent, fontFamily: "'DM Sans', sans-serif" }}>90%★ = 90% off</span>
          </div>
          <div style={{ textAlign: "center", marginTop: 6, fontSize: 8, color: theme.accent2, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
            100% stars = FREE unlock · Every star counts toward a discount
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== OVERVIEW TAB ==========
const OverviewTab = ({ onUnlock }) => {
  const stats = [
    { label: "Games", value: "142" },
    { label: "Best Combo", value: "x7" },
    { label: "Lines", value: "2,841" },
    { label: "Bosses", value: "4/10" },
  ];

  const zones = [
    { id: 1, name: "Polynesian", icon: "🌊", stars: 28, max: 30, unlocked: true, cleared: true, free: true },
    { id: 5, name: "Feudal Japan", icon: "⛩️", stars: 15, max: 30, unlocked: true, cleared: false },
    { id: 7, name: "Ancient Persia", icon: "🕌", stars: 8, max: 30, unlocked: true, cleared: false },
    { id: 2, name: "Ancient Egypt", icon: "🏛️", stars: 0, max: 30, unlocked: false, starCost: 120, ethPrice: 0.015, currentStars: 51 },
    { id: 3, name: "Norse", icon: "❄️", stars: 0, max: 30, unlocked: false, starCost: 200, ethPrice: 0.02, currentStars: 51 },
  ];

  const totalStars = zones.reduce((s, z) => s + z.stars, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "8px 4px", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: theme.text, fontFamily: "'Chakra Petch', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 8, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Zone Progress */}
      <div>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
          <span>Zone Progress</span>
          <span style={{ color: theme.accent2 }}>★ {totalStars} total</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {zones.map((z) => (
            <div
              key={z.id}
              style={{
                background: z.unlocked ? theme.surface : "rgba(255,255,255,0.02)",
                border: `1px solid ${z.unlocked ? theme.border : "rgba(255,255,255,0.04)"}`,
                borderRadius: 10,
                padding: "8px 10px",
                opacity: z.unlocked ? 1 : 0.7,
                cursor: !z.unlocked ? "pointer" : "default",
              }}
              onClick={() => !z.unlocked && onUnlock(z)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: z.unlocked ? 5 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{z.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: theme.text, fontFamily: "'Chakra Petch', sans-serif" }}>
                    {z.name}
                  </span>
                  {z.cleared && (
                    <span style={{ fontSize: 7, fontWeight: 700, color: theme.accent, background: `${theme.accent}15`, padding: "2px 5px", borderRadius: 4, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em" }}>
                      CLEARED
                    </span>
                  )}
                  {z.free && (
                    <span style={{ fontSize: 7, fontWeight: 700, color: theme.accent2, background: `${theme.accent2}15`, padding: "2px 5px", borderRadius: 4, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em" }}>
                      FREE
                    </span>
                  )}
                </div>
                {z.unlocked ? (
                  <span style={{ fontSize: 9, color: theme.accent2, fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700 }}>
                    {z.stars}/{z.max}
                  </span>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 8, color: theme.accent2, fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700 }}>
                      {z.starCost}★
                    </span>
                    <span style={{ fontSize: 7, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif" }}>or</span>
                    <span style={{ fontSize: 8, color: theme.accent, fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700 }}>
                      {z.ethPrice} ETH
                    </span>
                  </div>
                )}
              </div>
              {z.unlocked && <ProgressBar value={z.stars} max={z.max} color={theme.accent} height={4} />}
              {!z.unlocked && (
                <div style={{ marginTop: 6 }}>
                  <ProgressBar value={z.currentStars} max={z.starCost} color={theme.accent2} height={3} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                    <span style={{ fontSize: 7, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
                      {z.currentStars}/{z.starCost}★ · {Math.floor((z.currentStars / z.starCost) * 100)}% discount available
                    </span>
                    <span style={{ fontSize: 7, color: theme.accent, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                      Tap to unlock →
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginBottom: 8 }}>
          Recent Activity
        </div>
        {[
          { icon: "⭐", text: "3-starred Level 6 in Polynesian", time: "2h ago" },
          { icon: "👹", text: "Defeated Tidecaller boss", time: "5h ago" },
          { icon: "🏆", text: "New best: x7 combo streak", time: "1d ago" },
        ].map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < 2 ? `1px solid ${theme.border}` : "none" }}>
            <span style={{ fontSize: 14, width: 22, textAlign: "center" }}>{a.icon}</span>
            <div style={{ flex: 1, fontSize: 10, color: theme.text, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{a.text}</div>
            <span style={{ fontSize: 8, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif" }}>{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========== QUESTS TAB ==========
const QuestsTab = ({ onUnlock }) => {
  const nextZone = { name: "Ancient Egypt", icon: "🏛️", starCost: 120, currentStars: 51, ethPrice: 0.015 };
  const discount = Math.floor((nextZone.currentStars / nextZone.starCost) * 100);
  const discountedPrice = (nextZone.ethPrice * (1 - discount / 100)).toFixed(4);

  const QuestCard = ({ q, compact }) => (
    <div style={{ background: q.done ? `${q.color}08` : theme.surface, border: `1px solid ${q.done ? `${q.color}25` : theme.border}`, borderRadius: 10, padding: compact ? "8px 10px" : "10px 12px", opacity: q.done ? 0.7 : 1 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <span style={{ fontSize: compact ? 16 : 18, marginTop: 1 }}>{q.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: q.done ? q.color : theme.text, fontFamily: "'Chakra Petch', sans-serif", textDecoration: q.done ? "line-through" : "none" }}>
              {q.title}
            </span>
            {q.done ? (
              <span style={{ fontSize: 8, fontWeight: 700, color: theme.accent, background: `${theme.accent}15`, padding: "2px 6px", borderRadius: 4, fontFamily: "'DM Sans', sans-serif" }}>CLAIMED</span>
            ) : (
              <span style={{ fontSize: 9, fontWeight: 700, color: theme.accent2, fontFamily: "'Chakra Petch', sans-serif" }}>+{q.reward}★</span>
            )}
          </div>
          <div style={{ fontSize: 9, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 2, marginBottom: 5 }}>{q.desc}</div>
          {!q.done && <ProgressBar value={q.progress} max={q.max} color={q.color} height={4} showLabel />}
        </div>
      </div>
    </div>
  );

  const dailyQuests = [
    { title: "Line Breaker", desc: "Clear 20 lines", progress: 14, max: 20, reward: 3, icon: "📏", color: theme.accent },
    { title: "Combo Starter", desc: "Get a x3 combo", progress: 1, max: 1, reward: 2, icon: "🔥", color: theme.accent2, done: true },
    { title: "Daily Player", desc: "Complete the daily challenge", progress: 0, max: 1, reward: 5, icon: "⚡", color: theme.accent3 },
  ];
  const weeklyQuests = [
    { title: "Zone Explorer", desc: "Complete 3 different zone levels", progress: 2, max: 3, reward: 10, icon: "🗺️", color: theme.accent4 },
    { title: "Perfectionist", desc: "3-star any 5 levels", progress: 3, max: 5, reward: 15, icon: "⭐", color: theme.accent2 },
    { title: "Boss Hunter", desc: "Defeat 2 bosses", progress: 1, max: 2, reward: 12, icon: "👹", color: theme.accent3 },
  ];
  const milestones = [
    { title: "First Steps", desc: "Complete your first zone", progress: 1, max: 1, reward: 30, icon: "🌟", color: theme.accent, done: true },
    { title: "Star Collector", desc: "Collect 100 total stars", progress: 51, max: 100, reward: 40, icon: "✨", color: theme.accent2 },
    { title: "Endless Legend", desc: "Reach Level 20 in Endless", progress: 14, max: 20, reward: 50, icon: "♾️", color: theme.accent4 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Next Unlock Teaser — Dual Path */}
      <div
        onClick={() => onUnlock(nextZone)}
        style={{
          background: "linear-gradient(135deg, rgba(255,215,0,0.06), rgba(0,229,204,0.04))",
          border: "1px solid rgba(255,215,0,0.15)",
          borderRadius: 14,
          padding: "12px 12px 10px",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>{nextZone.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.15em", color: theme.accent2, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
              Next Unlock
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: theme.text, fontFamily: "'Chakra Petch', sans-serif" }}>
              {nextZone.name}
            </div>
          </div>
        </div>

        {/* Dual Path Mini */}
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {/* Star Path */}
          <div style={{ flex: 1, background: `${theme.accent2}10`, borderRadius: 8, padding: "6px 8px" }}>
            <div style={{ fontSize: 7, color: theme.accent2, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginBottom: 4 }}>
              ★ EARN IT
            </div>
            <ProgressBar value={nextZone.currentStars} max={nextZone.starCost} color={theme.accent2} height={4} glow />
            <div style={{ fontSize: 8, color: theme.text, fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, marginTop: 3 }}>
              {nextZone.currentStars}/{nextZone.starCost}★
            </div>
            <div style={{ fontSize: 7, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
              {nextZone.starCost - nextZone.currentStars} stars to go
            </div>
          </div>
          {/* Pay Path */}
          <div style={{ flex: 1, background: `${theme.accent}10`, borderRadius: 8, padding: "6px 8px" }}>
            <div style={{ fontSize: 7, color: theme.accent, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginBottom: 4 }}>
              ◆ SKIP AHEAD
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: theme.accent, fontFamily: "'Chakra Petch', sans-serif" }}>
                {discountedPrice} ETH
              </span>
            </div>
            {discount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <span style={{ fontSize: 8, color: theme.textMuted, fontFamily: "'Chakra Petch', sans-serif", textDecoration: "line-through" }}>
                  {nextZone.ethPrice}
                </span>
                <span style={{ fontSize: 7, fontWeight: 800, color: theme.accent3, background: `${theme.accent3}20`, padding: "1px 4px", borderRadius: 3, fontFamily: "'Chakra Petch', sans-serif" }}>
                  {discount}% OFF
                </span>
              </div>
            )}
            <div style={{ fontSize: 7, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>
              Stars lower the price
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 8, color: theme.accent, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
          Tap for details →
        </div>
      </div>

      {/* Daily Quests */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Daily Quests</div>
          <div style={{ fontSize: 8, color: theme.accent, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, background: theme.surface, padding: "2px 6px", borderRadius: 4, border: `1px solid ${theme.border}` }}>Resets in 14:23</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {dailyQuests.map((q, i) => <QuestCard key={i} q={q} compact />)}
        </div>
      </div>

      {/* Weekly */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Weekly Quests</div>
          <div style={{ fontSize: 8, color: theme.accent4, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, background: `${theme.accent4}10`, padding: "2px 6px", borderRadius: 4, border: `1px solid ${theme.accent4}20` }}>4 days left</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {weeklyQuests.map((q, i) => <QuestCard key={i} q={q} compact />)}
        </div>
      </div>

      {/* Milestones */}
      <div>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginBottom: 8 }}>Milestones</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {milestones.map((q, i) => <QuestCard key={i} q={q} />)}
        </div>
      </div>
    </div>
  );
};

// ========== ACHIEVEMENTS TAB ==========
const AchievementsTab = () => {
  const rarityColors = { Common: "rgba(255,255,255,0.5)", Rare: "#4DA6FF", Epic: "#A78BFA", Legendary: "#FFD93D" };
  const categories = [
    {
      name: "Combat",
      achievements: [
        { name: "Boss Slayer", desc: "Defeat your first boss", icon: "⚔️", unlocked: true, rarity: "Common" },
        { name: "Tidecaller's Bane", desc: "Defeat Tidecaller under 10 moves", icon: "🌊", unlocked: true, rarity: "Rare" },
        { name: "Flawless Victory", desc: "3-star a boss level", icon: "💎", unlocked: false, rarity: "Epic" },
        { name: "Conqueror", desc: "Defeat all 10 bosses", icon: "👑", unlocked: false, rarity: "Legendary" },
      ],
    },
    {
      name: "Mastery",
      achievements: [
        { name: "Combo Initiate", desc: "Get a x3 combo", icon: "🔥", unlocked: true, rarity: "Common" },
        { name: "Chain Master", desc: "Get a x5 combo", icon: "⛓️", unlocked: true, rarity: "Rare" },
        { name: "Cascade King", desc: "Get a x10 combo", icon: "🌋", unlocked: false, rarity: "Epic" },
        { name: "The One", desc: "Clear entire grid in one move", icon: "✦", unlocked: false, rarity: "Legendary" },
      ],
    },
    {
      name: "Explorer",
      achievements: [
        { name: "First Voyage", desc: "Complete Polynesian zone", icon: "🗺️", unlocked: true, rarity: "Common" },
        { name: "World Traveler", desc: "Unlock 5 zones", icon: "🌍", unlocked: false, rarity: "Rare" },
        { name: "Cartographer", desc: "3-star every level in a zone", icon: "📜", unlocked: false, rarity: "Epic" },
        { name: "Eternal Wanderer", desc: "Unlock all 10 zones", icon: "🌌", unlocked: false, rarity: "Legendary" },
      ],
    },
  ];

  const totalUnlocked = categories.reduce((s, c) => s + c.achievements.filter((a) => a.unlocked).length, 0);
  const total = categories.reduce((s, c) => s + c.achievements.length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: theme.text, fontFamily: "'Chakra Petch', sans-serif" }}>{totalUnlocked}/{total}</div>
          <div style={{ fontSize: 9, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif" }}>Achievements unlocked</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {Object.entries(rarityColors).map(([name, color]) => {
            const count = categories.reduce((s, c) => s + c.achievements.filter((a) => a.unlocked && a.rarity === name).length, 0);
            return (
              <div key={name} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color, fontFamily: "'Chakra Petch', sans-serif" }}>{count}</div>
                <div style={{ fontSize: 7, color: `${color}99`, fontFamily: "'DM Sans', sans-serif" }}>{name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {categories.map((cat) => (
        <div key={cat.name}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
            <span>{cat.name}</span>
            <span style={{ color: theme.accent }}>{cat.achievements.filter((a) => a.unlocked).length}/{cat.achievements.length}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {cat.achievements.map((a) => (
              <div
                key={a.name}
                style={{
                  background: a.unlocked ? `${rarityColors[a.rarity]}08` : "rgba(255,255,255,0.015)",
                  border: `1px solid ${a.unlocked ? `${rarityColors[a.rarity]}20` : "rgba(255,255,255,0.04)"}`,
                  borderRadius: 10,
                  padding: "8px 8px",
                  opacity: a.unlocked ? 1 : 0.4,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {a.unlocked && <div style={{ position: "absolute", top: 0, right: 0, width: 30, height: 30, background: `radial-gradient(circle at top right, ${rarityColors[a.rarity]}15, transparent)` }} />}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, filter: a.unlocked ? "none" : "grayscale(1)" }}>{a.icon}</span>
                  <div style={{ fontSize: 5.5, fontWeight: 700, color: rarityColors[a.rarity], fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.1em" }}>{a.rarity}</div>
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: a.unlocked ? theme.text : theme.textMuted, fontFamily: "'Chakra Petch', sans-serif", lineHeight: 1.2 }}>{a.name}</div>
                <div style={{ fontSize: 7.5, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 2, lineHeight: 1.3 }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ========== MAIN ==========
export default function PlayerProfile() {
  const [tab, setTab] = useState(0);
  const [unlockZone, setUnlockZone] = useState(null);

  const xp = 2840;
  const xpMax = 4000;
  const level = 14;

  return (
    <div style={{ minHeight: "100vh", background: "#080810", fontFamily: "'DM Sans', 'Chakra Petch', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Chakra Petch', sans-serif", letterSpacing: "0.08em", background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Player Profile
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif", marginTop: 3 }}>
          Dual Unlock Model · Earn Stars OR Pay · Sliding Discount
        </div>
      </div>

      {/* Phone Frame */}
      <div style={{ width: 310, height: 660, borderRadius: 34, background: theme.bg, position: "relative", overflow: "hidden", boxShadow: `0 20px 60px rgba(0,0,0,0.5), ${theme.glow}`, border: "2px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column" }}>
        <PatternOverlay />
        <div style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", width: 80, height: 22, borderRadius: 11, background: "#000", zIndex: 10 }} />

        <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", zIndex: 1 }}>
          <StatusBar />

          {/* Header */}
          <div style={{ padding: "4px 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, color: theme.accent, cursor: "pointer" }}>←</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: theme.text, fontFamily: "'Chakra Petch', sans-serif" }}>Profile</span>
          </div>

          {/* Player Card */}
          <div style={{ padding: "10px 16px" }}>
            <div style={{ background: `linear-gradient(135deg, ${theme.accent}10, ${theme.accent2}08)`, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ position: "relative" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#0a1628", fontFamily: "'Chakra Petch', sans-serif", boxShadow: theme.glow }}>ZK</div>
                  <div style={{ position: "absolute", bottom: -4, right: -4, width: 20, height: 20, borderRadius: 6, background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: "#0a1628", fontFamily: "'Chakra Petch', sans-serif", border: "2px solid #0d2847" }}>{level}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: theme.text, fontFamily: "'Chakra Petch', sans-serif" }}>player.stark</div>
                  <div style={{ fontSize: 9, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>Level {level} · Puzzle Adept</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Star filled size={14} />
                    <span style={{ fontSize: 18, fontWeight: 900, color: theme.accent2, fontFamily: "'Chakra Petch', sans-serif" }}>51</span>
                  </div>
                  <div style={{ fontSize: 8, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif" }}>total stars</div>
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 8, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif" }}>Level {level}</span>
                  <span style={{ fontSize: 8, color: theme.accent, fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700 }}>{xp.toLocaleString()} / {xpMax.toLocaleString()} XP</span>
                </div>
                <ProgressBar value={xp} max={xpMax} color={theme.accent} height={6} glow />
                <div style={{ fontSize: 7, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 3 }}>{(xpMax - xp).toLocaleString()} XP to Level {level + 1} · "Puzzle Master"</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", padding: "0 16px", marginBottom: 2 }}>
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)} style={{ flex: 1, textAlign: "center", padding: "8px 0", fontSize: 11, fontWeight: tab === i ? 700 : 500, fontFamily: "'DM Sans', sans-serif", color: tab === i ? theme.accent : theme.textMuted, background: "none", border: "none", borderBottom: `2px solid ${tab === i ? theme.accent : "transparent"}`, cursor: "pointer", transition: "all 0.2s" }}>
                {t}
                {i === 1 && <span style={{ marginLeft: 4, fontSize: 8, fontWeight: 700, color: "#0a1628", background: theme.accent3, padding: "1px 4px", borderRadius: 4, verticalAlign: "middle" }}>3</span>}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: "auto", padding: "10px 16px 16px" }}>
            {tab === 0 && <OverviewTab onUnlock={setUnlockZone} />}
            {tab === 1 && <QuestsTab onUnlock={setUnlockZone} />}
            {tab === 2 && <AchievementsTab />}
          </div>

          {/* Bottom Tab Bar */}
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "6px 0 14px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)", borderTop: `1px solid ${theme.border}` }}>
            {[
              { id: "home", icon: "⬡", label: "Home" },
              { id: "map", icon: "◈", label: "Map" },
              { id: "profile", icon: "◉", label: "Profile", active: true },
              { id: "ranks", icon: "◆", label: "Ranks" },
              { id: "settings", icon: "⚙", label: "Settings" },
            ].map((t) => (
              <div key={t.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: t.active ? theme.accent : theme.textMuted, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>{t.icon}</span>
                <span style={{ fontWeight: t.active ? 700 : 400, letterSpacing: "0.03em", fontSize: 9 }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Unlock Modal */}
        {unlockZone && <UnlockModal zone={unlockZone} onClose={() => setUnlockZone(null)} />}
      </div>

      {/* Design Notes */}
      <div style={{ maxWidth: 560, marginTop: 28, padding: "0 8px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.3)", fontFamily: "'Chakra Petch', sans-serif", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
          Dual Unlock — Design Rationale
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { title: "Sliding Discount", desc: "Every star earned reduces the ETH price proportionally. At 42% stars, you get 42% off. This rewards grinding without punishing paying — and creates a 'sunk cost' pull toward buying.", color: theme.accent3 },
            { title: "100% Stars = Free", desc: "Reaching full star count unlocks for free. This keeps hardcore F2P players engaged long-term and gives them a real goal. The grind is steep enough that most will convert to paying at 40-60%.", color: theme.accent2 },
            { title: "Visible Both Paths", desc: "The Quests tab always shows BOTH unlock paths side by side. Players constantly see their discount growing — even if they're not thinking about buying, the price dropping creates urgency.", color: theme.accent },
            { title: "Conversion Funnel", desc: "Quest rewards → star progress → discount grows → price drops → impulse buy. The modal shows the exact savings. Players feel rewarded for playing even if they end up paying.", color: theme.accent4 },
          ].map((n) => (
            <div key={n.title} style={{ background: `${n.color}08`, border: `1px solid ${n.color}18`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: n.color, fontFamily: "'Chakra Petch', sans-serif", marginBottom: 4 }}>{n.title}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{n.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
