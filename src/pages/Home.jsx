/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, CheckCircle2, Clock, Radio, Timer } from "lucide-react";
import MatchCard from "../components/matches/MatchCard";
import PredictionModal from "../components/predictions/PredictionModal";
import ChampionCard from "../components/home/ChampionCard";
import { useMatches } from "../contexts/MatchesContext";
import { usePredictions } from "../hooks/usePredictions";
import { groupMatchesByTime } from "../lib/utils";
import { format, parseISO, isToday, isYesterday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";

const TOTAL_MATCHES = 104;

const PHASE_PRIORITY = [
  "Final",
  "Tercer Puesto",
  "Semifinal",
  "Cuartos de Final",
  "Octavos de Final",
  "Ronda de 32",
];

function getCurrentPhase(matches) {
  const active = new Set(
    matches
      .filter((m) => m.status === "live" || m.status === "finished")
      .map((m) => m.stage),
  );
  for (const phase of PHASE_PRIORITY) {
    if (active.has(phase)) return phase;
  }
  return "Grupos";
}

function TournamentBanner({ played, phase }) {
  const progress = Math.round((played / TOTAL_MATCHES) * 100);
  return (
    <div className="relative rounded-2xl overflow-hidden mb-5">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #ff6b35 0%, #ff453a 40%, #1c1c1e 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(255,159,10,0.25) 0%, transparent 60%)",
        }}
      />
      <div className="relative p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={13} className="text-white/70" />
              <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.15em]">
                FIFA World Cup
              </span>
            </div>
            <p className="text-xl font-black tracking-tight leading-tight text-white">
              USA · CAN · MEX 2026
            </p>
          </div>
          <div
            className="text-right rounded-xl px-3 py-1.5"
            style={{ background: "rgba(0,0,0,0.25)" }}
          >
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
              Fase
            </p>
            <p className="text-xs font-black text-white mt-0.5">{phase}</p>
          </div>
        </div>
        <div
          className="rounded-xl p-3"
          style={{ background: "rgba(0,0,0,0.2)" }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
              Progreso
            </span>
            <span className="text-[10px] font-bold text-white/80">
              {played} / {TOTAL_MATCHES}
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              className="h-full rounded-full bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DatePill({ dateStr, isSelected, matchCount, hasLive, onClick }) {
  const date = parseISO(dateStr);
  const isT = isToday(date);
  const isY = isYesterday(date);
  const isTom = isTomorrow(date);
  const hasLabel = isT || isY || isTom;
  const mainLabel = isT
    ? "Hoy"
    : isY
      ? "Ayer"
      : isTom
        ? "Mañana"
        : format(date, "d", { locale: es });
  const subLabel = hasLabel
    ? format(date, "d MMM", { locale: es })
    : format(date, "MMM", { locale: es });
  const dayLabel = format(date, "EEE", { locale: es });

  return (
    <motion.button
      layout
      onClick={(e) => { onClick(); e.currentTarget.blur(); }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="flex flex-col items-center shrink-0 rounded-2xl relative overflow-hidden focus:outline-none"
      style={
        isSelected
          ? {
              background: "#0a84ff",
              minWidth: 72,
              paddingTop: 14,
              paddingBottom: 14,
              paddingLeft: 16,
              paddingRight: 16,
              boxShadow: "0 4px 20px rgba(10,132,255,0.4)",
            }
          : {
              background: "#1c1c1e",
              minWidth: 52,
              paddingTop: 10,
              paddingBottom: 10,
              paddingLeft: 10,
              paddingRight: 10,
            }
      }
    >
      {/* Day abbreviation */}
      <span
        className="font-bold uppercase tracking-wider leading-none mb-1"
        style={{
          fontSize: isSelected ? 10 : 9,
          color: isSelected ? "rgba(255,255,255,0.65)" : "#636366",
        }}
      >
        {dayLabel}
      </span>

      {/* Main label */}
      <span
        className="font-black capitalize leading-none"
        style={{
          fontSize: isSelected ? (hasLabel ? 18 : 22) : 13,
          color: isSelected ? "#fff" : isT ? "#0a84ff" : "#aeaeb2",
          letterSpacing: isSelected ? "-0.5px" : "0px",
        }}
      >
        {hasLabel ? mainLabel : mainLabel}
      </span>

      {/* Sub label (date or month) */}
      {isSelected ? (
        <span
          className="text-[10px] font-semibold mt-1"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          {subLabel}
        </span>
      ) : (
        !hasLabel && (
          <span
            className="text-[9px] font-medium mt-0.5 capitalize"
            style={{ color: "#636366" }}
          >
            {subLabel}
          </span>
        )
      )}

      {/* Match count / live dot */}
      <div className="mt-2 flex items-center justify-center">
        {hasLive ? (
          <span className="w-1.5 h-1.5 rounded-full bg-ios-red live-pulse" />
        ) : (
          <span
            className="font-semibold tabular-nums"
            style={{
              fontSize: isSelected ? 11 : 9,
              color: isSelected ? "rgba(255,255,255,0.55)" : "#48484a",
            }}
          >
            {matchCount}
          </span>
        )}
      </div>

      {/* Selected underline accent */}
      {isSelected && (
        <motion.div
          layoutId="pill-accent"
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.75 rounded-full"
          style={{ background: "rgba(255,255,255,0.4)" }}
        />
      )}
    </motion.button>
  );
}

function DateNav({ dates, selected, onSelect, matchesByDate }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    // Auto-scroll selected pill into view
    const el = scrollRef.current?.querySelector('[data-selected="true"]');
    el?.scrollIntoView({
      inline: "center",
      behavior: "smooth",
      block: "nearest",
    });
  }, [selected]);

  return (
    <motion.div
      layout
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pt-3 pb-1 mb-6"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {dates.map((d) => (
        <div key={d} data-selected={d === selected}>
          <DatePill
            dateStr={d}
            isSelected={d === selected}
            matchCount={matchesByDate[d]?.length ?? 0}
            hasLive={
              matchesByDate[d]?.some((m) => m.status === "live") ?? false
            }
            onClick={() => onSelect(d)}
          />
        </div>
      ))}
    </motion.div>
  );
}

