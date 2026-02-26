import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGame } from "@/hooks/useGame";
import { useGameLevel } from "@/hooks/useGameLevel";
import { useDraft } from "@/hooks/useDraft";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useDojo } from "@/dojo/useDojo";
import {
  NODES_PER_ZONE,
  TOTAL_ZONES,
  useMapData,
  type MapNodeData,
  type NodeState,
} from "@/hooks/useMapData";
import { useMapLayout } from "@/hooks/useMapLayout";
import { showToast } from "@/utils/toast";
import {
  getMapPathTheme,
  getThemeImages,
  isValidThemeId,
  THEME_META,
  type ThemeId,
} from "@/config/themes";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { useNavigationStore } from "@/stores/navigationStore";
import {
  getDraftEventForCompletedLevel,
  getDraftEventForZoneNode,
  getStoredDraftPick,
  isDraftEventCompleted,
} from "@/utils/draftEvents";
import PageTopBar from "@/ui/navigation/PageTopBar";
import LevelPreview from "@/ui/components/map/LevelPreview";
import LevelCompleteDialog from "@/ui/components/LevelCompleteDialog";
import ZoneBackground from "@/ui/components/map/ZoneBackground";
import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";
import { Button } from "@/ui/elements/button";
import { getSkillById, getArchetypeForSkill, getSkillTier } from "@/dojo/game/types/skillData";
import { getSkillEffectDescription } from "@/dojo/game/types/skillEffects";
import { getSkillTierIconPath } from "@/ui/theme/ImageAssets";
import { getSlotBySkillId } from "@/dojo/game/helpers/runDataPacking";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SWIPE_THRESHOLD = 50;
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
};

const DRAFT_KIND_LABELS: Record<string, string> = {
  new_powerup: "New Powerup",
  upgrade_powerup: "Upgrade",
  zone_modifier: "Zone Modifier",
  risk_contract: "Risk Contract",
  relic: "Relic",
};

const DRAFT_POOL_LABELS: Record<string, string> = {
  powerup: "Powerup Pool",
  upgrade: "Upgrade Pool",
  world: "World Pool",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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
    (toState === "current" || toState === "available")
  ) {
    return "active";
  }
  return "locked";
};

