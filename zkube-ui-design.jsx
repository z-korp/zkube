import { useState, useEffect, useRef } from "react";

const SCREENS = [
  "Home",
  "Map",
  "Play",
  "Boss",
  "Leaderboard",
  "Daily",
  "Settings",
];

// Block colors for the puzzle grid
const BLOCK_COLORS = {
  1: "#00E5CC", // teal
  2: "#FF6B8A", // coral
  3: "#FFD93D", // gold
  4: "#A78BFA", // purple
  0: "transparent",
};

const THEMES = {
  polynesian: {
    name: "Polynesian",
    bg: "linear-gradient(170deg, #0a1628 0%, #0d2847 40%, #0f3460 70%, #1a5276 100%)",
    accent: "#00E5CC",
    accent2: "#FFD93D",
    surface: "rgba(0,229,204,0.08)",
    border: "rgba(0,229,204,0.15)",
    text: "#E8F4F0",
    textMuted: "rgba(232,244,240,0.5)",
    glow: "0 0 40px rgba(0,229,204,0.3)",
    pattern: "polynesian",
  },
  japan: {
    name: "Feudal Japan",
    bg: "linear-gradient(170deg, #1a0a0a 0%, #2d0f0f 40%, #3d1515 70%, #4a1a1a 100%)",
    accent: "#FF3B3B",
    accent2: "#FFD700",
    surface: "rgba(255,59,59,0.08)",
    border: "rgba(255,59,59,0.15)",
    text: "#F5E6D3",
    textMuted: "rgba(245,230,211,0.5)",
    glow: "0 0 40px rgba(255,59,59,0.3)",
    pattern: "japan",
  },
  persia: {
    name: "Ancient Persia",
    bg: "linear-gradient(170deg, #0a0a2e 0%, #0f1a4a 40%, #162060 70%, #1a2870 100%)",
    accent: "#4DA6FF",
    accent2: "#FFB347",
    surface: "rgba(77,166,255,0.08)",
    border: "rgba(77,166,255,0.15)",
    text: "#E8ECF5",
    textMuted: "rgba(232,236,245,0.5)",
    glow: "0 0 40px rgba(77,166,255,0.3)",
    pattern: "persia",
  },
};

// Decorative pattern SVGs
const PatternOverlay = ({ theme }) => {
  if (theme === "polynesian") {
    return (
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.04,
          pointerEvents: "none",
        }}
      >
        <defs>
          <pattern id="poly" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20 0 L40 20 L20 40 L0 20Z" fill="none" stroke="#00E5CC" strokeWidth="0.5" />
            <circle cx="20" cy="20" r="3" fill="none" stroke="#00E5CC" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#poly)" />
      </svg>
    );
  }
  if (theme === "japan") {
    return (
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.04,
          pointerEvents: "none",
        }}
      >
        <defs>
          <pattern id="jp" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="28" fill="none" stroke="#FF3B3B" strokeWidth="0.5" />
            <line x1="0" y1="30" x2="60" y2="30" stroke="#FF3B3B" strokeWidth="0.3" />
            <line x1="30" y1="0" x2="30" y2="60" stroke="#FF3B3B" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#jp)" />
      </svg>
    );
  }
  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        opacity: 0.04,
        pointerEvents: "none",
      }}
    >
      <defs>
        <pattern id="pe" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M0 25 Q12.5 0 25 25 Q37.5 50 50 25" fill="none" stroke="#4DA6FF" strokeWidth="0.5" />
          <circle cx="25" cy="25" r="2" fill="#4DA6FF" fillOpacity="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pe)" />
    </svg>
  );
};

