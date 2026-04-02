import { useState } from "react";

/*
 * ============================================================
 * ASSET MANIFEST — Replace placeholders with real asset imports
 * ============================================================
 * 
 * BLOCKS (theme-1/block-{1-4}.png) — Tiki mask textures, ~36x36px
 *   → Replace TikiBlock component internals with <img>
 * 
 * MAP NODES (theme-1/map-node-{level,completed,boss,draft}.png) — Islands, ~48-56px
 *   → Replace MapNode component internals with <img>
 * 
 * MAP BG (theme-1/map-bg.png) — Ocean waves background
 *   → Replace MapScreen gradient with backgroundImage url
 * 
 * GRID BG (theme-1/grid-bg.png) — Carved stone Polynesian motifs
 *   → Replace PlayScreen grid container background
 * 
 * LOGO (theme-1/logo.png) — Crystal 3D "zKube", ~160px
 *   → Replace HomeScreen text logo
 * 
 * THEME ICON (theme-1/theme-icon.png) — Tiki mask, ~40px
 *   → Replace zone list emoji icons
 * 
 * TROPHIES (trophies/{gold,silver,bronze}.png) — Cups, ~30px
 *   → Replace Trophy component medal emojis
 * 
 * CONSTRAINTS (common/constraints/constraint-{combo,clear-lines,keep-grid-below,break-blocks}.png)
 *   → Replace ConstraintIcon component emojis
 * 
 * BONUS (theme-1/bonus/{hammer,wave,tiki}.png) — Power-ups, ~28px
 *   → Add bonus bar to PlayScreen HUD
 * ============================================================
 */

const T = {
  bg: "linear-gradient(170deg,#0a1628 0%,#0d2847 40%,#0f3460 70%,#1a5276 100%)",
  ac: "#00E5CC", a2: "#FFD93D", a3: "#FF6B8A", a4: "#A78BFA",
  sf: "rgba(0,229,204,0.08)", bd: "rgba(0,229,204,0.15)",
  tx: "#E8F4F0", tm: "rgba(232,244,240,0.5)", gw: "0 0 40px rgba(0,229,204,0.3)",
};
const BC = { 1: "#4FB8C4", 2: "#00BFA5", 3: "#7B8EC8", 4: "#8A9BAF" };
const F1 = "'Chakra Petch',sans-serif";
const F2 = "'DM Sans',sans-serif";

