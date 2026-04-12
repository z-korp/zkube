import { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { motion } from "motion/react";
import { getZoneGuardian, getGuardianPortrait } from "@/config/bossCharacters";
import { useGame } from "@/hooks/useGame";
import { useGameLevel } from "@/hooks/useGameLevel";
import { useMutatorDef } from "@/hooks/useMutatorDef";
import {
  NODES_PER_ZONE,
  getZoneTheme,
  useMapData,
  type MapNodeData,
  type NodeState,
} from "@/hooks/useMapData";
import { useMapLayout } from "@/hooks/useMapLayout";
import {
  getThemeColors,
  getMapPathTheme,
  getThemeImages,
  isValidThemeId,
  type ThemeId,
} from "@/config/themes";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { useNavigationStore } from "@/stores/navigationStore";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useDojo } from "@/dojo/useDojo";
import { useActiveStoryAttempt } from "@/hooks/useActiveStoryAttempt";
import { useActiveDailyAttempt } from "@/hooks/useActiveDailyAttempt";
import { useCurrentChallenge } from "@/hooks/useCurrentChallenge";
import { usePlayerEntry } from "@/hooks/usePlayerEntry";
import { useZoneProgress } from "@/hooks/useZoneProgress";
import { useSettings } from "@/hooks/useSettings";
import { ZONE_NAMES } from "@/config/profileData";
import LevelPreview from "@/ui/components/map/LevelPreview";
import LevelCompleteDialog from "@/ui/components/LevelCompleteDialog";
import ZoneBackground from "@/ui/components/map/ZoneBackground";
import GuardianGreeting from "@/ui/components/map/GuardianGreeting";
import { showToast } from "@/utils/toast";

const VB_W = 60;
const VB_H = 100;

const STATE_COLORS: Record<
  NodeState,
  { fill: string; border: string; alpha: number; text: string }
> = {
  locked: { fill: "#334155", border: "#475569", alpha: 0.5, text: "#94a3b8" },
  cleared: { fill: "#14532d", border: "#22c55e", alpha: 1, text: "#bbf7d0" },
  current: { fill: "#0f2743", border: "#3b82f6", alpha: 1, text: "#bfdbfe" },
  available: { fill: "#1e293b", border: "#f97316", alpha: 1, text: "#fed7aa" },
  visited: { fill: "#1e3a2f", border: "#4ade80", alpha: 0.85, text: "#bbf7d0" },
  playing: { fill: "#7c2d12", border: "#fb923c", alpha: 1, text: "#ffedd5" },
};

const canOpenPreview = (node: MapNodeData): boolean => node.state !== "locked";

const getPathType = (
  fromState: NodeState,
  toState: NodeState,
): "cleared" | "active" | "locked" => {
  if (
    fromState === "cleared" &&
    (toState === "cleared" || toState === "visited")
  ) {
    return "cleared";
  }
  if (
    fromState === "cleared" &&
    (toState === "current" || toState === "available" || toState === "playing")
  ) {
    return "active";
  }
  return "locked";
};

const getLabel = (node: MapNodeData): string => {
  if (node.state === "playing") {
    return "▶";
  }
  if (node.type === "boss") {
    return node.state === "cleared" ? "✓" : "★";
  }
  if (node.state === "cleared") {
    return "✓";
  }
  return String(node.contractLevel ?? "");
};