// Star component
const Star = ({ filled, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#FFD93D" : "rgba(255,255,255,0.15)"}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

// Bottom Tab Bar
const TabBar = ({ active, theme, onTab }) => {
  const tabs = [
    { id: "home", icon: "⬡", label: "Home" },
    { id: "map", icon: "◈", label: "Map" },
    { id: "ranks", icon: "◆", label: "Ranks" },
    { id: "settings", icon: "⚙", label: "Settings" },
  ];
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "6px 0 14px",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(20px)",
        borderTop: `1px solid ${theme.border}`,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onTab(t.id)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: active === t.id ? theme.accent : theme.textMuted,
            fontSize: 10,
            fontFamily: "'DM Sans', sans-serif",
            transition: "color 0.2s",
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>{t.icon}</span>
          <span style={{ fontWeight: active === t.id ? 700 : 400, letterSpacing: "0.03em" }}>
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
};

// Status bar
const StatusBar = ({ theme }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 16px 4px",
      fontSize: 11,
      fontWeight: 600,
      color: theme.text,
      fontFamily: "'DM Sans', sans-serif",
    }}
  >
    <span>9:41</span>
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <span style={{ fontSize: 9 }}>●●●●○</span>
      <span style={{ fontSize: 10 }}>⚡87%</span>
    </div>
  </div>
);

// ========== SCREENS ==========