// ── Shared ──
const SB = () => <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px 4px", fontSize: 11, fontWeight: 600, color: T.tx, fontFamily: F2 }}><span>9:41</span><span style={{ fontSize: 10 }}>⚡87%</span></div>;
const Star = ({ f, s = 12 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill={f ? "#FFD93D" : "rgba(255,255,255,0.12)"}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
const PB = ({ v, mx, c, h = 5, gw }) => <div style={{ width: "100%", height: h, borderRadius: h / 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}><div style={{ width: `${Math.min((v / mx) * 100, 100)}%`, height: "100%", borderRadius: h / 2, background: `linear-gradient(90deg,${c}CC,${c})`, boxShadow: gw ? `0 0 12px ${c}60` : "none" }} /></div>;

const TabBar = ({ a, onT }) => (
  <div style={{ display: "flex", justifyContent: "space-around", padding: "6px 0 14px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)", borderTop: `1px solid ${T.bd}` }}>
    {[["home", "⬡", "Home"], ["map", "◈", "Map"], ["profile", "◉", "Profile"], ["ranks", "◆", "Ranks"], ["settings", "⚙", "Settings"]].map(([id, ic, l]) => (
      <button key={id} onClick={() => onT(id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", color: a === id ? T.ac : T.tm, fontSize: 10, fontFamily: F2 }}>
        <span style={{ fontSize: 16 }}>{ic}</span><span style={{ fontWeight: a === id ? 700 : 400, fontSize: 9 }}>{l}</span>
      </button>
    ))}
  </div>
);

/* ASSET MARKER: Replace with <img src={`/assets/theme-1/block-${id}.png`} /> */
const TikiBlock = ({ color, sz = 26 }) => (
  <div style={{ width: sz, height: sz, borderRadius: 3, background: `radial-gradient(circle at 40% 35%,${color}DD,${color}88)`, border: `1px solid ${color}50`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)" }}>
    <div style={{ width: "50%", height: "15%", margin: "18% auto 0", borderRadius: "50%", background: "rgba(0,0,0,0.25)" }} />
    <div style={{ width: "60%", height: "18%", margin: "8% auto 0", borderRadius: 2, background: "rgba(0,0,0,0.2)" }} />
  </div>
);

/* ASSET MARKER: Replace with <img src={`/assets/theme-1/map-node-${type}.png`} /> */
const MapNode = ({ type, n, stars }) => {
  const bg = { done: "#2E7D32", cur: T.ac, boss: "#D84315", locked: "#37474F" };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: type === "boss" ? 48 : 42, height: type === "boss" ? 48 : 42, borderRadius: "50%", background: bg[type], display: "flex", alignItems: "center", justifyContent: "center", border: type === "cur" ? `2px solid ${T.ac}` : "2px solid rgba(255,255,255,0.1)", boxShadow: type === "cur" ? T.gw : "none" }}>
        {type === "boss" ? <span style={{ fontSize: 20 }}>🌋</span> : <span style={{ fontSize: 13, fontWeight: 800, color: type === "locked" ? "rgba(255,255,255,0.3)" : "#fff", fontFamily: F1 }}>{n}</span>}
      </div>
      {type === "done" && <div style={{ display: "flex", gap: 1, marginTop: 2 }}>{[1, 2, 3].map(s => <Star key={s} f={s <= stars} s={8} />)}</div>}
      {type === "boss" && <div style={{ fontSize: 7, color: T.a3, fontWeight: 700, fontFamily: F1, marginTop: 1 }}>BOSS</div>}
    </div>
  );
};

/* ASSET MARKER: Replace with <img src={`/assets/trophies/${r===1?'gold':r===2?'silver':'bronze'}.png`} style={{width:20}} /> */
const Trophy = ({ r }) => ["", "🥇", "🥈", "🥉"][r] || "";

// ── HOME ──
const Home = ({ onT }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}><SB />
    <div style={{ flex: 1, padding: "0 16px", overflow: "auto" }}>
      {/* ASSET MARKER: Replace with <img src="/assets/theme-1/logo.png" style={{width:120}} /> */}
      <div style={{ textAlign: "center", padding: "14px 0 6px" }}>
        <div style={{ fontSize: 32, fontWeight: 900, fontFamily: F1, color: T.tx, letterSpacing: "0.08em", textShadow: T.gw }}>zKube</div>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.3em", color: T.ac, fontFamily: F2, fontWeight: 600 }}>On-Chain Puzzle</div>
      </div>
      <div style={{ background: T.sf, border: `1px solid ${T.bd}`, borderRadius: 11, padding: "10px 12px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg,${T.ac},${T.a2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#0a1628", fontFamily: F1 }}>ZK</div>
          <div><div style={{ fontSize: 12, fontWeight: 700, color: T.tx, fontFamily: F1 }}>player.stark</div><div style={{ fontSize: 9, color: T.tm, fontFamily: F2 }}>Level 14 · 51 ⭐ zStar</div></div>
        </div>
        <div style={{ fontSize: 8, color: T.ac, background: `${T.ac}15`, padding: "3px 6px", borderRadius: 5, fontWeight: 600, fontFamily: F2 }}>CONNECTED</div>
      </div>
      <div onClick={() => onT("daily")} style={{ background: `linear-gradient(135deg,${T.ac}20,${T.a2}15)`, border: `1px solid ${T.ac}30`, borderRadius: 11, padding: "10px 12px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
        <div><div style={{ fontSize: 11, fontWeight: 700, color: T.a2, fontFamily: F1 }}>⚡ DAILY CHALLENGE</div><div style={{ fontSize: 9, color: T.tm, fontFamily: F2, marginTop: 1 }}>24h remaining · 142 players · 3★ reward</div></div>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#0a1628", background: T.a2, padding: "5px 10px", borderRadius: 7, fontFamily: F1 }}>PLAY</div>
      </div>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: T.tm, fontFamily: F2, fontWeight: 600, marginBottom: 8 }}>Select Zone</div>
      {[{ n: "Polynesian", ic: "🌊", s: 28, mx: 30, u: true, cl: true, free: true }, { n: "Feudal Japan", ic: "⛩️", s: 15, mx: 30, u: true }, { n: "Ancient Persia", ic: "🕌", s: 8, mx: 30, u: true }, { n: "Ancient Egypt", ic: "🏛️", u: false, sc: 120, pr: "$2.99" }, { n: "Norse", ic: "❄️", u: false, sc: 200, pr: "$3.99" }].map(z => (
        <div key={z.n} onClick={() => z.u && onT("map")} style={{ background: z.u ? T.sf : "rgba(255,255,255,0.02)", border: `1px solid ${z.u ? T.bd : "rgba(255,255,255,0.04)"}`, borderRadius: 10, padding: "8px 10px", marginBottom: 5, opacity: z.u ? 1 : 0.55, cursor: z.u ? "pointer" : "default" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: z.u ? 4 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* ASSET MARKER: Replace emoji with per-zone theme-icon.png */}
              <span style={{ fontSize: 16 }}>{z.ic}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.tx, fontFamily: F1 }}>{z.n}</span>
              {z.cl && <span style={{ fontSize: 6, fontWeight: 700, color: T.ac, background: `${T.ac}15`, padding: "1px 4px", borderRadius: 3, fontFamily: F2 }}>CLEARED</span>}
              {z.free && <span style={{ fontSize: 6, fontWeight: 700, color: T.a2, background: `${T.a2}15`, padding: "1px 4px", borderRadius: 3, fontFamily: F2 }}>FREE</span>}
            </div>
            {z.u ? <span style={{ fontSize: 8, color: T.a2, fontFamily: F1, fontWeight: 700 }}>{z.s}/{z.mx}</span> : <div style={{ display: "flex", gap: 4, alignItems: "center" }}><span style={{ fontSize: 7, color: T.a2, fontWeight: 700, fontFamily: F1 }}>{z.sc}★</span><span style={{ fontSize: 6, color: T.tm }}>or</span><span style={{ fontSize: 7, color: T.ac, fontWeight: 700, fontFamily: F1 }}>{z.pr}</span></div>}
          </div>
          {z.u && <PB v={z.s} mx={z.mx} c={T.ac} h={3} />}
          {!z.u && <div style={{ marginTop: 4 }}><PB v={51} mx={z.sc} c={T.a2} h={3} /><div style={{ fontSize: 6, color: T.tm, fontFamily: F2, marginTop: 2 }}>{51}/{z.sc}★ · {Math.floor(51 / z.sc * 100)}% discount</div></div>}
        </div>
      ))}
      <button onClick={() => onT("map")} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${T.ac},${T.ac}CC)`, color: "#0a1628", fontSize: 13, fontWeight: 800, fontFamily: F1, letterSpacing: "0.1em", cursor: "pointer", boxShadow: T.gw, margin: "8px 0" }}>NEW GAME</button>
    </div>
    <TabBar a="home" onT={onT} />
  </div>
);

// ── MAP ──
const Map = ({ onT }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}><SB />
    <div style={{ padding: "4px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontSize: 16, fontWeight: 800, color: T.tx, fontFamily: F1 }}>🌊 Polynesian</div><div style={{ display: "flex", gap: 1, alignItems: "center" }}><Star f s={11} /><span style={{ fontSize: 10, fontWeight: 700, color: T.a2, fontFamily: F2, marginLeft: 2 }}>14/30</span></div></div>
    {/* ASSET MARKER: Replace with backgroundImage: url(/assets/theme-1/map-bg.png) */}
    <div style={{ flex: 1, padding: "8px 20px", overflow: "auto", background: "linear-gradient(180deg,#0a1a35,#0d2f55,#0a1a35)", borderRadius: 8, margin: "4px 8px" }}>
      <div style={{ display: "flex", flexDirection: "column-reverse", gap: 4 }}>
        {[{ n: 1, s: 3, t: "done" }, { n: 2, s: 3, t: "done" }, { n: 3, s: 2, t: "done" }, { n: 4, s: 3, t: "done" }, { n: 5, s: 1, t: "done" }, { n: 6, s: 2, t: "done" }, { n: 7, t: "cur" }, { n: 8, t: "locked" }, { n: 9, t: "locked" }, { n: 10, t: "boss" }].map((l, i) => (
          <div key={l.n} style={{ marginLeft: `calc(50% + ${Math.sin(i * 0.8) * 35}px - 24px)` }}><MapNode type={l.t} n={l.n} stars={l.s} /></div>
        ))}
      </div>
    </div>
    <TabBar a="map" onT={onT} />
  </div>
);

// ── PLAY ──
const Play = () => {
  const grid = Array.from({ length: 10 }, (_, r) => Array.from({ length: 8 }, (_, c) => r < 3 ? 0 : (c * 7 + r * 3) % 5 === 0 ? 0 : [1, 2, 3, 4][(c * r + c) % 4]));
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}><SB />
      <div style={{ padding: "2px 12px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.ac, fontFamily: F1, background: T.sf, padding: "2px 6px", borderRadius: 5, border: `1px solid ${T.bd}` }}>LV.7</div>
          <div style={{ display: "flex", gap: 1 }}><Star f s={10} /><Star f s={10} /><Star f={false} s={10} /></div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>{[["MOVES", "6/15", T.tx], ["SCORE", "2,840", T.a2], ["COMBO", "x3", T.ac], ["★", "51", T.a2]].map(([l, v, c]) => <div key={l} style={{ textAlign: "center" }}><div style={{ fontSize: 8, color: T.tm, fontFamily: F2 }}>{l}</div><div style={{ fontSize: 12, fontWeight: 800, color: c, fontFamily: F1 }}>{v}</div></div>)}</div>
      </div>
      <div style={{ padding: "0 12px 4px" }}>
        <div style={{ background: T.sf, border: `1px solid ${T.bd}`, borderRadius: 7, padding: "4px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* ASSET MARKER: Replace 🔥 with constraint-combo.png */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontSize: 14 }}>🔥</span><span style={{ fontSize: 9, fontWeight: 600, color: T.tx, fontFamily: F2 }}>Clear 3 combo lines</span></div>
          <span style={{ fontSize: 9, fontWeight: 800, color: T.ac, fontFamily: F1 }}>2/3</span>
        </div>
      </div>
      {/* ASSET MARKER: Replace grid bg with backgroundImage: url(/assets/theme-1/grid-bg.png) */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "0 6px" }}>
        <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 10, padding: 4, border: `1px solid ${T.bd}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 1.5 }}>
            {grid.flat().map((cell, i) => cell === 0 ? <div key={i} style={{ width: 26, height: 26, borderRadius: 3, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)" }} /> : <TikiBlock key={i} color={BC[cell]} />)}
          </div>
        </div>
      </div>
      <div style={{ padding: "4px 12px", display: "flex", justifyContent: "center", gap: 3, alignItems: "center" }}><span style={{ fontSize: 8, color: T.tm, fontFamily: F2, marginRight: 4 }}>NEXT</span>{[2, 0, 3, 1, 0, 4, 2, 1].map((b, i) => <div key={i} style={{ width: 16, height: 16, borderRadius: 2, background: b === 0 ? "rgba(255,255,255,0.04)" : `${BC[b]}80` }} />)}</div>
      <div style={{ textAlign: "center", padding: "4px 0 12px", fontSize: 9, color: T.tm, fontFamily: F2 }}>← Swipe rows to align blocks →</div>
    </div>
  );
};

// ── BOSS ──
const Boss = () => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}><SB />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 18px" }}>
      {/* ASSET MARKER: Replace with map-node-boss.png at 80x80 with drop-shadow */}
      <div style={{ fontSize: 56, filter: "drop-shadow(0 0 20px rgba(255,87,34,0.5))" }}>🌋</div>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.3em", color: T.ac, fontFamily: F2, fontWeight: 600, marginTop: 6 }}>Level 10 · Boss</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: T.tx, fontFamily: F1, marginTop: 2, textShadow: T.gw }}>TIDECALLER</div>
      <div style={{ fontSize: 10, color: T.tm, fontFamily: F2, marginTop: 4 }}>Master of the deep currents</div>
      {[["🔥", "Clear 5 combo lines", "Consecutive line clears"], ["📊", "Keep grid below 60%", "Don't let blocks stack high"]].map(([ic, t, d], i) => (
        <div key={i} style={{ background: "rgba(255,87,34,0.08)", border: "1px solid rgba(255,87,34,0.2)", borderRadius: 9, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8, width: "100%", marginTop: i === 0 ? 16 : 6 }}>
          {/* ASSET MARKER: Replace emoji with constraint PNGs */}
          <span style={{ fontSize: 18 }}>{ic}</span>
          <div><div style={{ fontSize: 10, fontWeight: 700, color: T.tx, fontFamily: F1 }}>{t}</div><div style={{ fontSize: 8, color: T.tm, fontFamily: F2, marginTop: 1 }}>{d}</div></div>
        </div>
      ))}
      <button style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF3B3B,#FF6B3B)", color: "#fff", fontSize: 13, fontWeight: 800, fontFamily: F1, letterSpacing: "0.1em", cursor: "pointer", marginTop: 16, boxShadow: "0 0 30px rgba(255,59,59,0.4)" }}>FIGHT BOSS</button>
    </div>
  </div>
);

