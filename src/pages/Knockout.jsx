import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, Trophy, Lock, LayoutList } from "lucide-react";
import TeamFlag from "../components/matches/TeamFlag";
import LiveBadge from "../components/matches/LiveBadge";
import { useMatches } from "../contexts/MatchesContext";
import { computeGroupStandings } from "../lib/utils";
import { format as dateFnsFormat } from "date-fns";
import { es } from "date-fns/locale";

const PHASE_ORDER = [
  "Ronda de 32",
  "Octavos de Final",
  "Cuartos de Final",
  "Semifinal",
  "Tercer Puesto",
  "Final",
];

const PHASE_SHORT = {
  "Ronda de 32": "R32",
  "Octavos de Final": "8vos",
  "Cuartos de Final": "4tos",
  Semifinal: "Semis",
  "Tercer Puesto": "3°",
  Final: "Final",
};

const PHASE_SIZE = {
  "Ronda de 32": "sm",
  "Octavos de Final": "sm",
  "Cuartos de Final": "md",
  Semifinal: "md",
  "Tercer Puesto": "md",
  Final: "final",
};

const NAV_PHASES = ["Ronda de 32", "Octavos de Final", "Cuartos de Final", "Semifinal", "Final"];

// ── Tournament path ──────────────────────────────────────────────────────────
function TournamentPath({ phaseStatus, selected, onSelect }) {
  const displayPhases = NAV_PHASES.filter((p) => phaseStatus[p] !== "locked");
  return (
    <div className="overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: "none" }}>
      <div className="flex items-center" style={{ minWidth: "max-content", padding: "4px 2px" }}>
        {displayPhases.map((phase, i) => {
          const status = phaseStatus[phase];
          const isSelected = selected === phase;
          const isDone = status === "done";
          const isActive = status === "active";
          const nodeColor = isSelected ? "#0a84ff" : isDone ? "#30d158" : isActive ? "#0a84ff" : "#3a3a3c";
          return (
            <div key={phase} className="flex items-center">
              <button
                onClick={(e) => { onSelect(phase); e.currentTarget.blur(); }}
                className="flex flex-col items-center gap-1.5 focus:outline-none"
                style={{ minWidth: 44 }}
              >
                <motion.div
                  animate={{
                    backgroundColor: nodeColor,
                    boxShadow: isSelected ? "0 0 14px rgba(10,132,255,0.55)" : "none",
                  }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 32, height: 32 }}
                >
                  {isDone && !isSelected ? (
                    <CheckCircle2 size={14} style={{ color: "#000" }} />
                  ) : isActive && !isSelected ? (
                    <span className="w-2 h-2 rounded-full bg-white live-pulse" />
                  ) : phase === "Final" ? (
                    <Trophy size={13} className="text-white" />
                  ) : (
                    <span className="font-black text-white" style={{ fontSize: 9 }}>
                      {PHASE_SHORT[phase]}
                    </span>
                  )}
                </motion.div>
                <span
                  className="text-[9px] font-bold uppercase tracking-wide text-center leading-none"
                  style={{ color: isSelected ? "#fff" : "#636366" }}
                >
                  {PHASE_SHORT[phase]}
                </span>
              </button>
              {i < displayPhases.length - 1 && (
                <motion.div
                  animate={{ backgroundColor: isDone ? "#30d158" : "#2c2c2e" }}
                  transition={{ duration: 0.4 }}
                  className="mx-1 rounded-full"
                  style={{ width: 20, height: 1.5 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── View toggle ──────────────────────────────────────────────────────────────
function ViewToggle({ view, onView }) {
  return (
    <div className="flex rounded-xl overflow-hidden shrink-0" style={{ background: "#1c1c1e" }}>
      {[
        { id: "list", icon: LayoutList, label: "Lista" },
        { id: "bracket", icon: Trophy, label: "Bracket" },
      ].map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={(e) => { onView(id); e.currentTarget.blur(); }}
          className="flex items-center gap-1.5 px-3 py-2 transition-all focus:outline-none"
          style={{ background: view === id ? "#0a84ff" : "transparent" }}
        >
          <Icon size={12} style={{ color: view === id ? "#fff" : "#636366" }} />
          <span className="text-[11px] font-black" style={{ color: view === id ? "#fff" : "#636366" }}>
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Apple Sports style bracket slot ─────────────────────────────────────────
function BracketRow({ team, score, isFinished, won, lost, tbd }) {
  const hasScore = isFinished && score !== null && score !== undefined;
  return (
    <div
      className="flex items-center gap-2 px-3"
      style={{
        height: 38,
        background: won ? "rgba(48,209,88,0.08)" : "transparent",
        borderLeft: won ? "2px solid rgba(48,209,88,0.45)" : "2px solid transparent",
      }}
    >
      {tbd ? (
        <div className="rounded-sm shrink-0" style={{ width: 24, height: 16, background: "#3a3a3c" }} />
      ) : (
        <div style={{ transform: "scale(0.75)", transformOrigin: "left center", width: 24, height: 16, overflow: "hidden" }}>
          <TeamFlag code={team?.flag_code} size="sm" short={team?.short} />
        </div>
      )}
      <span
        className="flex-1 text-xs font-semibold truncate leading-none"
        style={{ color: lost ? "#48484a" : won ? "#fff" : "#aeaeb2" }}
      >
        {tbd ? "Por definir" : (team?.name ?? "?")}
      </span>
      {hasScore && (
        <span
          className="text-sm font-black tabular-nums ml-1 shrink-0"
          style={{ color: lost ? "#48484a" : won ? "#fff" : "#636366" }}
        >
          {score}
        </span>
      )}
    </div>
  );
}

function BracketSlot({ match, wide = false }) {
  const slotW = wide ? 184 : 160;
  if (!match) {
    return (
      <div className="rounded-xl overflow-hidden" style={{ background: "#1c1c1e", minWidth: slotW }}>
        {[0, 1].map((i) => (
          <div key={i}>
            {i === 1 && <div className="h-px" style={{ background: "#2c2c2e" }} />}
            <div className="flex items-center gap-2 px-3" style={{ height: 38 }}>
              <div className="rounded-sm shrink-0" style={{ width: 24, height: 16, background: "#2c2c2e" }} />
              <div className="h-2 rounded-full" style={{ background: "#2c2c2e", flex: 1, opacity: 0.5 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const isFinished = match.status === "finished";
  const isLive = match.status === "live";
  const homeWon = isFinished && match.home_score > match.away_score;
  const awayWon = isFinished && match.away_score > match.home_score;
  const tbd = !match.home_team?.name || match.home_team.name === "?";

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "#1c1c1e",
        minWidth: slotW,
        border: isLive ? "1px solid rgba(255,69,58,0.3)" : "1px solid transparent",
        boxShadow: isLive ? "0 0 12px rgba(255,69,58,0.12)" : "none",
      }}
    >
      {isLive && <div className="h-[1.5px]" style={{ background: "linear-gradient(90deg, #ff453a, #ff9f0a, transparent)" }} />}
      <BracketRow
        team={match.home_team} score={match.home_score}
        isFinished={isFinished} won={homeWon} lost={awayWon} tbd={tbd}
      />
      <div className="h-px" style={{ background: "#2c2c2e" }} />
      <BracketRow
        team={match.away_team} score={match.away_score}
        isFinished={isFinished} won={awayWon} lost={homeWon} tbd={tbd}
      />
    </div>
  );
}

// ── SVG connector arm ────────────────────────────────────────────────────────
function BracketArm({ totalH, topY, botY, armW }) {
  const vx = Math.round(armW * 0.6);
  const cy = (topY + botY) / 2;
  const c = "rgba(80,80,85,0.55)";
  return (
    <svg width={armW} height={totalH} style={{ flexShrink: 0, display: "block" }}>
      <line x1={0} y1={topY} x2={vx} y2={topY} stroke={c} strokeWidth={1} strokeLinecap="round" />
      <line x1={vx} y1={topY} x2={vx} y2={botY} stroke={c} strokeWidth={1} />
      <line x1={0} y1={botY} x2={vx} y2={botY} stroke={c} strokeWidth={1} strokeLinecap="round" />
      <line x1={vx} y1={cy} x2={armW} y2={cy} stroke={c} strokeWidth={1} strokeLinecap="round" />
    </svg>
  );
}

// ── Bracket view ─────────────────────────────────────────────────────────────
function BracketView({ knockoutMatches }) {
  const qm = knockoutMatches.filter((m) => m.stage === "Cuartos de Final");
  const sm = knockoutMatches.filter((m) => m.stage === "Semifinal");
  const fm = knockoutMatches.filter((m) => m.stage === "Final");
  const tm = knockoutMatches.filter((m) => m.stage === "Tercer Puesto");

  if (qm.length === 0 && sm.length === 0 && fm.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 gap-2 text-center">
        <p className="text-sm font-black text-ios-label2">Bracket desde Cuartos</p>
        <p className="text-xs text-ios-label3">Disponible cuando arranquen cuartos de final</p>
      </div>
    );
  }

  // Slot geometry
  const SH = 78;   // slot height (2 rows × 38 + 2px divider)
  const IG = 8;    // inner gap between paired slots
  const GG = 20;   // gap between pair groups
  const AW = 22;   // arm width
  const SW = 168;  // slot width

  const pairH = SH * 2 + IG;

  // Vertical centers of each pair (relative to top of quarter column)
  const pair1C = SH + IG / 2;
  const pair2C = pairH + GG + SH + IG / 2;

  // Semi slot tops (aligned to pair centers)
  const s1Top = Math.round(pair1C - SH / 2);
  const s2Top = Math.round(pair2C - SH / 2);

  // Semi-to-final arm geometry
  const sArmH = s2Top + SH - s1Top;
  const sTopY = SH / 2;
  const sBotY = sArmH - SH / 2;
  const finalTop = s1Top + Math.round(sArmH / 2) - Math.round(SH / 2);

  const colLabel = (label) => (
    <p className="text-[10px] font-black text-ios-label3 uppercase tracking-[0.12em] text-center mb-3">
      {label}
    </p>
  );

  return (
    <div className="overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
      <div style={{ minWidth: "max-content" }}>
        {/* Column headers */}
        <div className="flex mb-1" style={{ gap: 0 }}>
          <div style={{ width: SW }}>{colLabel("Cuartos")}</div>
          <div style={{ width: AW }} />
          <div style={{ width: SW }}>{colLabel("Semis")}</div>
          <div style={{ width: AW }} />
          <div style={{ width: SW }}>{colLabel("Final")}</div>
        </div>

        {/* Bracket row */}
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          {/* Cuartos — 2 pairs */}
          <div style={{ display: "flex", flexDirection: "column", gap: GG }}>
            {[[qm[0], qm[1]], [qm[2], qm[3]]].map((pair, pi) => (
              <div key={pi} style={{ display: "flex", alignItems: "stretch" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: IG }}>
                  <BracketSlot match={pair[0]} />
                  <BracketSlot match={pair[1]} />
                </div>
                <BracketArm
                  totalH={pairH}
                  topY={Math.round(SH / 2)}
                  botY={pairH - Math.round(SH / 2)}
                  armW={AW}
                />
              </div>
            ))}
          </div>

          {/* Semis */}
          <div style={{ paddingTop: s1Top, display: "flex", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: s2Top - s1Top - SH }}>
              <BracketSlot match={sm[0]} />
              <BracketSlot match={sm[1]} />
            </div>
            <BracketArm totalH={sArmH} topY={sTopY} botY={sBotY} armW={AW} />
          </div>

          {/* Final */}
          <div style={{ paddingTop: s1Top + Math.round((s2Top + SH - s1Top) / 2) - Math.round(SH / 2) }}>
            <BracketSlot match={fm[0]} wide />
          </div>
        </div>

        {/* 3er Puesto */}
        {tm.length > 0 && (
          <div className="mt-5">
            <p className="text-[10px] font-black text-ios-label3 uppercase tracking-[0.12em] mb-2">
              Tercer Puesto
            </p>
            <BracketSlot match={tm[0]} wide />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Battle card (list view) ──────────────────────────────────────────────────
function BattleCard({ match, size = "sm" }) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const isScheduled = match.status === "scheduled";
  const homeWon = isFinished && match.home_score > match.away_score;
  const awayWon = isFinished && match.away_score > match.home_score;
  const isDraw = isFinished && match.home_score === match.away_score;
  const isFinal = size === "final";
  const isMd = size === "md";
  const tbd = !match.home_team?.name || match.home_team.name === "?";
  const flagSize = isFinal ? "lg" : "md";
  const scoreFS = isFinal ? 52 : isMd ? 44 : 36;

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: isFinal ? "linear-gradient(150deg, #111000 0%, #1c1c1e 60%)" : "#1c1c1e",
        border: isFinal ? "1px solid rgba(255,214,0,0.18)" : "1px solid transparent",
      }}
    >
      {isLive && (
        <div className="h-[2px]" style={{ background: "linear-gradient(90deg, #ff453a, #ff9f0a, transparent)" }} />
      )}
      {isFinal && !isLive && (
        <div className="h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #ffd60a 40%, #ffd60a 60%, transparent)" }} />
      )}
      {isLive && (
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,69,58,0.08) 0%, transparent 55%)" }} />
      )}

      <div className={`relative px-4 ${isFinal ? "pt-5 pb-6" : "pt-4 pb-5"}`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-1.5">
            {isFinal && <Trophy size={11} style={{ color: "#ffd60a" }} />}
            <span className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: isFinal ? "#ffd60a" : "#636366" }}>
              {match.stage}
            </span>
          </div>
          {isLive ? (
            <LiveBadge minute={match.minute} kickoffAt={match.kickoff_at} apiStatus={match.api_status} />
          ) : isFinished ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={10} style={{ color: "#30d158", opacity: 0.8 }} />
              <span className="text-[10px] font-bold text-ios-label3 uppercase tracking-wider">Final</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Clock size={10} className="text-ios-label3" />
              <span className="text-[11px] font-semibold text-ios-label2">
                {dateFnsFormat(new Date(match.kickoff_at), "d MMM · HH:mm", { locale: es })}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0" style={{ opacity: isFinished && awayWon ? 0.28 : 1, transition: "opacity 0.4s" }}>
            {tbd ? <div className="w-14 h-10 rounded-sm animate-pulse" style={{ background: "#2c2c2e" }} /> : <TeamFlag code={match.home_team.flag_code} size={flagSize} short={match.home_team.short} />}
            <span className="font-bold text-center leading-tight truncate w-full" style={{ fontSize: isFinal ? 12 : 11, color: homeWon ? "#fff" : "#98989d" }}>
              {tbd ? "Por definir" : match.home_team.name}
            </span>
            <AnimatePresence>
              {homeWon && (
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  className="px-2 py-0.5 rounded-full text-[9px] font-black"
                  style={{ background: isFinal ? "rgba(255,214,0,0.15)" : "rgba(48,209,88,0.15)", color: isFinal ? "#ffd60a" : "#30d158" }}>
                  {isFinal ? "CAMPEÓN" : "AVANZA"}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col items-center shrink-0 gap-1 min-w-[80px]">
            {isScheduled ? (
              <span className="font-black text-ios-label3" style={{ fontSize: isFinal ? 22 : 18 }}>vs</span>
            ) : (
              <div className="flex items-center">
                <span className="font-black tabular-nums leading-none" style={{ fontSize: scoreFS, letterSpacing: "-2px", color: homeWon ? "#fff" : isDraw ? "#aeaeb2" : "#3a3a3c" }}>{match.home_score}</span>
                <span className="font-light mx-1" style={{ fontSize: isFinal ? 22 : 18, color: "#48484a" }}>–</span>
                <span className="font-black tabular-nums leading-none" style={{ fontSize: scoreFS, letterSpacing: "-2px", color: awayWon ? "#fff" : isDraw ? "#aeaeb2" : "#3a3a3c" }}>{match.away_score}</span>
              </div>
            )}
            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-ios-red live-pulse inline-block" />}
          </div>

          <div className="flex-1 flex flex-col items-center gap-2 min-w-0" style={{ opacity: isFinished && homeWon ? 0.28 : 1, transition: "opacity 0.4s" }}>
            {tbd ? <div className="w-14 h-10 rounded-sm animate-pulse" style={{ background: "#2c2c2e" }} /> : <TeamFlag code={match.away_team.flag_code} size={flagSize} short={match.away_team.short} />}
            <span className="font-bold text-center leading-tight truncate w-full" style={{ fontSize: isFinal ? 12 : 11, color: awayWon ? "#fff" : "#98989d" }}>
              {tbd ? "Por definir" : match.away_team.name}
            </span>
            <AnimatePresence>
              {awayWon && (
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  className="px-2 py-0.5 rounded-full text-[9px] font-black"
                  style={{ background: isFinal ? "rgba(255,214,0,0.15)" : "rgba(48,209,88,0.15)", color: isFinal ? "#ffd60a" : "#30d158" }}>
                  {isFinal ? "CAMPEÓN" : "AVANZA"}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Qualified teams ──────────────────────────────────────────────────────────
function QualifiedList({ matches }) {
  const standings = useMemo(() => computeGroupStandings(matches), [matches]);
  const qualified = standings.flatMap((g) => {
    if (g.teams.filter((t) => t.pj === 3).length < 4) return [];
    return g.teams.slice(0, 2).map((t, i) => ({ ...t, from: `${i === 0 ? "1°" : "2°"} ${g.name}` }));
  });
  if (qualified.length === 0) return null;
  return (
    <div className="mb-6">
      <p className="text-[10px] font-black text-ios-label3 uppercase tracking-[0.12em] mb-3">Clasificados · {qualified.length} de 32</p>
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1c1c1e" }}>
        {qualified.map((t, i) => (
          <div key={`${t.team.short}-${i}`} className={`flex items-center gap-3 px-4 py-3 ${i < qualified.length - 1 ? "border-b border-ios-border/25" : ""}`}>
            <div className="w-0.75 h-5 rounded-full bg-ios-green shrink-0" />
            <TeamFlag code={t.team.flag_code} size="sm" short={t.team.short} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{t.team.name}</p>
              <p className="text-[10px] text-ios-label3">{t.from}</p>
            </div>
            <span className="text-xs font-black text-ios-green tabular-nums">{t.pts} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Groups active banner ─────────────────────────────────────────────────────
function GroupsActiveBanner({ matches }) {
  const gm = matches.filter((m) => m.stage.startsWith("Grupo"));
  const finished = gm.filter((m) => m.status === "finished").length;
  const total = gm.length;
  const remaining = total - finished;
  const progress = total > 0 ? (finished / total) * 100 : 0;
  return (
    <div className="relative rounded-2xl overflow-hidden mb-6">
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0a1628 0%, #1c1c1e 70%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at top left, rgba(10,132,255,0.12) 0%, transparent 60%)" }} />
      <div className="relative p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(10,132,255,0.15)", border: "1px solid rgba(10,132,255,0.2)" }}>
            <Lock size={16} className="text-ios-blue" />
          </div>
          <div>
            <p className="text-base font-black text-white leading-tight">Fase de grupos en curso</p>
            <p className="text-xs text-ios-label2 mt-0.5 leading-relaxed">
              {remaining} {remaining === 1 ? "partido restante" : "partidos restantes"} para definir los 32 clasificados
            </p>
          </div>
        </div>
        <div className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.25)" }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Progreso grupos</span>
            <span className="text-[10px] font-bold text-white/80">{finished} / {total}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }} className="h-full rounded-full bg-ios-blue" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Phase header ─────────────────────────────────────────────────────────────
function PhaseHeader({ phase, count, liveCount }) {
  const isFinal = phase === "Final";
  return (
    <div className="flex items-baseline justify-between mb-4">
      <div className="flex items-center gap-2">
        {isFinal && <Trophy size={17} style={{ color: "#ffd60a" }} />}
        <h2 className="text-xl font-black tracking-tight" style={{ color: isFinal ? "#ffd60a" : "#fff" }}>{phase}</h2>
      </div>
      <div className="flex items-center gap-2">
        {liveCount > 0 && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: "rgba(255,69,58,0.15)", color: "#ff453a" }}>
            {liveCount} en vivo
          </span>
        )}
        <span className="text-xs text-ios-label3">{count} {count === 1 ? "partido" : "partidos"}</span>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Knockout() {
  const { matches, loading } = useMatches();
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [view, setView] = useState("list");

  const knockoutMatches = useMemo(() => matches.filter((m) => !m.stage.startsWith("Grupo")), [matches]);

  const availablePhases = useMemo(() => {
    const present = new Set(knockoutMatches.map((m) => m.stage));
    return PHASE_ORDER.filter((p) => present.has(p) && p !== "Tercer Puesto");
  }, [knockoutMatches]);

  const phaseStatus = useMemo(() => {
    const s = {};
    PHASE_ORDER.forEach((phase) => {
      const pm = knockoutMatches.filter((m) => m.stage === phase);
      if (pm.length === 0) s[phase] = "locked";
      else if (pm.every((m) => m.status === "finished")) s[phase] = "done";
      else if (pm.some((m) => m.status === "live")) s[phase] = "active";
      else s[phase] = "available";
    });
    return s;
  }, [knockoutMatches]);

  const activePhase = useMemo(() => {
    if (selectedPhase && availablePhases.includes(selectedPhase)) return selectedPhase;
    const live = availablePhases.find((p) => knockoutMatches.filter((m) => m.stage === p).some((m) => m.status === "live"));
    if (live) return live;
    const active = availablePhases.find((p) => knockoutMatches.filter((m) => m.stage === p).some((m) => m.status !== "finished"));
    return active ?? availablePhases[availablePhases.length - 1] ?? null;
  }, [availablePhases, knockoutMatches, selectedPhase]);

  const groupStillActive = useMemo(() => matches.filter((m) => m.stage.startsWith("Grupo")).some((m) => m.status !== "finished"), [matches]);

  const phaseMatches = useMemo(() => {
    if (!activePhase) return [];
    return knockoutMatches.filter((m) => m.stage === activePhase);
  }, [knockoutMatches, activePhase]);

  const thirdMatch = useMemo(() => (activePhase === "Final" ? knockoutMatches.find((m) => m.stage === "Tercer Puesto") : null), [activePhase, knockoutMatches]);

  const liveCount = phaseMatches.filter((m) => m.status === "live").length;
  const cardSize = PHASE_SIZE[activePhase] ?? "sm";

  // Bracket available from Cuartos onwards
  const hasBracket = knockoutMatches.some((m) => ["Cuartos de Final", "Semifinal", "Final"].includes(m.stage));

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Eliminatorias</h1>
          <p className="text-sm text-ios-label2 mt-1">FIFA World Cup 2026</p>
        </div>
        {!loading && availablePhases.length > 0 && (
          <ViewToggle view={view} onView={setView} />
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: "#1c1c1e" }} />
          ))}
        </div>
      ) : availablePhases.length === 0 ? (
        <>
          {groupStillActive && <GroupsActiveBanner matches={matches} />}
          <QualifiedList matches={matches} />
          {!groupStillActive && (
            <div className="flex flex-col items-center py-16 gap-3 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#1c1c1e" }}>
                <Lock size={24} className="text-ios-label3" />
              </div>
              <p className="text-sm font-black text-ios-label2">Cruces no disponibles aún</p>
            </div>
          )}
        </>
      ) : (
        <>
          {view === "list" && <TournamentPath phaseStatus={phaseStatus} selected={activePhase} onSelect={setSelectedPhase} />}

          <AnimatePresence mode="wait">
            {view === "bracket" ? (
              <motion.div key="bracket" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {hasBracket ? (
                  <BracketView knockoutMatches={knockoutMatches} />
                ) : (
                  <div className="flex flex-col items-center py-12 gap-2 text-center">
                    <p className="text-sm font-black text-ios-label2">Bracket desde Cuartos</p>
                    <p className="text-xs text-ios-label3">Disponible cuando arranquen los cuartos de final</p>
                  </div>
                )}
                <div className="mt-6">
                  <QualifiedList matches={matches} />
                </div>
              </motion.div>
            ) : (
              <motion.div key={`list-${activePhase}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.16 }}>
                <PhaseHeader phase={activePhase} count={phaseMatches.length} liveCount={liveCount} />
                <div className="flex flex-col gap-3 mb-6">
                  {phaseMatches.map((m) => (
                    <BattleCard key={m.id} match={m} size={cardSize} />
                  ))}
                </div>
                {thirdMatch && (
                  <>
                    <p className="text-[10px] font-black text-ios-label3 uppercase tracking-[0.12em] mb-3">Tercer Puesto</p>
                    <div className="mb-6">
                      <BattleCard match={thirdMatch} size="md" />
                    </div>
                  </>
                )}
                <QualifiedList matches={matches} />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
}
