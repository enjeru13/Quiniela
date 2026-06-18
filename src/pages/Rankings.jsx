import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Zap, Crown, Star, Globe, Users, BarChart2, BookOpen } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { format as dateFnsFormat } from "date-fns";
import { es } from "date-fns/locale";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { useLeagues } from "../hooks/useLeagues";
import { useAuth } from "../contexts/AuthContext";
import { useMatches } from "../contexts/MatchesContext";
import TeamFlag from "../components/matches/TeamFlag";

const MEDAL = {
  1: { color: "#ffd60a", bg: "rgba(255,214,0,0.10)", border: "rgba(255,214,0,0.22)", glow: "rgba(255,214,0,0.18)" },
  2: { color: "#aeaeb2", bg: "rgba(174,174,178,0.08)", border: "rgba(174,174,178,0.2)", glow: "rgba(174,174,178,0.1)" },
  3: { color: "#cd7f32", bg: "rgba(205,127,50,0.08)", border: "rgba(205,127,50,0.2)", glow: "rgba(205,127,50,0.12)" },
};

function efficiency(p) {
  if (!p.predictions_count) return 0;
  return (p.total_points / p.predictions_count).toFixed(1);
}

function Avatar({ username, size = 36 }) {
  const colors = [
    ["#0a84ff", "#30d158"], ["#ff453a", "#ff9f0a"], ["#bf5af2", "#0a84ff"],
    ["#30d158", "#0a84ff"], ["#ff9f0a", "#ff453a"], ["#5e5ce6", "#bf5af2"],
  ];
  const [from, to] = colors[username.charCodeAt(0) % colors.length];
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 font-black text-white"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${from}, ${to})`, fontSize: size * 0.32 }}>
      {username.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── Podio ────────────────────────────────────────────────────────────────────
function PodiumSlot({ player, position, isMe }) {
  const m = MEDAL[position];
  const heights = { 1: 96, 2: 68, 3: 54 };
  const avatarSizes = { 1: 56, 2: 46, 3: 40 };
  const order = { 1: "order-2", 2: "order-1", 3: "order-3" };
  const isFirst = position === 1;
  if (!player) return <div className={`flex-1 ${order[position]}`} />;
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.07, type: "spring", stiffness: 340, damping: 26 }}
      className={`flex-1 flex flex-col items-center ${order[position]}`}>
      <div className="h-6 flex items-end justify-center mb-1">
        {isFirst && <Crown size={18} style={{ color: "#ffd60a", filter: "drop-shadow(0 0 6px rgba(255,214,0,0.6))" }} />}
      </div>
      <div className="relative mb-1.5">
        <div style={{ boxShadow: isFirst ? `0 0 20px ${m.glow}` : "none", borderRadius: 999 }}>
          <Avatar username={player.username} size={avatarSizes[position]} />
        </div>
        <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: m.color, boxShadow: "0 1px 5px rgba(0,0,0,0.6)" }}>
          <span className="font-black leading-none" style={{ fontSize: 9, color: "#000" }}>{position}</span>
        </div>
      </div>
      <p className="text-[11px] font-black text-center truncate w-full px-1 leading-tight" style={{ color: isMe ? "#0a84ff" : "#fff" }}>
        {player.username}
      </p>
      <p className="font-black tabular-nums mt-0.5 leading-none" style={{ fontSize: isFirst ? 22 : 18, color: m.color }}>
        {player.total_points}
      </p>
      <p className="text-[9px] font-medium mb-2" style={{ color: m.color, opacity: 0.55 }}>pts</p>
      <div className="w-full rounded-t-xl flex flex-col items-center justify-center gap-1"
        style={{ height: heights[position], background: m.bg, border: `1px solid ${m.border}`, borderBottom: "none" }}>
        {player.exact_count > 0 && (
          <div className="flex items-center gap-1">
            <Star size={9} style={{ color: m.color, opacity: 0.7 }} />
            <span className="text-[10px] font-bold tabular-nums" style={{ color: m.color, opacity: 0.7 }}>{player.exact_count}</span>
          </div>
        )}
        <span className="text-2xl font-black" style={{ color: m.color, opacity: 0.15 }}>{position}</span>
      </div>
    </motion.div>
  );
}

// ── Lista ─────────────────────────────────────────────────────────────────────
const container = { hidden: {}, show: { transition: { staggerChildren: 0.035 } } };
const item = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } } };
const RANK_COLORS = ["#ff6b35", "#ff9f0a", "#30d158", "#0a84ff", "#bf5af2", "#5e5ce6", "#ff453a"];