// ── UNLOCK MODAL ──
const UnlockModal = ({ z, onC }) => {
  const disc = Math.floor((z.cs / z.sc) * 100);
  const dp = (z.ep * Math.max(0.1, 1 - z.cs / z.sc)).toFixed(2);
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onC} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} />
      <div style={{ position: "relative", background: "linear-gradient(180deg,#0f2a50,#0a1628)", borderRadius: "18px 18px 0 0", border: `1px solid ${T.bd}`, borderBottom: "none", padding: "16px 14px 24px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><div style={{ width: 32, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><span style={{ fontSize: 28 }}>{z.ic}</span><div><div style={{ fontSize: 7, textTransform: "uppercase", letterSpacing: "0.2em", color: T.ac, fontFamily: F2, fontWeight: 600 }}>Unlock Zone</div><div style={{ fontSize: 16, fontWeight: 900, color: T.tx, fontFamily: F1 }}>{z.n}</div><div style={{ fontSize: 8, color: T.tm, fontFamily: F2 }}>10 levels · Boss · Endless</div></div></div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <div style={{ flex: 1, background: `${T.a2}08`, border: `1px solid ${T.a2}20`, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 8, textTransform: "uppercase", color: T.a2, fontFamily: F2, fontWeight: 700, marginBottom: 6 }}>★ Earn It</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: T.a2, fontFamily: F1 }}>{z.sc}</div>
            <div style={{ fontSize: 7, color: T.tm, fontFamily: F2, marginBottom: 6 }}>stars required</div>
            <PB v={z.cs} mx={z.sc} c={T.a2} h={4} gw />
            <div style={{ fontSize: 8, color: T.a2, fontFamily: F1, fontWeight: 700, marginTop: 3 }}>{z.cs}/{z.sc}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}><div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.08)" }} /><div style={{ fontSize: 8, fontWeight: 700, color: T.tm, fontFamily: F2, padding: "4px 0" }}>OR</div><div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.08)" }} /></div>
          <div style={{ flex: 1, background: `${T.ac}08`, border: `1px solid ${T.ac}20`, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 8, textTransform: "uppercase", color: T.ac, fontFamily: F2, fontWeight: 700, marginBottom: 6 }}>◆ Skip Ahead</div>
            {disc > 0 && <div style={{ fontSize: 10, color: T.tm, fontFamily: F1, textDecoration: "line-through" }}>${z.ep}</div>}
            <div style={{ fontSize: 22, fontWeight: 900, color: T.ac, fontFamily: F1 }}>${dp}</div>
            <div style={{ fontSize: 7, color: T.tm, fontFamily: F2, marginBottom: 4 }}>USDC</div>
            {disc > 0 && <div style={{ background: `linear-gradient(135deg,${T.a3},${T.a3}CC)`, color: "#fff", fontSize: 8, fontWeight: 800, fontFamily: F1, padding: "2px 6px", borderRadius: 4, display: "inline-block" }}>{disc}% OFF</div>}
            <button style={{ marginTop: 6, width: "100%", padding: "7px", borderRadius: 7, border: "none", background: `linear-gradient(135deg,${T.ac},${T.ac}CC)`, color: "#0a1628", fontSize: 9, fontWeight: 800, fontFamily: F1, cursor: "pointer" }}>BUY NOW</button>
          </div>
        </div>
        <div style={{ textAlign: "center", fontSize: 7, color: T.a2, fontFamily: F2, fontWeight: 600 }}>100% stars = FREE · 90% cap on USDC discount · Every star counts</div>
      </div>
    </div>
  );
};