const MapPage: React.FC = () => {
  const navigate = useNavigationStore((state) => state.navigate);
  const goBack = useNavigationStore((state) => state.goBack);
  const gameId = useNavigationStore((state) => state.gameId);
  const mapZoneId = useNavigationStore((state) => state.mapZoneId);
  const isDailyMap = useNavigationStore((state) => state.isDailyMap);
  const setIsDailyMap = useNavigationStore((state) => state.setIsDailyMap);
  const pendingPreviewLevel = useNavigationStore(
    (state) => state.pendingPreviewLevel,
  );
  const setPendingPreviewLevel = useNavigationStore(
    (state) => state.setPendingPreviewLevel,
  );
  const pendingLevelCompletion = useNavigationStore(
    (state) => state.pendingLevelCompletion,
  );
  const setPendingLevelCompletion = useNavigationStore(
    (state) => state.setPendingLevelCompletion,
  );
  const { setThemeTemplate } = useTheme();
  const { setMusicPlaylist } = useMusicPlayer();
  const { account } = useAccountCustom();
  const {
    setup: {
      systemCalls: { replayLevel, startDailyGame, replayDailyLevel },
    },
  } = useDojo();
  const activeStoryRun = useActiveStoryAttempt();
  const activeDailyRun = useActiveDailyAttempt();
  const { challenge: dailyChallenge } = useCurrentChallenge();

  const { game, seed } = useGame({
    gameId: gameId ?? undefined,
    shouldLog: false,
  });
  const gameLevel = useGameLevel({ gameId: game?.id });
  const { zones } = useZoneProgress(account?.address, 0);
  const { entry: dailyEntry } = usePlayerEntry(
    dailyChallenge?.challenge_id,
    account?.address,
  );

  const zoneState = useMemo(
    () => {
      if (isDailyMap) {
        // Use DailyEntry as source of truth for daily progress
        if (dailyEntry && dailyEntry.joined_at > 0) {
          const packedStars = Number(dailyEntry.level_stars ?? 0);
          const stars: number[] = [];
          for (let i = 0; i < 10; i++) {
            stars.push((packedStars >> (i * 2)) & 0x3);
          }
          return {
            zoneId: mapZoneId,
            unlocked: true,
            highestCleared: Number(dailyEntry.highest_cleared ?? 0),
            levelStars: stars,
          };
        }
        // Fallback: no entry yet, show empty unlocked zone
        return {
          zoneId: mapZoneId,
          unlocked: true,
          highestCleared: 0,
          levelStars: Array(10).fill(0),
        };
      }
      const z = zones.find((zone) => zone.zoneId === mapZoneId);
      if (!z) return undefined;
      return {
        zoneId: z.zoneId,
        unlocked: z.unlocked,
        highestCleared: z.highestCleared ?? 0,
        levelStars: z.levelStars ?? [],
      };
    },
    [zones, mapZoneId, isDailyMap, dailyEntry],
  );

  const activeNode = useMemo(() => {
    if (isDailyMap && activeDailyRun && game && !game.over) {
      return { zoneId: mapZoneId, level: activeDailyRun.level };
    }
    if (activeStoryRun) {
      return { zoneId: activeStoryRun.zoneId, level: activeStoryRun.level };
    }
    return null;
  }, [isDailyMap, activeDailyRun, game, mapZoneId, activeStoryRun]);

  const settingsId = (mapZoneId - 1) * 2;
  const { settings: zoneSettings, isLoading: settingsLoading } = useSettings(settingsId);
  const passiveMutatorId = zoneSettings?.passiveMutatorId ?? 0;
  const { data: passiveMutator } = useMutatorDef(passiveMutatorId);
  const starModifier = passiveMutator?.starThresholdModifier ?? 128;

  const mapData = useMapData({
    seed,
    zoneId: mapZoneId,
    zoneState,
    activeStoryNode: activeNode,
    settings: settingsLoading ? undefined : zoneSettings,
    starThresholdModifier: starModifier,
  });

  // Per-zone seed: story zones get a fixed seed from zoneId, daily gets day-based seed
  const layoutSeed = useMemo(() => {
    if (isDailyMap) {
      const dayId = Math.floor(Date.now() / 86400000);
      return BigInt(dayId) * 7919n + BigInt(mapZoneId);
    }
    return BigInt(mapZoneId) * 48271n + 12347n;
  }, [isDailyMap, mapZoneId]);

  const zoneLayouts = useMapLayout({
    seed: layoutSeed,
    totalZones: 1,
    nodesPerZone: NODES_PER_ZONE,
  });

  const [selectedNode, setSelectedNode] = useState<MapNodeData | null>(null);
  const [showGreeting, setShowGreeting] = useState(false);

  const guardian = getZoneGuardian(mapZoneId);

  useEffect(() => {
    setMusicPlaylist(["main", "level"]);
  }, [setMusicPlaylist]);

  const zoneThemeId = getZoneTheme(mapZoneId);
  useEffect(() => {
    setThemeTemplate(zoneThemeId);
  }, [zoneThemeId, setThemeTemplate]);

  useEffect(() => {
    if (pendingPreviewLevel == null) return;
    const node = mapData.nodes.find(
      (n) =>
        n.contractLevel === pendingPreviewLevel &&
        canOpenPreview(n),
    );
    if (node) setSelectedNode(node);
    setPendingPreviewLevel(null);
  }, [
    mapData.nodes,
    pendingPreviewLevel,
    setPendingPreviewLevel,
  ]);

  const storyZoneProgress = useMemo(
    () => zones.find((z) => z.zoneId === mapZoneId),
    [zones, mapZoneId],
  );

  // For daily, use game-derived zoneState; for story, use zone progress from chain
  const zoneProgressData = isDailyMap && zoneState
    ? { ...storyZoneProgress, ...zoneState, stars: zoneState.levelStars.reduce((a: number, b: number) => a + b, 0) }
    : storyZoneProgress;

  const [dailyStarting, setDailyStarting] = useState(false);

  const handlePlay = async () => {
    if (!account || !selectedNode || selectedNode.contractLevel == null) return;

    // Daily mode: start/resume daily games
    if (isDailyMap) {
      // If there's an active non-over daily game for this level, resume it
      if (activeDailyRun && game && !game.over && activeDailyRun.level === selectedNode.contractLevel) {
        setSelectedNode(null);
        navigate("play", activeDailyRun.gameId);
        return;
      }

      // Can't start a new level while one is in progress
      if (activeDailyRun && game && !game.over) {
        showToast({ message: `Daily level ${activeDailyRun.level} is still in progress.`, type: "error" });
        return;
      }

      if (dailyStarting) return;
      setDailyStarting(true);
      try {
        let result: { game_id: bigint };
        if (selectedNode.state === "cleared" || selectedNode.state === "visited") {
          // Replay a previously cleared level
          result = await replayDailyLevel({ account, level: selectedNode.contractLevel });
        } else {
          // Start next level (contract auto-advances to highest_cleared + 1)
          result = await startDailyGame({ account });
        }
        if (result.game_id !== 0n) {
          setSelectedNode(null);
          await new Promise((r) => setTimeout(r, 1500));
          navigate("play", result.game_id);
        }
      } catch (error) {
        console.error("Failed to start daily level:", error);
      } finally {
        setDailyStarting(false);
      }
      return;
    }

    if (activeStoryRun && activeStoryRun.gameId !== 0n) {
      const isPlayingNode =
        selectedNode.zone === activeStoryRun.zoneId &&
        selectedNode.contractLevel === activeStoryRun.level;

      if (isPlayingNode) {
        setSelectedNode(null);
        navigate("play", activeStoryRun.gameId);
        return;
      }

      // Allow replay of cleared levels even with an active run
      if (selectedNode.state !== "cleared" && selectedNode.state !== "visited") {
        showToast({
          message: `Run in progress on Zone ${activeStoryRun.zoneId}, Level ${activeStoryRun.level}.`,
          type: "error",
        });
        return;
      }
    }

    try {
      const result = await replayLevel({
        account,
        zone_id: selectedNode.zone,
        level: selectedNode.contractLevel,
      });
      if (result.game_id !== 0n) {
        setSelectedNode(null);
        navigate("play", result.game_id);
      }
    } catch (error) {
      console.error("Failed to start story level:", error);
    }
  };

  const themeId: ThemeId = isValidThemeId(zoneThemeId) ? zoneThemeId : "theme-1";
  const colors = getThemeColors(themeId);
  const themeImages = getThemeImages(themeId);
  const pathTheme = getMapPathTheme(themeId);
  const layout = zoneLayouts[0];
  const nodes = mapData.nodes;
  const zoneName = isDailyMap ? "Daily" : (ZONE_NAMES[mapZoneId] ?? `Zone ${mapZoneId}`);
  const zoneStars = useMemo(() => {
    if (isDailyMap && game) {
      let total = 0;
      for (let i = 1; i <= 10; i++) total += game.getLevelStars(i);
      return total;
    }
    return zoneProgressData?.stars ?? 0;
  }, [isDailyMap, game, zoneProgressData]);

  // For first visit detection, use story zone progress (not daily/game-derived state)
  const storyZoneStars = zoneProgressData?.stars ?? 0;
  const storyHighestCleared = zoneProgressData?.highestCleared ?? 0;
  const greetedZones = useNavigationStore((state) => state.greetedZones);
  const markZoneGreeted = useNavigationStore((state) => state.markZoneGreeted);
  const isFirstVisit = !isDailyMap && zoneProgressData !== undefined && storyZoneStars === 0 && storyHighestCleared === 0;
  const alreadyGreeted = greetedZones.has(mapZoneId);
  const [dataStabilized, setDataStabilized] = useState(false);

  // Stabilize as soon as Torii responds (zoneProgressData defined), or after 1500ms ceiling.
  useEffect(() => {
    setDataStabilized(false);
    const timer = setTimeout(() => setDataStabilized(true), 1500);
    return () => clearTimeout(timer);
  }, [mapZoneId]);

  useEffect(() => {
    if (zoneProgressData !== undefined) setDataStabilized(true);
  }, [zoneProgressData]);

  // Auto-show guardian greeting only on first visit to a zone (session-stable via store).
  // Never show after level completion — pendingLevelCompletion means we just came from PlayScreen.
  useEffect(() => {
    if (!dataStabilized || alreadyGreeted || isDailyMap || pendingLevelCompletion) return;
    if (zoneProgressData === undefined || !zoneProgressData.unlocked) return;
    if (storyZoneStars === 0 && storyHighestCleared === 0) {
      setShowGreeting(true);
      markZoneGreeted(mapZoneId);
    }
  }, [dataStabilized, zoneProgressData, storyZoneStars, storyHighestCleared, alreadyGreeted, isDailyMap, mapZoneId, markZoneGreeted, pendingLevelCompletion]);

  return (
    <div className="relative flex h-full flex-col">
      <ZoneBackground zone={mapZoneId} themeId={themeId} />

      {/* Floating overlay: back + zone name + stars + info */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-[clamp(12px,3vw,20px)] pt-[clamp(12px,3vw,20px)] pb-1 pointer-events-none"
      >
        {/* Left: back + zone name */}
        <div className="flex items-center gap-[clamp(6px,1.5vw,12px)] pointer-events-auto">
          <button
            onClick={() => { if (isDailyMap) setIsDailyMap(false); goBack(); }}
            className="flex h-[clamp(32px,7vw,44px)] w-[clamp(32px,7vw,44px)] items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur-md shrink-0"
            style={{ color: colors.accent }}
          >
            <ChevronLeft className="w-[50%] h-[50%]" />
          </button>
          <span className="font-display text-[clamp(18px,4.5vw,28px)] font-black text-white drop-shadow-md">
            {zoneName}
          </span>
        </div>

        {/* Right: stars */}
        <div className="flex items-center gap-[clamp(4px,1vw,8px)] pointer-events-none">
          <span className="font-display text-[clamp(14px,3.5vw,22px)] font-black drop-shadow-md" style={{ color: zoneProgressData?.perfectionClaimed ? "#ec4899" : colors.accent }}>
            {zoneStars}/30 ★
          </span>
          {zoneStars >= 30 && !zoneProgressData?.perfectionClaimed && (
            <span className="flex h-[clamp(18px,4vw,26px)] w-[clamp(18px,4vw,26px)] items-center justify-center rounded-full bg-pink-500/30 text-[clamp(9px,2vw,14px)] drop-shadow-md">🎁</span>
          )}
          {zoneProgressData?.perfectionClaimed && (
            <span className="flex h-[clamp(18px,4vw,26px)] w-[clamp(18px,4vw,26px)] items-center justify-center rounded-full bg-pink-500/20 text-[clamp(9px,2vw,14px)] drop-shadow-md">💎</span>
          )}
        </div>
      </motion.div>

      {/* Map SVG */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div className="relative mx-auto h-full w-full max-w-[540px]">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 h-full w-full transition-opacity duration-300"
            style={{ opacity: (showGreeting || selectedNode) ? 0.3 : 1 }}
          >
            {/* Paths */}
            {layout?.edges.map((edge) => {
              const fromPt = layout.points[edge.from];
              const toPt = layout.points[edge.to];
              if (!fromPt || !toPt) return null;

              const fromX = fromPt.x * VB_W;
              const fromY = fromPt.y * VB_H;
              const toX = toPt.x * VB_W;
              const toY = toPt.y * VB_H;
              const midY = (fromY + toY) / 2;
              const d = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

              const fromNode = nodes[edge.from];
              const toNode = nodes[edge.to];
              if (!fromNode || !toNode) return null;

              const pathType = getPathType(fromNode.state, toNode.state);

              const stroke =
                pathType === "cleared"
                  ? pathTheme.clearedColor
                  : pathType === "active"
                    ? pathTheme.activeColor
                    : pathTheme.lockedColor;
              const sw =
                pathType === "locked"
                  ? pathTheme.lockedStrokeWidth
                  : pathTheme.strokeWidth;
              const opacity = pathType === "locked" ? 0.5 : 0.85;
              const dash =
                pathType === "locked"
                  ? pathTheme.lockedDash
                  : pathTheme.pathStyle === "dashed"
                    ? "8 4"
                    : pathTheme.pathStyle === "dotted"
                      ? "2 3"
                      : undefined;

              return (
                <g key={`path-${edge.from}-${edge.to}`}>
                  {pathTheme.pathStyle === "double" && (
                    <motion.path
                      d={d}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={sw + 1.6}
                      strokeLinecap="round"
                      initial={!dash ? { pathLength: 0 } : undefined}
                      animate={!dash ? { pathLength: 1 } : undefined}
                      transition={{
                        delay: 0.3 + edge.from * 0.05,
                        duration: 0.5,
                        ease: "easeInOut",
                      }}
                      opacity={opacity * 0.35}
                    />
                  )}
                  <motion.path
                    d={d}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={sw}
                    strokeLinecap="round"
                    initial={!dash ? { pathLength: 0 } : undefined}
                    animate={!dash ? { pathLength: 1 } : undefined}
                    transition={{
                      delay: 0.3 + edge.from * 0.05,
                      duration: 0.5,
                      ease: "easeInOut",
                    }}
                    opacity={opacity}
                    strokeDasharray={dash}
                  />
                </g>
              );
            })}

            {/* Guardian node — bottom-right, aligned with level 1, loads first */}
            {(() => {
              const level1Pt = layout?.points[0];
              const guardianX = 0.82 * VB_W;
              const guardianY = level1Pt ? level1Pt.y * VB_H : 0.92 * VB_H;
              const gr = 5;
              const badgeR = 2;
              const badgeX = guardianX + gr * 0.7;
              const badgeY = guardianY + gr * 0.7;
              return (
                <motion.g
                  onClick={() => setShowGreeting(true)}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [1, 1.04, 1], opacity: 1 }}
                  transition={{ scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }, opacity: { delay: 0.1, duration: 0.3 } }}
                  style={{ cursor: "pointer", transformOrigin: `${guardianX}px ${guardianY}px` }}
                >
                  <clipPath id="guardian-clip">
                    <circle cx={guardianX} cy={guardianY} r={gr} />
                  </clipPath>
                  <image
                    href={getGuardianPortrait(mapZoneId)}
                    x={guardianX - gr}
                    y={guardianY - gr}
                    width={gr * 2}
                    height={gr * 2}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath="url(#guardian-clip)"
                  />
                  <circle cx={guardianX} cy={guardianY} r={gr} fill="none" stroke={colors.accent} strokeWidth={0.6} />
                  <circle cx={badgeX} cy={badgeY} r={badgeR} fill={colors.accent} />
                  <text x={badgeX} y={badgeY + 0.2} textAnchor="middle" dominantBaseline="central" fill="#0a1628" fontSize={2.4} fontWeight="bold" fontFamily="Outfit, sans-serif">?</text>
                  <text x={guardianX} y={guardianY + gr + 2.5} textAnchor="middle" dominantBaseline="central" fill={colors.accent} fontSize={2} fontWeight="bold" fontFamily="Outfit, sans-serif">{guardian.name}</text>
                </motion.g>
              );
            })()}

            {/* Level nodes */}
            {nodes.map((node) => {
              const pt = layout?.points[node.nodeInZone];
              if (!pt) return null;

              const cx = pt.x * VB_W;
              const cy = pt.y * VB_H;
              const stateColors = STATE_COLORS[node.state];
              const isPlayingNode =
                activeStoryRun !== null &&
                node.zone === activeStoryRun.zoneId &&
                node.contractLevel === activeStoryRun.level;
              const blockedByActiveRun =
                activeStoryRun !== null && !isPlayingNode;
              const isInteractive =
                node.state !== "locked" && !blockedByActiveRun;
              const label = getLabel(node);

              const isCleared =
                node.state === "cleared" || node.state === "visited";
              const nodeImg =
                node.type === "boss"
                  ? themeImages.mapNodeBoss
                  : isCleared
                    ? themeImages.mapNodeCompleted
                    : themeImages.mapNodeLevel;
              const r = node.type === "boss" ? 7.5 : 5;

              return (
                <motion.g
                  key={`node-${node.nodeInZone}`}
                  onClick={() => {
                    if (activeStoryRun && !isPlayingNode) {
                      showToast({
                        message: `Run in progress on Zone ${activeStoryRun.zoneId}, Level ${activeStoryRun.level}.`,
                        type: "error",
                      });
                      return;
                    }

                    if (activeStoryRun && isPlayingNode) {
                      navigate("play", activeStoryRun.gameId);
                      return;
                    }

                    if (!isInteractive) return;
                    if (canOpenPreview(node)) {
                      setSelectedNode(node);
                    }
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: stateColors.alpha }}
                  transition={{
                    delay: node.nodeInZone * 0.06,
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                  style={{
                    cursor: isInteractive ? "pointer" : "default",
                    transformOrigin: `${cx}px ${cy}px`,
                  }}
                >
                  <clipPath id={`node-clip-${node.nodeInZone}`}>
                    <circle cx={cx} cy={cy} r={r} />
                  </clipPath>
                  <image
                    href={nodeImg}
                    x={cx - r}
                    y={cy - r}
                    width={r * 2}
                    height={r * 2}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#node-clip-${node.nodeInZone})`}
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={node.state === "playing" ? colors.accent : stateColors.border}
                    strokeWidth={
                      node.state === "playing"
                        ? 1.5
                        : node.type === "boss"
                          ? 0.6
                          : 0.4
                    }
                  />

                  {node.state === "playing" && (
                    <>
                      <motion.circle
                        cx={cx}
                        cy={cy}
                        r={r + 2.5}
                        fill={colors.accent}
                        initial={{ opacity: 0.1 }}
                        animate={{ opacity: [0.1, 0.3, 0.1] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <motion.circle
                        cx={cx}
                        cy={cy}
                        r={r + 1.8}
                        fill="none"
                        stroke={colors.accent}
                        strokeWidth={1}
                        initial={{ opacity: 0.9, scale: 1 }}
                        animate={{ opacity: 0.25, scale: 1.35 }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                      />
                    </>
                  )}

                  <>
                    <circle
                      cx={cx + r * 0.7}
                      cy={cy + r * 0.7}
                      r={2}
                      fill="rgba(0,0,0,0.75)"
                      stroke={stateColors.border}
                      strokeWidth={0.3}
                    />
                    <text
                      x={cx + r * 0.7}
                      y={cy + r * 0.7 + 0.1}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      fontSize={2.2}
                      fontWeight="bold"
                      fontFamily="Outfit, sans-serif"
                    >
                      {label}
                    </text>
                  </>

                  {node.type === "classic" &&
                    node.state !== "locked" &&
                    node.contractLevel !== null && (
                      <g>
                        {[0, 1, 2].map((i) => {
                          const stars = zoneProgressData?.levelStars?.[node.contractLevel! - 1] ?? 0;
                          const filled = stars > i;
                          const starX = cx - 2.5 + i * 2.5;
                          const starY = cy + r + 2.5;
                          return (
                            <motion.text
                              key={i}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{
                                opacity: 1,
                                scale: 1,
                                fill: filled ? "#FACC15" : "rgba(255,255,255,0.3)",
                              }}
                              transition={{
                                delay: node.nodeInZone * 0.06 + 0.3 + i * 0.1,
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                              }}
                              style={{ transformOrigin: `${starX}px ${starY}px` }}
                              x={starX}
                              y={starY}
                              fontSize={2}
                              textAnchor="middle"
                            >
                              ★
                            </motion.text>
                          );
                        })}
                      </g>
                    )}

                </motion.g>
              );
            })}


          </svg>
        </div>

        {selectedNode && !pendingLevelCompletion && (
          <LevelPreview
            node={selectedNode}
            game={game ?? null}
            gameLevel={gameLevel}
            gameId={gameId}
            zoneId={mapZoneId}
            colors={colors}
            settings={settingsLoading ? undefined : zoneSettings}
            hasSeed={seed !== 0n}
            levelStars={zoneProgressData?.levelStars ?? []}
            onPlay={handlePlay}
            onClose={() => setSelectedNode(null)}
          />
        )}

        {pendingLevelCompletion && (
          <LevelCompleteDialog
            isOpen={true}
            onClose={() => {
              const completedLevel = pendingLevelCompletion.level;
              const wasIncomplete = pendingLevelCompletion.isIncomplete;
              setPendingLevelCompletion(null);
              if (!wasIncomplete && completedLevel < 10) {
                setPendingPreviewLevel(completedLevel + 1);
              }
            }}
            level={pendingLevelCompletion.level}
            levelMoves={pendingLevelCompletion.levelMoves}
            prevTotalScore={pendingLevelCompletion.prevTotalScore}
            totalScore={pendingLevelCompletion.totalScore}
            gameLevel={pendingLevelCompletion.gameLevel}
            zoneId={mapZoneId}
            colors={colors}
            isIncomplete={pendingLevelCompletion.isIncomplete}
            draftWillOpen={false}
          />
        )}

        {showGreeting && (
          <GuardianGreeting
            colors={colors}
            guardian={guardian}
            mode={isDailyMap ? "daily" : "story"}
            activeMutatorId={isDailyMap && dailyChallenge ? dailyChallenge.active_mutator_id : mapZoneId * 2 - 1}
            passiveMutatorId={isDailyMap && dailyChallenge ? dailyChallenge.passive_mutator_id : mapZoneId * 2}
            isFirstVisit={isFirstVisit}
            bossCleared={storyZoneProgress?.bossCleared ?? false}
            onClose={() => setShowGreeting(false)}
          />
        )}

        {nodes.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="rounded-2xl border border-white/20 bg-black/45 px-4 py-3 font-sans text-sm font-semibold text-white/80 backdrop-blur-md">
              Loading map...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;