function ListRow({ player, isLast, isMe }) {
  const rankColor = player.rank <= 7 ? RANK_COLORS[player.rank - 4] : "#636366";
  return (
    <motion.div variants={item}
      className={`flex items-center px-4 py-3 gap-3 ${isMe ? "bg-ios-blue/8" : ""} ${!isLast ? "border-b border-ios-border/25" : ""}`}>
      <div className="w-7 flex items-center justify-center shrink-0">
        {player.rank <= 10 ? (
          <div className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: `${rankColor}1a`, border: `1px solid ${rankColor}40` }}>
            <span className="font-black tabular-nums" style={{ fontSize: 8, color: rankColor }}>{player.rank}</span>
          </div>
        ) : (
          <span className="text-xs font-black text-ios-label3 tabular-nums">{player.rank}</span>
        )}
      </div>
      <Avatar username={player.username} size={34} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`text-sm font-bold truncate leading-none ${isMe ? "text-ios-blue" : "text-white"}`}>{player.username}</p>
          {isMe && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "rgba(10,132,255,0.15)", color: "#0a84ff" }}>TÚ</span>}
        </div>
        <div className="flex items-center gap-2.5 mt-1">
          {player.exact_count > 0 && (
            <div className="flex items-center gap-1">
              <Star size={9} style={{ color: "#ffd60a" }} />
              <span className="text-[10px] text-ios-label3">{player.exact_count} exactos</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Zap size={9} className="text-ios-label3" />
            <span className="text-[10px] text-ios-label3">{efficiency(player)} pts/pred</span>
          </div>
        </div>
      </div>
      <div className="text-center shrink-0 w-8">
        <p className="text-xs font-bold tabular-nums text-ios-label2">{player.predictions_count}</p>
        <p className="text-[8px] text-ios-label3 leading-none mt-0.5">pron</p>
      </div>
      <div className="text-right shrink-0 w-10">
        <p className={`text-base font-black tabular-nums ${isMe ? "text-ios-blue" : "text-white"}`}>{player.total_points}</p>
        <p className="text-[8px] text-ios-label3 leading-none mt-0.5">pts</p>
      </div>
    </motion.div>
  );
}

// ── Leaderboard view ─────────────────────────────────────────────────────────
function LeaderboardView({ data, myId }) {
  const enriched = data.map((p) => ({ ...p, isMe: p.id === myId }));
  const top3 = [enriched.find((p) => p.rank === 1), enriched.find((p) => p.rank === 2), enriched.find((p) => p.rank === 3)];
  const me = enriched.find((p) => p.isMe);
  const meInTop3 = me && me.rank <= 3;
  return (
    <>
      {top3.some(Boolean) && (
        <div className="mb-6 relative">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(255,214,0,0.07) 0%, transparent 65%)" }} />
          <p className="text-[10px] font-black text-ios-label3 uppercase tracking-[0.12em] mb-4">Podio</p>
          <div className="flex items-end gap-1.5 px-1">
            <PodiumSlot player={top3[1]} position={2} isMe={top3[1]?.isMe} />
            <PodiumSlot player={top3[0]} position={1} isMe={top3[0]?.isMe} />
            <PodiumSlot player={top3[2]} position={3} isMe={top3[2]?.isMe} />
          </div>
        </div>
      )}
      {enriched.length > 0 && (
        <div className="mb-24">
          <p className="text-[10px] font-black text-ios-label3 uppercase tracking-[0.12em] mb-3">Clasificación</p>
          <motion.div variants={container} initial="hidden" animate="show" className="rounded-2xl overflow-hidden" style={{ background: "#1c1c1e" }}>
            {enriched.map((player, i) => (
              <ListRow key={player.id} player={player} isLast={i === enriched.length - 1} isMe={player.isMe} />
            ))}
          </motion.div>
        </div>
      )}
      {me && !meInTop3 && (
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 360, damping: 30, delay: 0.25 }}
          className="fixed bottom-0 left-0 right-0 z-40 px-4"
          style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))", paddingTop: 8 }}>
          <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: "rgba(10,132,255,0.13)", border: "1px solid rgba(10,132,255,0.3)", backdropFilter: "blur(24px)" }}>
            <span className="text-xs font-black text-ios-blue w-7 text-center">#{me.rank}</span>
            <Avatar username={me.username} size={36} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-ios-blue truncate leading-none">{me.username}</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <Star size={9} style={{ color: "#ffd60a" }} />
                  <span className="text-[10px] text-ios-label3">{me.exact_count} exactos</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target size={9} className="text-ios-label3" />
                  <span className="text-[10px] text-ios-label3">{me.predictions_count} pronósticos</span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-black text-ios-blue tabular-nums">{me.total_points}</p>
              <p className="text-[9px] text-ios-label3">pts</p>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