// ── PROFILE (Overview + Quests + Achievements) ──
const Profile = ({ onT }) => {
  const [tab, setTab] = useState(0);
  const [uz, setUZ] = useState(null);

  const QC = ({ q }) => (
    <div style={{ background: q.dn ? `${q.c}08` : T.sf, border: `1px solid ${q.dn ? `${q.c}25` : T.bd}`, borderRadius: 8, padding: "6px 8px", opacity: q.dn ? 0.7 : 1, marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
        <span style={{ fontSize: 14 }}>{q.ic}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: q.dn ? q.c : T.tx, fontFamily: F1, textDecoration: q.dn ? "line-through" : "none" }}>{q.t}</span>
            {q.dn ? <span style={{ fontSize: 7, color: T.ac, background: `${T.ac}15`, padding: "1px 5px", borderRadius: 3, fontFamily: F2, fontWeight: 700 }}>CLAIMED</span> : <span style={{ fontSize: 8, color: T.a2, fontFamily: F1, fontWeight: 700 }}>+{q.r}★</span>}
          </div>
          <div style={{ fontSize: 8, color: T.tm, fontFamily: F2, marginTop: 1, marginBottom: q.dn ? 0 : 4 }}>{q.d}</div>
          {!q.dn && <PB v={q.p} mx={q.mx} c={q.c} h={3} />}
        </div>
      </div>
    </div>
  );

  const rc = { Common: "rgba(255,255,255,0.5)", Rare: "#4DA6FF", Epic: "#A78BFA", Legendary: "#FFD93D" };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}><SB />
      <div style={{ padding: "4px 16px 0" }}><span style={{ fontSize: 14, fontWeight: 800, color: T.tx, fontFamily: F1 }}>Profile</span></div>
      <div style={{ padding: "8px 16px" }}>
        <div style={{ background: `linear-gradient(135deg,${T.ac}10,${T.a2}08)`, border: `1px solid ${T.bd}`, borderRadius: 12, padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ position: "relative" }}><div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg,${T.ac},${T.a2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#0a1628", fontFamily: F1 }}>ZK</div><div style={{ position: "absolute", bottom: -3, right: -3, width: 16, height: 16, borderRadius: 5, background: T.ac, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 900, color: "#0a1628", fontFamily: F1, border: "2px solid #0d2847" }}>14</div></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 800, color: T.tx, fontFamily: F1 }}>player.stark</div><div style={{ fontSize: 8, color: T.tm, fontFamily: F2 }}>Level 14 · Puzzle Adept</div></div>
            <div style={{ textAlign: "right" }}><div style={{ display: "flex", alignItems: "center", gap: 2 }}><Star f s={12} /><span style={{ fontSize: 16, fontWeight: 900, color: T.a2, fontFamily: F1 }}>51</span></div><div style={{ fontSize: 7, color: T.tm, fontFamily: F2 }}>zStar</div></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 7, color: T.tm, fontFamily: F2 }}>Level 14</span><span style={{ fontSize: 7, color: T.ac, fontFamily: F1, fontWeight: 700 }}>2,840/4,000 XP</span></div>
          <PB v={2840} mx={4000} c={T.ac} h={5} gw />
        </div>
      </div>
      <div style={{ display: "flex", padding: "0 16px", marginBottom: 2 }}>
        {["Overview", "Quests", "Achievements"].map((tb, i) => (
          <button key={tb} onClick={() => setTab(i)} style={{ flex: 1, textAlign: "center", padding: "6px 0", fontSize: 10, fontWeight: tab === i ? 700 : 500, fontFamily: F2, color: tab === i ? T.ac : T.tm, background: "none", border: "none", borderBottom: `2px solid ${tab === i ? T.ac : "transparent"}`, cursor: "pointer" }}>{tb}{i === 1 && <span style={{ marginLeft: 3, fontSize: 7, fontWeight: 700, color: "#0a1628", background: T.a3, padding: "0 3px", borderRadius: 3 }}>3</span>}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "8px 16px 12px" }}>
        {tab === 0 && <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5, marginBottom: 12 }}>{[["Games", "142"], ["Combo", "x7"], ["Lines", "2,841"], ["Bosses", "4/10"]].map(([l, v]) => <div key={l} style={{ background: T.sf, border: `1px solid ${T.bd}`, borderRadius: 8, padding: "6px 2px", textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 800, color: T.tx, fontFamily: F1 }}>{v}</div><div style={{ fontSize: 7, color: T.tm, fontFamily: F2 }}>{l}</div></div>)}</div>
          <div style={{ fontSize: 9, textTransform: "uppercase", color: T.tm, fontFamily: F2, fontWeight: 600, marginBottom: 6 }}>Zone Progress</div>
          {[{ n: "Polynesian", s: 28, mx: 30, u: true, cl: true }, { n: "Feudal Japan", s: 15, mx: 30, u: true }, { n: "Ancient Egypt", u: false, sc: 120, cs: 51, ep: 0.015, ic: "🏛️" }].map((z, i) => (
            <div key={i} onClick={() => !z.u && setUZ(z)} style={{ background: z.u ? T.sf : "rgba(255,255,255,0.02)", border: `1px solid ${z.u ? T.bd : "rgba(255,255,255,0.04)"}`, borderRadius: 8, padding: "6px 8px", marginBottom: 4, opacity: z.u ? 1 : 0.65, cursor: !z.u ? "pointer" : "default" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: z.u ? 3 : 0 }}><span style={{ fontSize: 10, fontWeight: 700, color: T.tx, fontFamily: F1 }}>{z.n}{z.cl && <span style={{ fontSize: 6, color: T.ac, marginLeft: 4 }}>CLEARED</span>}</span>{z.u ? <span style={{ fontSize: 8, color: T.a2, fontFamily: F1, fontWeight: 700 }}>{z.s}/{z.mx}</span> : <span style={{ fontSize: 7, color: T.ac, fontFamily: F2 }}>Tap to unlock →</span>}</div>
              {z.u && <PB v={z.s} mx={z.mx} c={T.ac} h={3} />}
              {!z.u && <div style={{ marginTop: 3 }}><PB v={z.cs} mx={z.sc} c={T.a2} h={3} /><div style={{ fontSize: 6, color: T.tm, fontFamily: F2, marginTop: 1 }}>{z.cs}/{z.sc}★ or ${(z.ep * Math.max(0.1, 1 - z.cs / z.sc)).toFixed(2)} USDC</div></div>}
            </div>
          ))}
        </>}
        {tab === 1 && <>
          <div onClick={() => setUZ({ n: "Ancient Egypt", ic: "🏛️", sc: 120, cs: 51, ep: 0.015 })} style={{ background: `linear-gradient(135deg,${T.a2}08,${T.ac}06)`, border: `1px solid ${T.a2}15`, borderRadius: 10, padding: "8px 10px", cursor: "pointer", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><span style={{ fontSize: 18 }}>🏛️</span><div style={{ flex: 1 }}><div style={{ fontSize: 7, textTransform: "uppercase", color: T.a2, fontFamily: F2, fontWeight: 600 }}>Next Unlock: Ancient Egypt</div><div style={{ fontSize: 11, fontWeight: 800, color: T.tx, fontFamily: F1 }}>51/120 ★</div></div></div>
            <PB v={51} mx={120} c={T.a2} h={4} gw /><div style={{ textAlign: "center", fontSize: 7, color: T.ac, fontFamily: F2, fontWeight: 600, marginTop: 4 }}>Tap for unlock options →</div>
          </div>
          <div style={{ fontSize: 9, textTransform: "uppercase", color: T.tm, fontFamily: F2, fontWeight: 600, marginBottom: 6 }}>Daily Quests <span style={{ fontSize: 7, color: T.ac, float: "right", fontWeight: 600, background: T.sf, padding: "1px 5px", borderRadius: 3 }}>Resets 14:23</span></div>
          {[{ t: "Line Breaker", d: "Clear 20 lines", p: 14, mx: 20, r: 3, ic: "📏", c: T.ac }, { t: "Combo Starter", d: "Get a x3 combo", p: 1, mx: 1, r: 2, ic: "🔥", c: T.a2, dn: true }, { t: "Daily Player", d: "Complete daily challenge", p: 0, mx: 1, r: 5, ic: "⚡", c: T.a3 }].map((q, i) => <QC key={i} q={q} />)}
          <div style={{ fontSize: 9, textTransform: "uppercase", color: T.tm, fontFamily: F2, fontWeight: 600, margin: "8px 0 6px" }}>Weekly Quests</div>
          {[{ t: "Zone Explorer", d: "Complete 30 levels", p: 22, mx: 30, r: 5, ic: "🗺️", c: T.a4 }, { t: "Weekly Challenger", d: "Play 3 daily challenges", p: 2, mx: 3, r: 5, ic: "⭐", c: T.a2 }].map((q, i) => <QC key={i} q={q} />)}
        </>}
        {tab === 2 && <>
          <div style={{ background: T.sf, border: `1px solid ${T.bd}`, borderRadius: 10, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><div><div style={{ fontSize: 18, fontWeight: 900, color: T.tx, fontFamily: F1 }}>3/8</div><div style={{ fontSize: 8, color: T.tm, fontFamily: F2 }}>Unlocked</div></div><div style={{ display: "flex", gap: 6 }}>{Object.entries(rc).map(([n, c]) => <div key={n} style={{ textAlign: "center" }}><div style={{ fontSize: 11, fontWeight: 800, color: c, fontFamily: F1 }}>{n === "Common" ? 2 : n === "Rare" ? 1 : 0}</div><div style={{ fontSize: 6, color: `${c}99`, fontFamily: F2 }}>{n}</div></div>)}</div></div>
          {[{ n: "Combo Master", a: [{ n: "Spark", d: "x3 combo", ic: "🔥", u: true, r: "Common" }, { n: "Chain Lightning", d: "x4 combo", ic: "⛓️", u: true, r: "Rare" }, { n: "Cascade", d: "4 lines in one move", ic: "🌋", u: false, r: "Epic" }, { n: "Avalanche", d: "5+ lines in one move", ic: "✦", u: false, r: "Legendary" }] }, { n: "Boss Slayer", a: [{ n: "First Blood", d: "Defeat first boss", ic: "⚔️", u: true, r: "Common" }, { n: "Hunter", d: "Defeat 5 bosses", ic: "🎯", u: false, r: "Rare" }, { n: "Slayer", d: "Defeat 15 bosses", ic: "💀", u: false, r: "Epic" }, { n: "Godkiller", d: "Defeat 50 bosses", ic: "👑", u: false, r: "Legendary" }] }].map(cat => (
            <div key={cat.n} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, textTransform: "uppercase", color: T.tm, fontFamily: F2, fontWeight: 600, marginBottom: 6 }}>{cat.n}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>{cat.a.map(a => <div key={a.n} style={{ background: a.u ? `${rc[a.r]}08` : "rgba(255,255,255,0.015)", border: `1px solid ${a.u ? `${rc[a.r]}20` : "rgba(255,255,255,0.04)"}`, borderRadius: 8, padding: "6px", opacity: a.u ? 1 : 0.4 }}><div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}><span style={{ fontSize: 14, filter: a.u ? "none" : "grayscale(1)" }}>{a.ic}</span><span style={{ fontSize: 5, fontWeight: 700, color: rc[a.r], fontFamily: F2, textTransform: "uppercase" }}>{a.r}</span></div><div style={{ fontSize: 8, fontWeight: 700, color: a.u ? T.tx : T.tm, fontFamily: F1 }}>{a.n}</div><div style={{ fontSize: 6.5, color: T.tm, fontFamily: F2, marginTop: 1 }}>{a.d}</div></div>)}</div>
            </div>
          ))}
        </>}
      </div>
      <TabBar a="profile" onT={onT} />
      {uz && <UnlockModal z={uz} onC={() => setUZ(null)} />}
    </div>
  );
};