const HomeScreen = ({ theme, onTab }) => {
  const zones = [
    { id: 1, name: "Polynesian", icon: "🌊", unlocked: true, stars: 24 },
    { id: 5, name: "Feudal Japan", icon: "⛩️", unlocked: true, stars: 15 },
    { id: 7, name: "Ancient Persia", icon: "🕌", unlocked: true, stars: 8 },
    { id: 2, name: "Ancient Egypt", icon: "🏛️", unlocked: false, stars: 0 },
  ];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <StatusBar theme={theme} />
      <div style={{ flex: 1, padding: "0 16px", overflow: "auto" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              fontFamily: "'Chakra Petch', sans-serif",
              color: theme.text,
              letterSpacing: "0.08em",
              textShadow: theme.glow,
            }}
          >
            zKube
          </div>
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.3em",
              color: theme.accent,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            On-Chain Puzzle
          </div>
        </div>

        {/* Player Card */}
        <div
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 900,
                color: "#0a1628",
                fontFamily: "'Chakra Petch', sans-serif",
              }}
            >
              ZK
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: theme.text,
                  fontFamily: "'Chakra Petch', sans-serif",
                }}
              >
                player.stark
              </div>
              <div style={{ fontSize: 10, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
                47 ★ collected
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: 9,
              color: theme.accent,
              background: `${theme.accent}15`,
              padding: "4px 8px",
              borderRadius: 6,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            CONNECTED
          </div>
        </div>

        {/* Daily Challenge Banner */}
        <div
          style={{
            background: `linear-gradient(135deg, ${theme.accent}20, ${theme.accent2}15)`,
            border: `1px solid ${theme.accent}30`,
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: theme.accent2,
                fontFamily: "'Chakra Petch', sans-serif",
                letterSpacing: "0.05em",
              }}
            >
              ⚡ DAILY CHALLENGE
            </div>
            <div style={{ fontSize: 10, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
              24h remaining · 142 players
            </div>
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#0a1628",
              background: theme.accent2,
              padding: "6px 12px",
              borderRadius: 8,
              fontFamily: "'Chakra Petch', sans-serif",
            }}
          >
            PLAY
          </div>
        </div>

        {/* Zone Select */}
        <div
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: theme.textMuted,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          Select Zone
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {zones.map((z) => (
            <div
              key={z.id}
              style={{
                background: z.unlocked ? theme.surface : "rgba(255,255,255,0.02)",
                border: `1px solid ${z.unlocked ? theme.border : "rgba(255,255,255,0.05)"}`,
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                opacity: z.unlocked ? 1 : 0.4,
                cursor: z.unlocked ? "pointer" : "default",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{z.icon}</span>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: theme.text,
                      fontFamily: "'Chakra Petch', sans-serif",
                    }}
                  >
                    {z.name}
                  </div>
                  <div style={{ display: "flex", gap: 2, marginTop: 3 }}>
                    {[...Array(3)].map((_, i) => (
                      <Star key={i} filled={z.stars > i * 10} size={10} />
                    ))}
                    <span
                      style={{
                        fontSize: 9,
                        color: theme.textMuted,
                        marginLeft: 4,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {z.stars}/30
                    </span>
                  </div>
                </div>
              </div>
              {z.unlocked ? (
                <div
                  style={{
                    fontSize: 16,
                    color: theme.accent,
                  }}
                >
                  →
                </div>
              ) : (
                <span style={{ fontSize: 14 }}>🔒</span>
              )}
            </div>
          ))}
        </div>

        {/* New Game Button */}
        <div style={{ padding: "16px 0 8px" }}>
          <button
            onClick={() => onTab("map")}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}CC)`,
              color: "#0a1628",
              fontSize: 14,
              fontWeight: 800,
              fontFamily: "'Chakra Petch', sans-serif",
              letterSpacing: "0.1em",
              cursor: "pointer",
              boxShadow: theme.glow,
            }}
          >
            NEW GAME
          </button>
        </div>
      </div>
      <TabBar active="home" theme={theme} onTab={onTab} />
    </div>
  );
};

const MapScreen = ({ theme, onTab }) => {
  const levels = [
    { n: 1, stars: 3, done: true },
    { n: 2, stars: 3, done: true },
    { n: 3, stars: 2, done: true },
    { n: 4, stars: 3, done: true },
    { n: 5, stars: 1, done: true },
    { n: 6, stars: 2, done: true },
    { n: 7, stars: 0, done: false, current: true },
    { n: 8, stars: 0, done: false },
    { n: 9, stars: 0, done: false },
    { n: 10, stars: 0, done: false, boss: true },
  ];
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <StatusBar theme={theme} />
      {/* Header */}
      <div style={{ padding: "8px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: theme.text,
            fontFamily: "'Chakra Petch', sans-serif",
          }}
        >
          🌊 Polynesian
        </div>
        <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Star filled size={12} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: theme.accent2,
              fontFamily: "'DM Sans', sans-serif",
              marginLeft: 3,
            }}
          >
            14/30
          </span>
        </div>
      </div>

      {/* Map Path */}
      <div style={{ flex: 1, padding: "12px 20px", overflow: "auto", position: "relative" }}>
        <svg
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          viewBox="0 0 280 520"
          preserveAspectRatio="none"
        >
          <path
            d="M140 480 C80 440, 200 400, 140 360 C80 320, 200 280, 140 240 C80 200, 200 160, 140 120 C100 80, 180 60, 140 30"
            fill="none"
            stroke={theme.border}
            strokeWidth="2"
            strokeDasharray="6 4"
          />
        </svg>

        <div style={{ display: "flex", flexDirection: "column-reverse", gap: 6, position: "relative" }}>
          {levels.map((l, i) => {
            const offset = Math.sin(i * 0.8) * 40;
            return (
              <div
                key={l.n}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginLeft: `calc(50% + ${offset}px - 24px)`,
                }}
              >
                <div
                  style={{
                    width: l.boss ? 54 : 46,
                    height: l.boss ? 54 : 46,
                    borderRadius: l.boss ? 14 : "50%",
                    background: l.current
                      ? `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`
                      : l.done
                        ? theme.surface
                        : "rgba(255,255,255,0.03)",
                    border: l.current
                      ? `2px solid ${theme.accent}`
                      : l.done
                        ? `1px solid ${theme.border}`
                        : "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: l.current ? theme.glow : "none",
                    position: "relative",
                  }}
                >
                  {l.boss ? (
                    <span style={{ fontSize: 18 }}>👹</span>
                  ) : (
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: l.current ? "#0a1628" : l.done ? theme.text : theme.textMuted,
                        fontFamily: "'Chakra Petch', sans-serif",
                      }}
                    >
                      {l.n}
                    </span>
                  )}
                  {l.current && (
                    <div
                      style={{
                        position: "absolute",
                        top: -8,
                        fontSize: 10,
                        color: theme.accent,
                        fontWeight: 700,
                        fontFamily: "'DM Sans', sans-serif",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ▼
                    </div>
                  )}
                </div>
                {l.done && (
                  <div style={{ display: "flex", gap: 1, marginTop: 3 }}>
                    {[1, 2, 3].map((s) => (
                      <Star key={s} filled={s <= l.stars} size={9} />
                    ))}
                  </div>
                )}
                {l.boss && !l.done && (
                  <div
                    style={{
                      fontSize: 8,
                      color: theme.accent,
                      fontWeight: 700,
                      fontFamily: "'Chakra Petch', sans-serif",
                      marginTop: 3,
                      letterSpacing: "0.1em",
                    }}
                  >
                    BOSS
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <TabBar active="map" theme={theme} onTab={onTab} />
    </div>
  );
};

const PlayScreen = ({ theme }) => {
  // Generate a sample grid
  const grid = [];
  for (let r = 0; r < 10; r++) {
    const row = [];
    for (let c = 0; c < 8; c++) {
      if (r < 4) row.push(0);
      else row.push(r > 7 ? [1, 2, 3, 4][Math.floor((c + r) % 4)] : Math.random() > 0.35 ? [1, 2, 3, 4][Math.floor((c * r + c) % 4)] : 0);
    }
    grid.push(row);
  }

  // Highlight a complete line
  const completeLine = 8;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <StatusBar theme={theme} />
      {/* Game HUD */}
      <div
        style={{
          padding: "4px 14px 8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: theme.accent,
              fontFamily: "'Chakra Petch', sans-serif",
              letterSpacing: "0.1em",
              background: theme.surface,
              padding: "3px 8px",
              borderRadius: 6,
              border: `1px solid ${theme.border}`,
            }}
          >
            LV.7
          </div>
          <div style={{ display: "flex", gap: 1 }}>
            <Star filled size={11} />
            <Star filled size={11} />
            <Star filled={false} size={11} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif" }}>MOVES</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: theme.text, fontFamily: "'Chakra Petch', sans-serif" }}>
              6/15
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif" }}>SCORE</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: theme.accent2, fontFamily: "'Chakra Petch', sans-serif" }}>
              2,840
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif" }}>COMBO</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: theme.accent, fontFamily: "'Chakra Petch', sans-serif" }}>
              x3
            </div>
          </div>
        </div>
      </div>

      {/* Constraint Bar */}
      <div style={{ padding: "0 14px 6px" }}>
        <div
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12 }}>🔥</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: theme.text, fontFamily: "'DM Sans', sans-serif" }}>
              Clear 3 combo lines
            </span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 800, color: theme.accent, fontFamily: "'Chakra Petch', sans-serif" }}>
            2/3
          </span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "0 8px" }}>
        <div
          style={{
            background: "rgba(0,0,0,0.3)",
            borderRadius: 12,
            padding: 6,
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2 }}>
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const isComplete = r === completeLine;
                return (
                  <div
                    key={`${r}-${c}`}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      background:
                        cell === 0
                          ? "rgba(255,255,255,0.02)"
                          : isComplete
                            ? `${BLOCK_COLORS[cell]}DD`
                            : BLOCK_COLORS[cell] + "99",
                      border:
                        cell === 0
                          ? "1px solid rgba(255,255,255,0.03)"
                          : `1px solid ${BLOCK_COLORS[cell]}40`,
                      boxShadow:
                        isComplete && cell !== 0
                          ? `0 0 8px ${BLOCK_COLORS[cell]}60, inset 0 1px 0 rgba(255,255,255,0.2)`
                          : cell !== 0
                            ? "inset 0 1px 0 rgba(255,255,255,0.15)"
                            : "none",
                      transition: "all 0.2s",
                    }}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Next Row Preview */}
      <div style={{ padding: "6px 14px 4px", display: "flex", justifyContent: "center", gap: 4, alignItems: "center" }}>
        <span style={{ fontSize: 9, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginRight: 6 }}>
          NEXT
        </span>
        {[2, 0, 3, 1, 0, 4, 2, 1].map((b, i) => (
          <div
            key={i}
            style={{
              width: 18,
              height: 18,
              borderRadius: 3,
              background: b === 0 ? "rgba(255,255,255,0.04)" : BLOCK_COLORS[b] + "80",
              border: b === 0 ? "1px solid rgba(255,255,255,0.04)" : `1px solid ${BLOCK_COLORS[b]}30`,
            }}
          />
        ))}
      </div>

      {/* Swipe hint */}
      <div
        style={{
          textAlign: "center",
          padding: "6px 0 16px",
          fontSize: 10,
          color: theme.textMuted,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        ← Swipe rows to align blocks →
      </div>
    </div>
  );
};

const BossScreen = ({ theme }) => {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <StatusBar theme={theme} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
        {/* Boss Reveal */}
        <div
          style={{
            fontSize: 64,
            marginBottom: 8,
            filter: "drop-shadow(0 0 20px rgba(255,59,59,0.5))",
          }}
        >
          👹
        </div>
        <div
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.3em",
            color: theme.accent,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
          }}
        >
          Level 10 · Boss
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: theme.text,
            fontFamily: "'Chakra Petch', sans-serif",
            marginTop: 4,
            textShadow: theme.glow,
          }}
        >
          TIDECALLER
        </div>
        <div
          style={{
            fontSize: 11,
            color: theme.textMuted,
            fontFamily: "'DM Sans', sans-serif",
            marginTop: 6,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Master of the deep currents
        </div>

        {/* Boss Constraints */}
        <div style={{ width: "100%", marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              background: "rgba(255,59,59,0.08)",
              border: "1px solid rgba(255,59,59,0.2)",
              borderRadius: 10,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>🔥</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: theme.text, fontFamily: "'Chakra Petch', sans-serif" }}>
                Clear 5 combo lines
              </div>
              <div style={{ fontSize: 9, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>
                Consecutive line clears count as combos
              </div>
            </div>
          </div>
          <div
            style={{
              background: "rgba(255,59,59,0.08)",
              border: "1px solid rgba(255,59,59,0.2)",
              borderRadius: 10,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>📊</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: theme.text, fontFamily: "'Chakra Petch', sans-serif" }}>
                Keep grid below 60%
              </div>
              <div style={{ fontSize: 9, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>
                Don't let blocks stack too high
              </div>
            </div>
          </div>
        </div>

        <button
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            border: "none",
            background: `linear-gradient(135deg, #FF3B3B, #FF6B3B)`,
            color: "#fff",
            fontSize: 14,
            fontWeight: 800,
            fontFamily: "'Chakra Petch', sans-serif",
            letterSpacing: "0.1em",
            cursor: "pointer",
            marginTop: 20,
            boxShadow: "0 0 30px rgba(255,59,59,0.4)",
          }}
        >
          FIGHT BOSS
        </button>
      </div>
    </div>
  );
};