// ── Apuestas view ─────────────────────────────────────────────────────────────
function PredBadge({ pred, match }) {
  if (!pred) return <span className="text-[11px] font-semibold" style={{ color: "#3a3a3c" }}>—</span>;

  const isFinished = match?.status === "finished";
  const pts = pred.points_earned;
  const color = !isFinished ? "#aeaeb2"
    : pts === 3 ? "#ffd60a"
    : pts === 1 ? "#30d158"
    : "#48484a";
  const bg = !isFinished ? "rgba(255,255,255,0.05)"
    : pts === 3 ? "rgba(255,214,0,0.12)"
    : pts === 1 ? "rgba(48,209,88,0.1)"
    : "rgba(255,255,255,0.04)";

  return (
    <div className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg" style={{ background: bg, minWidth: 36 }}>
      <span className="text-[12px] font-black tabular-nums leading-none" style={{ color }}>
        {pred.pred_home}-{pred.pred_away}
      </span>
      {isFinished && pts !== null && (
        <span className="text-[8px] font-bold leading-none" style={{ color, opacity: 0.7 }}>
          {pts === 3 ? "★ 3" : pts === 1 ? "1pt" : "0"}
        </span>
      )}
    </div>
  );
}

function MatchBetRow({ match, members, predsByMatch, isLast }) {
  const matchPreds = predsByMatch[match.id] ?? {};
  const hasPred = members.some((m) => matchPreds[m.id]);
  if (!hasPred) return null;

  const isFinished = match.status === "finished";
  const isLive = match.status === "live";

  return (
    <div className={`px-4 py-4 ${!isLast ? "border-b border-ios-border/20" : ""}`}>
      {/* Match header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div style={{ transform: "scale(0.8)", transformOrigin: "left center", width: 28, height: 18, overflow: "hidden", flexShrink: 0 }}>
            <TeamFlag code={match.home_team?.flag_code} size="sm" short={match.home_team?.short} />
          </div>
          <span className="text-xs font-bold text-white">{match.home_team?.short ?? "?"}</span>

          {isFinished ? (
            <span className="text-xs font-black text-white tabular-nums px-2 py-0.5 rounded-lg mx-1" style={{ background: "#2c2c2e" }}>
              {match.home_score} – {match.away_score}
            </span>
          ) : isLive ? (
            <span className="text-xs font-black tabular-nums px-2 py-0.5 rounded-lg mx-1" style={{ background: "rgba(255,69,58,0.15)", color: "#ff453a" }}>
              {match.home_score ?? 0} – {match.away_score ?? 0}
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-ios-label3 mx-1">vs</span>
          )}

          <span className="text-xs font-bold text-white">{match.away_team?.short ?? "?"}</span>
          <div style={{ transform: "scale(0.8)", transformOrigin: "left center", width: 28, height: 18, overflow: "hidden", flexShrink: 0 }}>
            <TeamFlag code={match.away_team?.flag_code} size="sm" short={match.away_team?.short} />
          </div>
        </div>
        <span className="text-[10px] font-semibold text-ios-label3 shrink-0">
          {isFinished ? "Final" : isLive ? "🔴 En vivo" : dateFnsFormat(new Date(match.kickoff_at), "d MMM · HH:mm", { locale: es })}
        </span>
      </div>

      {/* Member predictions — vertical, escala a N usuarios */}
      <div className="flex flex-col gap-1.5">
        {members.map((member) => {
          const pred = matchPreds[member.id];
          return (
            <div key={member.id} className="flex items-center gap-2.5">
              <Avatar username={member.username} size={22} />
              <span className="text-[11px] font-semibold text-ios-label2 flex-1 truncate">
                {member.username}
              </span>
              <PredBadge pred={pred} match={match} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeagueBetsView({ leagueId }) {
  const { getLeaguePredictions } = useLeagues();
  const { matches } = useMatches();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaguePredictions(leagueId).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [leagueId]);

  const matchesWithPreds = useMemo(() => {
    if (!data) return [];
    const { predsByMatch } = data;
    return matches
      .filter((m) => predsByMatch[m.id] && Object.keys(predsByMatch[m.id]).length > 0)
      .sort((a, b) => new Date(b.kickoff_at) - new Date(a.kickoff_at));
  }, [data, matches]);

  if (loading) return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "#1c1c1e" }} />)}
    </div>
  );

  if (!data || matchesWithPreds.length === 0) return (
    <div className="flex flex-col items-center py-12 gap-2 text-center">
      <BookOpen size={28} className="text-ios-label3" />
      <p className="text-sm font-black text-ios-label2">Sin apuestas aún</p>
      <p className="text-xs text-ios-label3">Las apuestas de la liga aparecen aquí</p>
    </div>
  );

  return (
    <div className="mb-24">
      <div className="rounded-2xl overflow-hidden" style={{ background: "#1c1c1e" }}>
        {matchesWithPreds.map((match, i) => (
          <MatchBetRow
            key={match.id}
            match={match}
            members={data.members}
            predsByMatch={data.predsByMatch}
            isLast={i === matchesWithPreds.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

// ── Sub-toggle Ranking / Apuestas ─────────────────────────────────────────────
function LeagueSubToggle({ view, onView }) {
  return (
    <div className="flex mb-5">
      <div className="flex rounded-xl overflow-hidden" style={{ background: "#1c1c1e" }}>
        {[
          { id: "ranking", icon: BarChart2, label: "Ranking" },
          { id: "apuestas", icon: BookOpen, label: "Apuestas" },
        ].map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={(e) => { onView(id); e.currentTarget.blur(); }}
            className="flex items-center gap-1.5 px-3 py-2 transition-all focus:outline-none"
            style={{ background: view === id ? "#0a84ff" : "transparent" }}>
            <Icon size={12} style={{ color: view === id ? "#fff" : "#636366" }} />
            <span className="text-[11px] font-black" style={{ color: view === id ? "#fff" : "#636366" }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Rankings() {
  const { leaderboard, loading: lbLoading } = useLeaderboard();
  const { leagues, getLeagueRanking } = useLeagues();
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState("global");
  const [leagueView, setLeagueView] = useState("ranking");
  const [leagueData, setLeagueData] = useState([]);
  const [leagueLoading, setLeagueLoading] = useState(false);

  useEffect(() => {
    const ligaId = searchParams.get("liga");
    if (ligaId) { setActiveTab(ligaId); setSearchParams({}); }
  }, []);

  useEffect(() => {
    if (activeTab === "global") return;
    setLeagueLoading(true);
    getLeagueRanking(activeTab).then((data) => {
      setLeagueData(data);
      setLeagueLoading(false);
    });
  }, [activeTab]);

  // Reset sub-view when switching league
  useEffect(() => { setLeagueView("ranking"); }, [activeTab]);

  const globalData = useMemo(() => leaderboard, [leaderboard]);
  const me = globalData.find((p) => p.id === profile?.id);

  const tabs = [
    { id: "global", label: "Global", icon: Globe },
    ...leagues.map((l) => ({ id: l.id, label: l.name, icon: Users })),
  ];

  const currentData = activeTab === "global" ? globalData : leagueData;
  const currentLoading = activeTab === "global" ? lbLoading : leagueLoading;
  const currentLeague = leagues.find((l) => l.id === activeTab);
  const isLeagueTab = activeTab !== "global";

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Ranking</h1>
          <p className="text-sm text-ios-label2 mt-1">
            {isLeagueTab ? currentLeague?.name : `${globalData.length} participantes`}
          </p>
        </div>
        {me && !isLeagueTab && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl shrink-0"
            style={{ background: "rgba(10,132,255,0.1)", border: "1px solid rgba(10,132,255,0.2)" }}>
            <span className="text-xs font-black text-ios-blue">#{me.rank}</span>
            <div className="w-px h-3" style={{ background: "rgba(10,132,255,0.3)" }} />
            <span className="text-xs font-bold text-ios-blue tabular-nums">{me.total_points} pts</span>
          </div>
        )}
      </div>

      {/* Tabs de ligas */}
      {tabs.length > 1 && (
        <div className="overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-2" style={{ minWidth: "max-content" }}>
            {tabs.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button key={id} onClick={(e) => { setActiveTab(id); e.currentTarget.blur(); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all shrink-0 focus:outline-none"
                  style={{ background: isActive ? "#0a84ff" : "#1c1c1e", color: isActive ? "#fff" : "#636366", boxShadow: isActive ? "0 4px 14px rgba(10,132,255,0.3)" : "none" }}>
                  <Icon size={11} />
                  <span className="max-w-[96px] truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-toggle Ranking / Apuestas (solo en liga) */}
      {isLeagueTab && <LeagueSubToggle view={leagueView} onView={setLeagueView} />}

      {/* Content */}
      <AnimatePresence mode="wait">
        {currentLoading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl animate-pulse" style={{ height: i === 1 ? 180 : 64, background: "#1c1c1e" }} />
            ))}
          </motion.div>
        ) : isLeagueTab && leagueView === "apuestas" ? (
          <motion.div key={`bets-${activeTab}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <LeagueBetsView leagueId={activeTab} />
          </motion.div>
        ) : currentData.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center py-16 gap-3 text-center">
            <Users size={32} className="text-ios-label3" />
            <p className="text-sm font-black text-ios-label2">Sin participantes aún</p>
          </motion.div>
        ) : (
          <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <LeaderboardView data={currentData} myId={profile?.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