const getLabel = (node: MapNodeData): string => {
  if (node.type === "draft") {
    return node.state === "visited" ? "\u2713" : "DRAFT";
  }
  if (node.type === "boss") {
    return node.state === "cleared" ? "\u2713" : "\u2605";
  }
  if (node.state === "cleared") {
    return "\u2713";
  }
  return String(node.contractLevel ?? "");
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const MapPage: React.FC = () => {
  const navigate = useNavigationStore((state) => state.navigate);
  const goBack = useNavigationStore((state) => state.goBack);
  const gameId = useNavigationStore((state) => state.gameId);
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
  const pendingDraftEvent = useNavigationStore(
    (state) => state.pendingDraftEvent,
  );
  const setPendingDraftEvent = useNavigationStore(
    (state) => state.setPendingDraftEvent,
  );
  const { setThemeTemplate } = useTheme();
  const { setMusicPlaylist } = useMusicPlayer();
  const { account } = useAccountCustom();
  const {
    setup: {
      systemCalls: { startNextLevel },
    },
  } = useDojo();

  const { game, seed } = useGame({
    gameId: gameId ?? undefined,
    shouldLog: false,
  });
  const draftState = useDraft({ gameId: gameId ?? undefined });
  const gameLevel = useGameLevel({ gameId: game?.id });

  // GameSeed.seed is now stable (never overwritten). level_seed holds per-level VRF.

  const currentLevel = game?.level ?? 1;
  const mapData = useMapData({ seed, currentLevel, draftState });
  const zoneLayouts = useMapLayout({
    seed,
    totalZones: TOTAL_ZONES,
    nodesPerZone: NODES_PER_ZONE,
  });

  const [activeZone, setActiveZone] = useState(
    Math.max(0, mapData.currentZone - 1),
  );
  const [selectedNode, setSelectedNode] = useState<MapNodeData | null>(null);
  const [resolvedDraftModal, setResolvedDraftModal] = useState<{
    title: string;
    description: string;
    kind: string;
    pool: string;
    zone: number;
    skillId: number;
  } | null>(null);
  const pointerStartX = useRef<number | null>(null);
  const pointerId = useRef<number | null>(null);

  useEffect(() => {
    setActiveZone(Math.max(0, mapData.currentZone - 1));
  }, [mapData.currentZone]);

  useEffect(() => {
    setMusicPlaylist(["main", "level"]);
  }, [setMusicPlaylist]);

  useEffect(() => {
    if (gameId === null) return;
    if (!pendingDraftEvent) return;

    if (isDraftEventCompleted(draftState, pendingDraftEvent)) {
      setPendingDraftEvent(null);
      return;
    }

    navigate("draft", gameId);
  }, [draftState, gameId, navigate, pendingDraftEvent, setPendingDraftEvent]);

  // Only switch theme/music when the player's current zone changes (zone cleared),
  // NOT when swiping between zones on the map.
  useEffect(() => {
    const currentZoneIdx = Math.max(0, mapData.currentZone - 1);
    const themeRaw = mapData.zoneThemes[currentZoneIdx] ?? "theme-1";
    const themeId: ThemeId = isValidThemeId(themeRaw) ? themeRaw : "theme-1";
    setThemeTemplate(themeId);
  }, [mapData.currentZone, mapData.zoneThemes, setThemeTemplate]);

  useEffect(() => {
    if (pendingPreviewLevel == null) return;
    const node = mapData.nodes.find(
      (n) => n.contractLevel === pendingPreviewLevel && canOpenPreview(n),
    );
    if (node) {
      setActiveZone(node.zone - 1);
    }
    setPendingPreviewLevel(null);
  }, [pendingPreviewLevel, mapData.nodes, setPendingPreviewLevel]);

  /* Split nodes into per-zone arrays */
  const zoneNodes = useMemo(
    () =>
      Array.from({ length: TOTAL_ZONES }, (_, zoneIdx) => {
        const start = zoneIdx * NODES_PER_ZONE;
        return mapData.nodes.slice(start, start + NODES_PER_ZONE);
      }),
    [mapData.nodes],
  );

  const completionDraftEvent = useMemo(() => {
    if (!pendingLevelCompletion) return null;
    return getDraftEventForCompletedLevel(seed, pendingLevelCompletion.level);
  }, [pendingLevelCompletion, seed]);


  /* ---- Swipe handlers (Pointer Events for reliable mobile) ---- */

  const isSwiping = useRef(false);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartX.current = event.clientX;
    pointerId.current = event.pointerId;
    isSwiping.current = false;
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null || isSwiping.current) return;
    const delta = Math.abs(event.clientX - pointerStartX.current);
    if (delta > 10) {
      isSwiping.current = true;
      (event.currentTarget as HTMLDivElement).setPointerCapture(
        event.pointerId,
      );
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null) return;
    const deltaX = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    pointerId.current = null;

    if (!isSwiping.current) return;
    isSwiping.current = false;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

    if (deltaX < 0) {
      setActiveZone((prev) => Math.min(prev + 1, TOTAL_ZONES - 1));
    } else {
      setActiveZone((prev) => Math.max(prev - 1, 0));
    }
  };

  const onPointerCancel = () => {
    pointerStartX.current = null;
    pointerId.current = null;
    isSwiping.current = false;
  };

  const handlePlay = () => {
    if (gameId === null) return;

    // Fire startNextLevel if the chain is waiting for it (level transition pending).
    // Navigate immediately — PlayScreen shows "Loading grid" until the tx completes.
    if (game?.levelTransitionPending && account) {
      startNextLevel({
        account,
        game_id: game.id,
        current_level: game.level,
      }).catch((error: unknown) => {
        console.error("Failed to start next level:", error);
      });
    }

    navigate("play", gameId);
  };

  const activeThemeRaw = mapData.zoneThemes[activeZone] ?? "theme-1";
  const activeThemeId: ThemeId = isValidThemeId(activeThemeRaw) ? activeThemeRaw : "theme-1";
  const zoneName = THEME_META[activeThemeId].name;

  return (
    <div className="h-screen-viewport flex flex-col">
      <PageTopBar
        title="WORLD MAP"
        subtitle={`Zone ${activeZone + 1} - ${zoneName}`}
        onBack={goBack}
        rightSlot={null}
      />

      {/* ---- Map viewport ---- */}
      <div
        className="relative min-h-0 flex-1 overflow-hidden"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <motion.div
          className="flex h-full"
          style={{ width: `${TOTAL_ZONES * 100}%` }}
          animate={{ x: `${-activeZone * 100}vw` }}
          transition={{ type: "spring", stiffness: 280, damping: 32 }}
        >
          {zoneNodes.map((nodes, zoneIdx) => {
            const zone = zoneIdx + 1;
            const themeRaw = mapData.zoneThemes[zoneIdx] ?? "theme-1";
            const themeId: ThemeId = isValidThemeId(themeRaw)
              ? themeRaw
              : "theme-1";
            const themeImages = getThemeImages(themeId);
            const layout = zoneLayouts[zoneIdx];
            const pathTheme = getMapPathTheme(themeId);

            return (
              <div
                key={zone}
                className="relative h-full flex-shrink-0"
                style={{ width: "100vw" }}
              >
                <ZoneBackground zone={zone} themeId={themeId} />
                <div className="relative mx-auto h-full w-auto max-w-full aspect-[9/16]">
                  <svg
                    viewBox={`0 0 ${VB_W} ${VB_H}`}
                    preserveAspectRatio="xMidYMid meet"
                    className="absolute inset-0 h-full w-full"
                  >
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

                      const pathType = getPathType(
                        fromNode.state,
                        toNode.state,
                      );

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
                        <g key={`main-${zoneIdx}-${edge.from}-${edge.to}`}>
                          {pathTheme.pathStyle === "double" && (
                            <path
                              d={d}
                              fill="none"
                              stroke={stroke}
                              strokeWidth={sw + 1.6}
                              strokeLinecap="round"
                              opacity={opacity * 0.35}
                            />
                          )}
                          <path
                            d={d}
                            fill="none"
                            stroke={stroke}
                            strokeWidth={sw}
                            strokeLinecap="round"
                            opacity={opacity}
                            strokeDasharray={dash}
                          />
                        </g>
                      );
                    })}

                    {nodes.map((node) => {

                      const pt = layout?.points[node.nodeInZone];
                      if (!pt) return null;

                      const cx = pt.x * VB_W;
                      const cy = pt.y * VB_H;
                      const colors = STATE_COLORS[node.state];
                      const isInteractive = node.state !== "locked";
                      const label = getLabel(node);

                      const isCleared =
                        node.state === "cleared" || node.state === "visited";
                      const nodeImg =
                        node.type === "boss"
                          ? themeImages.mapNodeBoss
                          : node.type === "draft"
                            ? themeImages.mapNodeDraft
                            : isCleared
                              ? themeImages.mapNodeCompleted
                              : themeImages.mapNodeLevel;
                      const r =
                        node.type === "boss"
                          ? 7.5
                          : node.type === "draft"
                            ? 5.5
                            : 5;

                      return (
                        <g
                          key={`node-${zoneIdx}-${node.nodeInZone}`}
                          onClick={() => {
                            if (!isInteractive) {
                              return;
                            }

                            if (node.type === "draft") {
                              if (gameId === null) {
                                showToast({
                                  message: "No active run found.",
                                  type: "error",
                                });
                                return;
                              }

                              const event = getDraftEventForZoneNode(
                                seed,
                                node.zone,
                                currentLevel,
                                draftState,
                                node.draftPhase ?? "entry",
                              );

                              if (!event) {
                                showToast({
                                  message:
                                    "No unlocked draft in this zone yet.",
                                  type: "error",
                                });
                                return;
                              }

                              if (
                                isDraftEventCompleted(draftState, event)
                              ) {
                                const pick = getStoredDraftPick(draftState, event);

                                if (!pick) {
                                  showToast({
                                    message:
                                      "Draft completed, but no saved choice found.",
                                    type: "error",
                                  });
                                  return;
                                }

                                setResolvedDraftModal({
                                  title: pick.title,
                                  description: pick.description,
                                  kind: pick.kind,
                                  pool: pick.pool,
                                  zone: event.zone,
                                  skillId: pick.skillId,
                                });
                                return;
                              }

                              setPendingDraftEvent(event);
                              navigate("draft", gameId);
                              return;
                            }

                            if (canOpenPreview(node)) {
                              setSelectedNode(node);
                            }
                          }}
                          style={{
                            cursor: isInteractive ? "pointer" : "default",
                            transformOrigin: `${cx}px ${cy}px`,
                            ...(node.state === "current"
                              ? {
                                  animation:
                                    "map-node-pulse 2s ease-in-out infinite",
                                }
                              : {}),
                          }}
                          opacity={colors.alpha}
                        >
                          <clipPath
                            id={`node-clip-${zoneIdx}-${node.nodeInZone}`}
                          >
                            <circle cx={cx} cy={cy} r={r} />
                          </clipPath>
                          <image
                            href={nodeImg}
                            x={cx - r}
                            y={cy - r}
                            width={r * 2}
                            height={r * 2}
                            preserveAspectRatio="xMidYMid slice"
                            clipPath={`url(#node-clip-${zoneIdx}-${node.nodeInZone})`}
                          />
                          <circle
                            cx={cx}
                            cy={cy}
                            r={r}
                            fill="none"
                            stroke={colors.border}
                            strokeWidth={node.type === "boss" ? 0.6 : 0.4}
                          />

                          {node.type !== "draft" && (
                            <>
                              <circle
                                cx={cx + r * 0.7}
                                cy={cy + r * 0.7}
                                r={2}
                                fill="rgba(0,0,0,0.75)"
                                stroke={colors.border}
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
                                fontFamily="Bangers"
                              >
                                {label}
                              </text>
                            </>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* ---- Zone navigation arrows ---- */}
        {activeZone > 0 && (
          <button
            type="button"
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/25 bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
            onClick={() => setActiveZone((prev) => Math.max(prev - 1, 0))}
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {activeZone < TOTAL_ZONES - 1 && (
          <button
            type="button"
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/25 bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
            onClick={() =>
              setActiveZone((prev) => Math.min(prev + 1, TOTAL_ZONES - 1))
            }
          >
            <ChevronRight size={22} />
          </button>
        )}

        {/* ---- Zone dots ---- */}
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {Array.from({ length: TOTAL_ZONES }, (_, idx) => (
            <button
              key={`zone-dot-${idx}`}
              type="button"
              onClick={() => setActiveZone(idx)}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                idx === activeZone ? "scale-125 bg-white" : "bg-white/45"
              }`}
              aria-label={`Go to zone ${idx + 1}`}
            />
          ))}
        </div>

        {/* ---- Level preview modal ---- */}
        {selectedNode && !pendingLevelCompletion && (
          <LevelPreview
            node={selectedNode}
            game={game ?? null}
            gameLevel={gameLevel}
            gameId={gameId}
            onPlay={handlePlay}
            onClose={() => setSelectedNode(null)}
          />
        )}

        {/* ---- Level complete overlay ---- */}
        {pendingLevelCompletion && (
          <LevelCompleteDialog
            isOpen={true}
            onClose={() => {
              const completedLevel = pendingLevelCompletion.level;

              setPendingLevelCompletion(null);

              if (completionDraftEvent) {
                setPendingDraftEvent(completionDraftEvent);
                navigate("draft", gameId ?? undefined);
              } else {
                setPendingPreviewLevel(completedLevel + 1);
              }
            }}
            level={pendingLevelCompletion.level}
            levelMoves={pendingLevelCompletion.levelMoves}
            prevTotalCubes={pendingLevelCompletion.prevTotalCubes}
            totalCubes={pendingLevelCompletion.totalCubes}
            prevTotalScore={pendingLevelCompletion.prevTotalScore}
            totalScore={pendingLevelCompletion.totalScore}
            gameLevel={pendingLevelCompletion.gameLevel}
            draftWillOpen={completionDraftEvent !== null}
          />
        )}


        <Dialog
          open={resolvedDraftModal !== null}
          onOpenChange={(open) => {
            if (!open) {
              setResolvedDraftModal(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-[400px] w-[90%] rounded-2xl border border-white/10 bg-slate-900/90 px-6 py-6">
            <DialogTitle className="text-2xl text-center mb-4 text-emerald-300">
              Draft Done
            </DialogTitle>

            {resolvedDraftModal && (() => {
              const skill = getSkillById(resolvedDraftModal.skillId);
              const archetype = getArchetypeForSkill(resolvedDraftModal.skillId);
              const slot = game ? getSlotBySkillId(game.runData, resolvedDraftModal.skillId) : undefined;
              const rawLevel = slot?.level ?? 0;
              const displayLevel = rawLevel + 1;
              const tier = getSkillTier(rawLevel);
              const effectDesc = getSkillEffectDescription(resolvedDraftModal.skillId, rawLevel);
              const accentColor = archetype?.color ?? "#22c55e";
              const isPassive = skill ? skill.category === "world" : false;
              const charges = slot?.charges ?? 0;

              return (
                <div className="flex flex-col items-center gap-4">
                  {/* Circular skill icon — matches GameActionBar style */}
                  {skill && (
                    <div className="relative">
                      <div
                        className="relative w-20 h-20 rounded-full overflow-visible flex items-center justify-center"
                        style={
                          isPassive
                            ? { boxShadow: `0 0 18px ${accentColor}50, 0 0 40px ${accentColor}20` }
                            : undefined
                        }
                      >
                        <img
                          src={getSkillTierIconPath(skill.name, tier)}
                          alt={skill.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                        {/* Ring border */}
                        <div
                          className="absolute inset-0 rounded-full border-[3px]"
                          style={{ borderColor: accentColor }}
                        />
                      </div>

                      {/* Level badge — bottom left */}
                      <span
                        className="absolute -bottom-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white z-10"
                        style={{ backgroundColor: isPassive ? accentColor : undefined }}
                      >
                        {isPassive ? (
                          <span>{displayLevel}</span>
                        ) : (
                          <span className="bg-indigo-500 rounded-full w-full h-full flex items-center justify-center">{displayLevel}</span>
                        )}
                      </span>

                      {/* Charges badge — top right, bonus only */}
                      {!isPassive && (
                        <span
                          className={`absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold z-10 ${
                            charges > 0 ? "bg-yellow-500 text-white" : "bg-slate-600 text-slate-400"
                          }`}
                        >
                          {charges}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Skill name + archetype */}
                  <div className="text-center">
                    <h3 className="font-['Fredericka_the_Great'] text-xl text-white">
                      Skill Drafted: {skill?.name ?? "Unknown"}
                    </h3>
                    {archetype && (
                      <p className="text-xs mt-1" style={{ color: accentColor }}>
                        {archetype.name} Archetype
                      </p>
                    )}
                  </div>

                  {/* Effect description */}
                  <div className="w-full rounded-lg bg-slate-800/60 px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Effect</p>
                    <p className="text-sm text-slate-200">{effectDesc}</p>
                  </div>
                </div>
              );
            })()}

            <div className="mt-2 flex justify-center">
              <Button onClick={() => setResolvedDraftModal(null)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MapPage;