const LeaderboardScreen = ({ theme, onTab }) => {
  const players = [
    { rank: 1, name: "0xWave.stark", score: 12450, stars: 28 },
    { rank: 2, name: "kubemaster.stark", score: 11200, stars: 26 },
    { rank: 3, name: "player.stark", score: 9840, stars: 24, you: true },
    { rank: 4, name: "puzzler.stark", score: 8320, stars: 21 },
    { rank: 5, name: "blocky.stark", score: 7100, stars: 19 },
    { rank: 6, name: "0xCairo.stark", score: 6540, stars: 17 },
    { rank: 7, name: "chainpuz.stark", score: 5890, stars: 15 },
  ];
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <StatusBar theme={theme} />
      <div style={{ padding: "8px 16px 0" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: theme.text, fontFamily: "'Chakra Petch', sans-serif" }}>
          Leaderboard
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginTop: 10, marginBottom: 10 }}>
          {["Zone", "Endless", "Daily"].map((t, i) => (
            <div
              key={t}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "7px 0",
                fontSize: 11,
                fontWeight: i === 0 ? 700 : 500,
                fontFamily: "'DM Sans', sans-serif",
                color: i === 0 ? theme.accent : theme.textMuted,
                borderBottom: `2px solid ${i === 0 ? theme.accent : "transparent"}`,
                cursor: "pointer",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Player List */}
      <div style={{ flex: 1, padding: "0 16px", overflow: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {players.map((p) => (
            <div
              key={p.rank}
              style={{
                background: p.you ? `${theme.accent}12` : theme.surface,
                border: `1px solid ${p.you ? theme.accent + "30" : theme.border}`,
                borderRadius: 10,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 28,
                  textAlign: "center",
                  fontSize: p.rank <= 3 ? 16 : 13,
                  fontWeight: 800,
                  color: p.rank <= 3 ? theme.accent2 : theme.textMuted,
                  fontFamily: "'Chakra Petch', sans-serif",
                }}
              >
                {p.rank <= 3 ? medals[p.rank - 1] : p.rank}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: p.you ? theme.accent : theme.text,
                    fontFamily: "'Chakra Petch', sans-serif",
                  }}
                >
                  {p.name} {p.you && <span style={{ fontSize: 9, opacity: 0.7 }}>(you)</span>}
                </div>
                <div style={{ display: "flex", gap: 1, marginTop: 2 }}>
                  {[1, 2, 3].map((s) => (
                    <Star key={s} filled={p.stars >= s * 10} size={8} />
                  ))}
                  <span style={{ fontSize: 8, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginLeft: 3 }}>
                    {p.stars}★
                  </span>
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: theme.text,
                  fontFamily: "'Chakra Petch', sans-serif",
                }}
              >
                {p.score.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      <TabBar active="ranks" theme={theme} onTab={onTab} />
    </div>
  );
};

const DailyScreen = ({ theme }) => {
  const grid = [];
  for (let r = 0; r < 10; r++) {
    const row = [];
    for (let c = 0; c < 8; c++) {
      row.push(r < 5 ? 0 : [0, 1, 2, 3, 4][(c + r * 3) % 5]);
    }
    grid.push(row);
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <StatusBar theme={theme} />
      <div style={{ padding: "8px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: theme.text, fontFamily: "'Chakra Petch', sans-serif" }}>
            ⚡ Daily Challenge
          </div>
          <div style={{ fontSize: 10, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
            Apr 1, 2026 · Same seed for all
          </div>
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: theme.accent,
            background: theme.surface,
            padding: "4px 10px",
            borderRadius: 6,
            border: `1px solid ${theme.border}`,
            fontFamily: "'Chakra Petch', sans-serif",
          }}
        >
          14:23:09
        </div>
      </div>

      {/* Today's Leaderboard Mini */}
      <div style={{ padding: "10px 16px" }}>
        <div
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 10,
            padding: "10px 12px",
          }}
        >
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
            Today's Top 3
          </div>
          {[
            { r: 1, n: "0xWave", s: 4200 },
            { r: 2, n: "kubemstr", s: 3890 },
            { r: 3, n: "puzzler", s: 3410 },
          ].map((p) => (
            <div
              key={p.r}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "4px 0",
                borderTop: p.r > 1 ? `1px solid ${theme.border}` : "none",
              }}
            >
              <span style={{ fontSize: 11, color: theme.text, fontFamily: "'DM Sans', sans-serif" }}>
                {["🥇", "🥈", "🥉"][p.r - 1]} {p.n}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: theme.accent2, fontFamily: "'Chakra Petch', sans-serif" }}>
                {p.s.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Grid Preview */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              background: "rgba(0,0,0,0.3)",
              borderRadius: 10,
              padding: 5,
              border: `1px solid ${theme.border}`,
              display: "inline-block",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 1.5 }}>
              {grid.flat().map((cell, i) => (
                <div
                  key={i}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 3,
                    background: cell === 0 ? "rgba(255,255,255,0.02)" : BLOCK_COLORS[cell] + "88",
                    border: cell === 0 ? "1px solid rgba(255,255,255,0.03)" : `1px solid ${BLOCK_COLORS[cell]}30`,
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{ fontSize: 10, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 8 }}>
            142 players today
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px 20px" }}>
        <button
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            border: "none",
            background: `linear-gradient(135deg, ${theme.accent2}, ${theme.accent2}CC)`,
            color: "#0a1628",
            fontSize: 14,
            fontWeight: 800,
            fontFamily: "'Chakra Petch', sans-serif",
            letterSpacing: "0.1em",
            cursor: "pointer",
            boxShadow: `0 0 30px ${theme.accent2}40`,
          }}
        >
          START DAILY
        </button>
      </div>
    </div>
  );
};