function LiveSection({ matches, predictions, onPredict }) {
  if (matches.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Radio size={13} className="text-ios-red" />
        <span className="text-[11px] font-black text-ios-red uppercase tracking-[0.14em]">
          En Vivo
        </span>
        <span
          className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(255,69,58,0.15)", color: "#ff453a" }}
        >
          {matches.length}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {matches.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            prediction={predictions[m.id]}
            onPredict={onPredict}
          />
        ))}
      </div>
    </div>
  );
}

function TimeSlotHeader({ time, allFinished, allScheduled, count }) {
  if (allFinished) {
    return (
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2
          size={12}
          style={{ color: "#30d158", opacity: 0.7 }}
          className="shrink-0"
        />
        <span className="text-[11px] font-bold text-ios-label3 uppercase tracking-widest">
          {time} · Finalizados
        </span>
        <span className="ml-auto text-[10px] text-ios-label3">{count}</span>
      </div>
    );
  }
  if (allScheduled) {
    return (
      <div className="flex items-center gap-2 mb-3">
        <Clock size={11} className="text-ios-label3 shrink-0" />
        <span className="text-[11px] font-bold text-ios-label3 uppercase tracking-widest">
          {time}
        </span>
        <span className="ml-auto text-[10px] text-ios-label3">{count}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="w-2.5 h-0.5 rounded-full shrink-0"
        style={{ background: "#636366" }}
      />
      <span className="text-[11px] font-bold text-ios-label3 uppercase tracking-widest">
        {time}
      </span>
      <span className="ml-auto text-[10px] text-ios-label3">{count}</span>
    </div>
  );
}

function CountdownWidget({ matches }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const hasLive = matches.some((m) => m.status === "live")

  const next = useMemo(() => {
    return matches
      .filter((m) => m.status === "scheduled" && new Date(m.kickoff_at) > now)
      .sort((a, b) => new Date(a.kickoff_at) - new Date(b.kickoff_at))[0] ?? null
  }, [matches, now])

  if (hasLive || !next) return null

  const diff = Math.max(0, new Date(next.kickoff_at) - now)
  const hours = Math.floor(diff / 3_600_000)
  const mins  = Math.floor((diff % 3_600_000) / 60_000)
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2.5 rounded-2xl px-4 py-3 mb-4"
      style={{ background: "#1c1c1e" }}
    >
      <Timer size={13} className="text-ios-label3 shrink-0" />
      <span className="text-xs text-ios-label2 flex-1 min-w-0 truncate">
        <span className="font-bold text-white">{next.home_team.name}</span>
        <span className="text-ios-label3"> vs </span>
        <span className="font-bold text-white">{next.away_team.name}</span>
      </span>
      <span className="text-xs font-black tabular-nums shrink-0" style={{ color: "#0a84ff" }}>
        {timeStr}
      </span>
    </motion.div>
  )
}

