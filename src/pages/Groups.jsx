import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TeamFlag from "../components/matches/TeamFlag";
import { useMatches } from "../contexts/MatchesContext";
import { useScorers } from "../hooks/useScorers";
import { computeGroupStandings } from "../lib/utils";
import { getTeamInfo } from "../lib/teamMappings";

// WC 2026: top 2 per group (24) + best 8 third-place = 32 total
const POS_STYLE = {
  0: { bar: "#30d158", label: "Clasifica", labelColor: "#30d158" },
  1: { bar: "#30d158", label: "Clasifica", labelColor: "#30d158" },
  2: { bar: "#ff9f0a", label: "3er lugar", labelColor: "#ff9f0a" },
  3: { bar: "#3a3a3c", label: null, labelColor: null },
};

function ViewToggle({ view, setView }) {
  return (
    <div className="flex mb-5">
      <div className="flex rounded-xl p-0.5" style={{ background: "#2c2c2e" }}>
        {[
          { id: "grupos", label: "Grupos" },
          { id: "goleadores", label: "Goleadores" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className="px-4 py-1.5 rounded-[10px] text-xs font-bold transition-all"
            style={
              view === id
                ? { background: "#1c1c1e", color: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }
                : { color: "#636366" }
            }
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function GroupTab({ letter, isSelected, onClick }) {
  return (
    <motion.button
      layout
      onClick={(e) => { onClick(); e.currentTarget.blur(); }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="shrink-0 rounded-xl font-black text-xs uppercase tracking-wider focus:outline-none"
      style={
        isSelected
          ? { background: "#0a84ff", color: "#fff", padding: "7px 14px", boxShadow: "0 4px 16px rgba(10,132,255,0.35)" }
          : { background: "#1c1c1e", color: "#636366", padding: "7px 14px" }
      }
    >
      {letter}
    </motion.button>
  );
}

function GroupTable({ group }) {
  return (
    <div className="bg-ios-card rounded-2xl overflow-hidden">
      <div className="flex items-center gap-1 px-4 py-2 border-b border-ios-border/30">
        <div className="w-3 shrink-0" />
        <div className="w-4 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-bold text-ios-label3 uppercase tracking-wider">Equipo</span>
        </div>
        {["PJ", "G", "E", "P", "GF", "GC", "Pts"].map((col) => (
          <span
            key={col}
            className={`text-[9px] font-bold uppercase tracking-wider text-center shrink-0 ${
              col === "Pts" ? "w-8 text-white/50" : "w-6 text-ios-label3"
            }`}
          >
            {col}
          </span>
        ))}
      </div>

      {group.teams.map((entry, i) => {
        const pos = POS_STYLE[i] ?? POS_STYLE[3];
        return (
          <motion.div
            key={entry.team.short}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 30 }}
            className={`flex items-center gap-1 px-4 py-3 ${i < group.teams.length - 1 ? "border-b border-ios-border/20" : ""}`}
          >
            <div className="w-0.75 h-7 rounded-full shrink-0" style={{ background: pos.bar }} />
            <span className="text-[10px] font-black text-ios-label3 w-4 text-center tabular-nums shrink-0">
              {i + 1}
            </span>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <TeamFlag code={entry.team.flag_code} size="sm" short={entry.team.short} />
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate leading-none ${i < 2 ? "text-white" : "text-ios-label2"}`}>
                  {entry.team.name}
                </p>
                {pos.label && (
                  <p className="text-[9px] font-semibold mt-0.5" style={{ color: pos.labelColor }}>
                    {pos.label}
                  </p>
                )}
              </div>
            </div>
            {[entry.pj, entry.g, entry.e, entry.p, entry.gf, entry.gc].map((val, j) => (
              <span key={j} className="text-xs w-6 text-center tabular-nums text-ios-label2 shrink-0">
                {val}
              </span>
            ))}
            <span className={`text-xs font-black w-8 text-center tabular-nums shrink-0 ${
              i === 0 ? "text-white" : i < 2 ? "text-ios-label2" : "text-ios-label3"
            }`}>
              {entry.pts}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

function ScorersView({ scorers, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: "#1c1c1e" }} />
        ))}
      </div>
    );
  }

  if (!scorers.length) {
    return (
      <p className="text-center text-ios-label3 text-sm py-12">
        Sin datos de goleadores aún
      </p>
    );
  }

  const MEDAL = { 0: "#ffd60a", 1: "#aeaeb2", 2: "#cd7f32" };

  return (
    <div className="bg-ios-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-ios-border/30">
        <div className="w-6 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-bold text-ios-label3 uppercase tracking-wider">Jugador</span>
        </div>
        <span className="text-[9px] font-bold text-ios-label3 uppercase tracking-wider w-12 text-center shrink-0">Goles</span>
        <span className="text-[9px] font-bold text-ios-label3 uppercase tracking-wider w-10 text-center shrink-0">Asis.</span>
      </div>

      {scorers.map((s, i) => {
        const teamInfo = getTeamInfo(s.team?.tla);
        const medal = MEDAL[i];
        return (
          <motion.div
            key={s.player?.id ?? i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 30 }}
            className={`flex items-center gap-3 px-4 py-3 ${i < scorers.length - 1 ? "border-b border-ios-border/20" : ""}`}
          >
            {/* Rank */}
            <div className="w-6 shrink-0 flex items-center justify-center">
              {medal ? (
                <span className="text-sm font-black" style={{ color: medal }}>{i + 1}</span>
              ) : (
                <span className="text-xs font-bold text-ios-label3 tabular-nums">{i + 1}</span>
              )}
            </div>

            {/* Player info */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <TeamFlag code={teamInfo.flag} size="sm" short={s.team?.tla ?? "?"} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-none">{s.player?.name ?? "—"}</p>
                <p className="text-[10px] text-ios-label3 mt-0.5 truncate">{teamInfo.name || s.team?.name}</p>
              </div>
            </div>

            {/* Goals */}
            <div className="w-12 flex items-center justify-center">
              <span className={`text-sm font-black tabular-nums ${i < 3 ? "text-white" : "text-ios-label2"}`}>
                {s.goals ?? 0}
              </span>
            </div>

            {/* Assists */}
            <div className="w-10 flex items-center justify-center">
              <span className="text-xs font-semibold tabular-nums text-ios-label3">
                {s.assists ?? 0}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-52 rounded-2xl animate-pulse" style={{ background: "#1c1c1e" }} />
      ))}
    </div>
  );
}

export default function Groups() {
  const { matches, loading: matchesLoading } = useMatches();
  const { scorers, loading: scorersLoading } = useScorers();
  const groups = useMemo(() => computeGroupStandings(matches), [matches]);
  const [selected, setSelected] = useState(0);
  const [view, setView] = useState("grupos");

  const current = groups[selected];

  return (
    <>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-black tracking-tight">Grupos</h1>
        <div className="flex items-center gap-4 mt-1">
          <p className="text-sm text-ios-label2">{groups.length} grupos · 48 equipos</p>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-ios-green" />
            <p className="text-[11px] text-ios-label3">Top 2 clasifican</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: "#ff9f0a" }} />
            <p className="text-[11px] text-ios-label3">Mejores 3ros también</p>
          </div>
        </div>
      </div>

      <ViewToggle view={view} setView={setView} />

      <AnimatePresence mode="wait">
        {view === "grupos" ? (
          <motion.div
            key="grupos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Group tab selector */}
            {!matchesLoading && groups.length > 0 && (
              <motion.div
                layout
                className="flex gap-2 overflow-x-auto pb-1 mb-5"
                style={{ scrollbarWidth: "none" }}
              >
                {groups.map((g, i) => (
                  <GroupTab
                    key={g.name}
                    letter={g.name.replace("Grupo ", "")}
                    isSelected={i === selected}
                    onClick={() => setSelected(i)}
                  />
                ))}
              </motion.div>
            )}

            {matchesLoading ? (
              <LoadingSkeleton />
            ) : current ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-1 h-5 rounded-full bg-ios-orange" />
                    <span className="text-sm font-black text-white uppercase tracking-wider">
                      {current.name}
                    </span>
                    <span className="text-[11px] text-ios-label3 font-medium ml-1">
                      {current.teams[0]?.pj ?? 0} de 3 jornadas
                    </span>
                  </div>

                  <GroupTable group={current} />

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 px-1">
                    {[
                      ["PJ", "Partidos jugados"],
                      ["G", "Ganados"],
                      ["E", "Empatados"],
                      ["P", "Perdidos"],
                      ["GF", "Goles a favor"],
                      ["GC", "Goles en contra"],
                      ["Pts", "Puntos"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-ios-label2 w-6 shrink-0">{k}</span>
                        <span className="text-[10px] text-ios-label3">{v}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <p className="text-center text-ios-label3 text-sm py-12">Sin datos de grupos aún</p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="goleadores"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ScorersView scorers={scorers} loading={scorersLoading} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