// ── LEADERBOARD ──
const Ranks = ({ onT }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}><SB />
    <div style={{ padding: "4px 16px 8px" }}><div style={{ fontSize: 16, fontWeight: 800, color: T.tx, fontFamily: F1 }}>Leaderboard</div></div>
    <div style={{ flex: 1, padding: "0 16px", overflow: "auto" }}>
      {[{ r: 1, n: "0xWave.stark", s: 12450 }, { r: 2, n: "kubemaster.stark", s: 11200 }, { r: 3, n: "player.stark", s: 9840, you: true }, { r: 4, n: "puzzler.stark", s: 8320 }, { r: 5, n: "blocky.stark", s: 7100 }, { r: 6, n: "0xCairo.stark", s: 6540 }].map(pl => (
        <div key={pl.r} style={{ background: pl.you ? `${T.ac}12` : T.sf, border: `1px solid ${pl.you ? T.ac + "30" : T.bd}`, borderRadius: 8, padding: "8px 10px", display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          {/* ASSET MARKER: Replace Trophy with trophy PNGs */}
          <div style={{ width: 24, textAlign: "center" }}>{pl.r <= 3 ? <Trophy r={pl.r} /> : <span style={{ fontSize: 12, fontWeight: 800, color: T.tm, fontFamily: F1 }}>{pl.r}</span>}</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 11, fontWeight: 700, color: pl.you ? T.ac : T.tx, fontFamily: F1 }}>{pl.n}{pl.you && <span style={{ fontSize: 8, opacity: 0.7 }}> (you)</span>}</div></div>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.tx, fontFamily: F1 }}>{pl.s.toLocaleString()}</div>
        </div>
      ))}
    </div>
    <TabBar a="ranks" onT={onT} />
  </div>
);