function LoadingMatches() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-40 rounded-2xl animate-pulse"
          style={{ background: "#1c1c1e" }}
        />
      ))}
    </div>
  );
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 360, damping: 28 },
  },
};

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

export default function Home() {
  const { matches, loading, error } = useMatches();
  const { predictions, savePrediction } = usePredictions(matches);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const matchesByDate = useMemo(() => {
    const groups = {};
    matches.forEach((m) => {
      const local = new Date(m.kickoff_at);
      if (local.getHours() < 6) local.setDate(local.getDate() - 1);
      const d = format(local, "yyyy-MM-dd");
      if (!groups[d]) groups[d] = [];
      groups[d].push(m);
    });
    return groups;
  }, [matches]);

  const dates = useMemo(
    () => Object.keys(matchesByDate).sort(),
    [matchesByDate],
  );

  const defaultDate = useMemo(() => {
    const today = todayStr();
    if (matchesByDate[today]) return today;
    // No matches today → nearest upcoming date
    return dates.find((d) => d >= today) ?? dates[dates.length - 1] ?? today;
  }, [dates, matchesByDate]);

  const [selectedDate, setSelectedDate] = useState(defaultDate);

  // Update default if matches load after initial render
  useEffect(() => {
    if (
      defaultDate &&
      selectedDate === todayStr() &&
      !matchesByDate[selectedDate]
    ) {
      setSelectedDate(defaultDate);
    }
  }, [defaultDate, selectedDate, matchesByDate]);

  const played = matches.filter((m) => m.status === "finished").length;
  const phase = getCurrentPhase(matches);
  const dayMatches = matchesByDate[selectedDate] ?? [];
  const liveMatches = dayMatches.filter((m) => m.status === "live");
  const nonLive = dayMatches.filter((m) => m.status !== "live");
  const byTime = groupMatchesByTime(nonLive);
  const timeSlots = Object.keys(byTime).sort();

  return (
    <>
      <TournamentBanner played={played} phase={phase} />

      <ChampionCard matches={matches} />

      <CountdownWidget matches={matches} />

      {error && (
        <div
          className="rounded-2xl p-4 mb-5 text-center"
          style={{ background: "#1c1c1e" }}
        >
          <p className="text-xs text-ios-red font-semibold">
            Error cargando partidos
          </p>
          <p className="text-[11px] text-ios-label3 mt-1">{error.message}</p>
        </div>
      )}

      {!loading && dates.length > 0 && (
        <DateNav
          dates={dates}
          selected={selectedDate}
          onSelect={setSelectedDate}
          matchesByDate={matchesByDate}
        />
      )}

      {loading ? (
        <LoadingMatches />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <LiveSection
              matches={liveMatches}
              predictions={predictions}
              onPredict={setSelectedMatch}
            />

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-5"
            >
              {timeSlots.map((time) => {
                const slot = byTime[time];
                const allFinished = slot.every((m) => m.status === "finished");
                const allScheduled = slot.every(
                  (m) => m.status === "scheduled",
                );
                return (
                  <div key={time}>
                    <TimeSlotHeader
                      time={time}
                      allFinished={allFinished}
                      allScheduled={allScheduled}
                      count={slot.length}
                    />
                    <div className="flex flex-col gap-3">
                      {slot.map((match) => (
                        <motion.div key={match.id} variants={item}>
                          <MatchCard
                            match={match}
                            prediction={predictions[match.id]}
                            onPredict={setSelectedMatch}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {dayMatches.length === 0 && (
                <p className="text-center text-ios-label3 text-sm py-12">
                  Sin partidos este día
                </p>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      <PredictionModal
        match={selectedMatch}
        prediction={selectedMatch ? predictions[selectedMatch.id] : null}
        onSave={(matchId, pred) => savePrediction(matchId, pred)}
        onClose={() => setSelectedMatch(null)}
      />
    </>
  );
}