const SettingsScreen = ({ theme, currentTheme, setCurrentTheme, onTab }) => {
  const themeKeys = Object.keys(THEMES);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <StatusBar theme={theme} />
      <div style={{ flex: 1, padding: "8px 16px", overflow: "auto" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: theme.text, fontFamily: "'Chakra Petch', sans-serif", marginBottom: 16 }}>
          Settings
        </div>

        {/* Account */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
            Account
          </div>
          <div
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
              padding: "12px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: theme.text, fontFamily: "'Chakra Petch', sans-serif" }}>
                player.stark
              </div>
              <div style={{ fontSize: 9, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
                0x127f...cfcec
              </div>
            </div>
            <div style={{ fontSize: 10, color: theme.accent, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
              Cartridge ✓
            </div>
          </div>
        </div>

        {/* Theme Selector */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
            Preview Theme
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {themeKeys.map((k) => (
              <button
                key={k}
                onClick={() => setCurrentTheme(k)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: currentTheme === k ? `2px solid ${THEMES[k].accent}` : `1px solid ${theme.border}`,
                  background: currentTheme === k ? `${THEMES[k].accent}15` : theme.surface,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: THEMES[k].accent,
                  }}
                />
                <span
                  style={{
                    fontSize: 8,
                    color: currentTheme === k ? THEMES[k].accent : theme.textMuted,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  {THEMES[k].name.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Audio */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
            Audio
          </div>
          {["Music", "Sound Effects"].map((label) => (
            <div
              key={label}
              style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                padding: "10px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 12, color: theme.text, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
              <div
                style={{
                  width: 40,
                  height: 22,
                  borderRadius: 11,
                  background: theme.accent,
                  position: "relative",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#fff",
                    position: "absolute",
                    top: 2,
                    right: 2,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* About */}
        <div>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
            About
          </div>
          <div
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: 11, color: theme.text, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
              zKube v1.0 · Dojo 1.8.0
            </div>
            <div style={{ fontSize: 9, color: theme.textMuted, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
              Fully on-chain · Starknet
            </div>
          </div>
        </div>
      </div>
      <TabBar active="settings" theme={theme} onTab={onTab} />
    </div>
  );
};

// ========== PHONE FRAME ==========

const PhoneFrame = ({ children, theme, label }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
    <div
      style={{
        width: 280,
        height: 560,
        borderRadius: 32,
        background: theme.bg,
        position: "relative",
        overflow: "hidden",
        boxShadow: `0 20px 60px rgba(0,0,0,0.5), ${theme.glow}`,
        border: "2px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <PatternOverlay theme={theme.pattern} />
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", zIndex: 1 }}>
        {children}
      </div>
      {/* Dynamic Island */}
      <div
        style={{
          position: "absolute",
          top: 6,
          left: "50%",
          transform: "translateX(-50%)",
          width: 80,
          height: 22,
          borderRadius: 11,
          background: "#000",
          zIndex: 10,
        }}
      />
    </div>
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--text-primary, #ccc)",
        fontFamily: "'Chakra Petch', sans-serif",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  </div>
);

// ========== MAIN APP ==========

export default function ZKubeDesign() {
  const [currentTheme, setCurrentTheme] = useState("polynesian");
  const [activeScreen, setActiveScreen] = useState(0);
  const scrollRef = useRef(null);
  const theme = THEMES[currentTheme];

  const handleTab = (id) => {
    const map = { home: 0, map: 1, ranks: 4, settings: 6 };
    if (map[id] !== undefined) setActiveScreen(map[id]);
  };

  const screens = [
    { label: "Home", el: <HomeScreen theme={theme} onTab={handleTab} /> },
    { label: "Zone Map", el: <MapScreen theme={theme} onTab={handleTab} /> },
    { label: "Gameplay", el: <PlayScreen theme={theme} /> },
    { label: "Boss Fight", el: <BossScreen theme={theme} /> },
    { label: "Leaderboard", el: <LeaderboardScreen theme={theme} onTab={handleTab} /> },
    { label: "Daily Challenge", el: <DailyScreen theme={theme} /> },
    { label: "Settings", el: <SettingsScreen theme={theme} currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} onTab={handleTab} /> },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080810",
        fontFamily: "'DM Sans', 'Chakra Petch', sans-serif",
        color: "#e8e8f0",
        padding: "24px 16px",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            fontFamily: "'Chakra Petch', sans-serif",
            letterSpacing: "0.08em",
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          zKube UI/UX
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            fontFamily: "'DM Sans', sans-serif",
            marginTop: 4,
          }}
        >
          Mobile-First · On-Chain Puzzle Game · 7 Screens
        </div>

        {/* Theme Switcher */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
          {Object.entries(THEMES).map(([key, t]) => (
            <button
              key={key}
              onClick={() => setCurrentTheme(key)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: currentTheme === key ? `2px solid ${t.accent}` : "1px solid rgba(255,255,255,0.1)",
                background: currentTheme === key ? `${t.accent}20` : "rgba(255,255,255,0.03)",
                color: currentTheme === key ? t.accent : "rgba(255,255,255,0.5)",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "'Chakra Petch', sans-serif",
                cursor: "pointer",
                letterSpacing: "0.05em",
                transition: "all 0.2s",
              }}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Screen Nav */}
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 12, flexWrap: "wrap" }}>
          {SCREENS.map((s, i) => (
            <button
              key={s}
              onClick={() => setActiveScreen(i)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: "none",
                background: activeScreen === i ? theme.accent : "rgba(255,255,255,0.06)",
                color: activeScreen === i ? "#0a1628" : "rgba(255,255,255,0.4)",
                fontSize: 10,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Active Screen */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
        <PhoneFrame theme={theme} label={screens[activeScreen].label}>
          {screens[activeScreen].el}
        </PhoneFrame>
      </div>

      {/* All Screens Gallery */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'Chakra Petch', sans-serif",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          All Screens
        </div>
      </div>
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: 20,
          overflowX: "auto",
          padding: "0 16px 24px",
          scrollSnapType: "x mandatory",
        }}
      >
        {screens.map((s, i) => (
          <div key={i} style={{ scrollSnapAlign: "center", flexShrink: 0 }}>
            <PhoneFrame theme={theme} label={s.label}>
              {s.el}
            </PhoneFrame>
          </div>
        ))}
      </div>
    </div>
  );
}