// ── DAILY ──
const Daily = () => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}><SB />
    <div style={{ padding: "4px 16px 0", display: "flex", justifyContent: "space-between" }}><div><div style={{ fontSize: 14, fontWeight: 800, color: T.tx, fontFamily: F1 }}>⚡ Daily Challenge</div><div style={{ fontSize: 9, color: T.tm, fontFamily: F2, marginTop: 1 }}>Apr 2, 2026 · Same seed</div></div><div style={{ fontSize: 9, fontWeight: 700, color: T.ac, background: T.sf, padding: "3px 8px", borderRadius: 5, border: `1px solid ${T.bd}`, fontFamily: F1 }}>14:23:09</div></div>
    <div style={{ padding: "8px 16px" }}><div style={{ background: T.sf, border: `1px solid ${T.bd}`, borderRadius: 8, padding: "8px 10px" }}><div style={{ fontSize: 8, textTransform: "uppercase", color: T.tm, fontFamily: F2, marginBottom: 6 }}>Today's Top 3</div>{[{ r: 1, n: "0xWave", s: 4200 }, { r: 2, n: "kubemstr", s: 3890 }, { r: 3, n: "puzzler", s: 3410 }].map(p => <div key={p.r} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderTop: p.r > 1 ? `1px solid ${T.bd}` : "none" }}><span style={{ fontSize: 10, color: T.tx, fontFamily: F2 }}><Trophy r={p.r} /> {p.n}</span><span style={{ fontSize: 10, fontWeight: 700, color: T.a2, fontFamily: F1 }}>{p.s.toLocaleString()}</span></div>)}</div></div>
    <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}><div style={{ fontSize: 9, color: T.tm, fontFamily: F2, textAlign: "center" }}>142 players · 3★ participation<br />Top 50% get leaderboard rewards</div></div>
    <div style={{ padding: "0 16px 16px" }}><button style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${T.a2},${T.a2}CC)`, color: "#0a1628", fontSize: 13, fontWeight: 800, fontFamily: F1, letterSpacing: "0.1em", cursor: "pointer", boxShadow: `0 0 30px ${T.a2}40` }}>START DAILY</button></div>
  </div>
);

// ── SETTINGS ──
const Settings = ({ onT }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}><SB />
    <div style={{ flex: 1, padding: "4px 16px", overflow: "auto" }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: T.tx, fontFamily: F1, marginBottom: 12 }}>Settings</div>
      <div style={{ fontSize: 9, textTransform: "uppercase", color: T.tm, fontFamily: F2, fontWeight: 600, marginBottom: 6 }}>Account</div>
      <div style={{ background: T.sf, border: `1px solid ${T.bd}`, borderRadius: 8, padding: "10px 12px", display: "flex", justifyContent: "space-between", marginBottom: 12 }}><div><div style={{ fontSize: 11, fontWeight: 700, color: T.tx, fontFamily: F1 }}>player.stark</div><div style={{ fontSize: 8, color: T.tm, fontFamily: F2 }}>0x127f...cfcec</div></div><div style={{ fontSize: 9, color: T.ac, fontFamily: F2, fontWeight: 600 }}>Cartridge ✓</div></div>
      <div style={{ fontSize: 9, textTransform: "uppercase", color: T.tm, fontFamily: F2, fontWeight: 600, marginBottom: 6 }}>Audio</div>
      {["Music", "Sound Effects"].map(l => <div key={l} style={{ background: T.sf, border: `1px solid ${T.bd}`, borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 11, color: T.tx, fontFamily: F2 }}>{l}</span><div style={{ width: 36, height: 20, borderRadius: 10, background: T.ac, position: "relative" }}><div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, right: 2 }} /></div></div>)}
      <div style={{ fontSize: 9, textTransform: "uppercase", color: T.tm, fontFamily: F2, fontWeight: 600, margin: "10px 0 6px" }}>About</div>
      <div style={{ background: T.sf, border: `1px solid ${T.bd}`, borderRadius: 8, padding: "10px 12px" }}><div style={{ fontSize: 10, color: T.tx, fontFamily: F2 }}>zKube v1.0 · Dojo 1.8.0</div><div style={{ fontSize: 8, color: T.tm, fontFamily: F2, marginTop: 1 }}>On-chain · Starknet · Soul-bound zStar</div></div>
    </div>
    <TabBar a="settings" onT={onT} />
  </div>
);

// ── PHONE FRAME ──
const PF = ({ children, label }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
    <div style={{ width: 290, height: 600, borderRadius: 30, background: T.bg, position: "relative", overflow: "hidden", boxShadow: `0 20px 60px rgba(0,0,0,0.5),${T.gw}`, border: "2px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", width: 76, height: 20, borderRadius: 10, background: "#000", zIndex: 10 }} />
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", zIndex: 1 }}>{children}</div>
    </div>
    {label && <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", fontFamily: F1, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>}
  </div>
);

// ── MAIN ──
const SCREENS = ["Home", "Map", "Play", "Boss", "Profile", "Ranks", "Daily", "Settings"];

export default function ZKubeApp() {
  const [scr, setScr] = useState(0);
  const nav = (id) => { const m = { home: 0, map: 1, profile: 4, ranks: 5, daily: 6, settings: 7 }; if (m[id] !== undefined) setScr(m[id]); };
  const S = [
    { l: "Home", el: <Home onT={nav} /> }, { l: "Zone Map", el: <Map onT={nav} /> },
    { l: "Gameplay", el: <Play /> }, { l: "Boss Fight", el: <Boss /> },
    { l: "Profile", el: <Profile onT={nav} /> }, { l: "Leaderboard", el: <Ranks onT={nav} /> },
    { l: "Daily Challenge", el: <Daily /> }, { l: "Settings", el: <Settings onT={nav} /> },
  ];
  return (
    <div style={{ minHeight: "100vh", background: "#080810", fontFamily: `${F2},${F1}`, padding: "20px 12px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 28, fontWeight: 900, fontFamily: F1, letterSpacing: "0.08em", background: `linear-gradient(135deg,${T.ac},${T.a2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>zKube UI/UX</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: F2, marginTop: 2 }}>Progression System · Dual Unlock · 8 Screens · Asset Markers for Claude Code</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 3, marginTop: 10, flexWrap: "wrap" }}>
          {SCREENS.map((s, i) => <button key={s} onClick={() => setScr(i)} style={{ padding: "3px 8px", borderRadius: 5, border: "none", background: scr === i ? T.ac : "rgba(255,255,255,0.06)", color: scr === i ? "#0a1628" : "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: 600, fontFamily: F2, cursor: "pointer" }}>{s}</button>)}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}><PF label={S[scr].l}>{S[scr].el}</PF></div>
      <div style={{ display: "flex", gap: 16, overflowX: "auto", padding: "0 8px 16px", scrollSnapType: "x mandatory" }}>
        {S.map((s, i) => <div key={i} style={{ scrollSnapAlign: "center", flexShrink: 0 }}><PF label={s.l}>{s.el}</PF></div>)}
      </div>
    </div>
  );
}
