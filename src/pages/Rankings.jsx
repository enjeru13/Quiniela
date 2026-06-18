import { motion } from "framer-motion";
import { Target, Zap, Crown, Star } from "lucide-react";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { useAuth } from "../contexts/AuthContext";

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
    ["#0a84ff", "#30d158"],
    ["#ff453a", "#ff9f0a"],
    ["#bf5af2", "#0a84ff"],
    ["#30d158", "#0a84ff"],
    ["#ff9f0a", "#ff453a"],
    ["#5e5ce6", "#bf5af2"],
  ];
  const [from, to] = colors[username.charCodeAt(0) % colors.length];
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-black text-white"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${from}, ${to})`, fontSize: size * 0.32 }}
    >
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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.07, type: "spring", stiffness: 340, damping: 26 }}
      className={`flex-1 flex flex-col items-center ${order[position]}`}
    >
      {/* Crown for 1st */}
      <div className="h-6 flex items-end justify-center mb-1">
        {isFirst && <Crown size={18} style={{ color: "#ffd60a", filter: "drop-shadow(0 0 6px rgba(255,214,0,0.6))" }} />}
      </div>

      {/* Avatar */}
      <div className="relative mb-1.5">
        <div style={{ boxShadow: isFirst ? `0 0 20px ${m.glow}` : "none", borderRadius: 999 }}>
          <Avatar username={player.username} size={avatarSizes[position]} />
        </div>
        {/* Medal badge */}
        <div
          className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: m.color, boxShadow: "0 1px 5px rgba(0,0,0,0.6)" }}
        >
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

      {/* Platform */}
      <div
        className="w-full rounded-t-xl flex flex-col items-center justify-center gap-1"
        style={{ height: heights[position], background: m.bg, border: `1px solid ${m.border}`, borderBottom: "none" }}
      >
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
const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 400, damping: 30 } },
};

const RANK_COLORS = ["#ff6b35", "#ff9f0a", "#30d158", "#0a84ff", "#bf5af2", "#5e5ce6", "#ff453a"];

function ListRow({ player, isLast, isMe }) {
  const rankColor = player.rank <= 7 ? RANK_COLORS[player.rank - 4] : "#636366";

  return (
    <motion.div
      variants={item}
      className={`flex items-center px-4 py-3 gap-3 ${isMe ? "bg-ios-blue/8" : ""} ${!isLast ? "border-b border-ios-border/25" : ""}`}
    >
      {/* Rank */}
      <div className="w-7 flex items-center justify-center shrink-0">
        {player.rank <= 10 ? (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: `${rankColor}1a`, border: `1px solid ${rankColor}40` }}
          >
            <span className="font-black tabular-nums" style={{ fontSize: 8, color: rankColor }}>{player.rank}</span>
          </div>
        ) : (
          <span className="text-xs font-black text-ios-label3 tabular-nums">{player.rank}</span>
        )}
      </div>

      <Avatar username={player.username} size={34} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`text-sm font-bold truncate leading-none ${isMe ? "text-ios-blue" : "text-white"}`}>
            {player.username}
          </p>
          {isMe && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "rgba(10,132,255,0.15)", color: "#0a84ff" }}>TÚ</span>
          )}
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

      {/* Predictions count */}
      <div className="text-center shrink-0 w-8">
        <p className="text-xs font-bold tabular-nums text-ios-label2">{player.predictions_count}</p>
        <p className="text-[8px] text-ios-label3 leading-none mt-0.5">pron</p>
      </div>

      {/* Points */}
      <div className="text-right shrink-0 w-10">
        <p className={`text-base font-black tabular-nums ${isMe ? "text-ios-blue" : "text-white"}`}>
          {player.total_points}
        </p>
        <p className="text-[8px] text-ios-label3 leading-none mt-0.5">pts</p>
      </div>
    </motion.div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Rankings() {
  const { leaderboard, loading } = useLeaderboard();
  const { profile } = useAuth();

  const data = leaderboard.map((p) => ({ ...p, isMe: p.id === profile?.id }));
  const top3 = [data.find((p) => p.rank === 1), data.find((p) => p.rank === 2), data.find((p) => p.rank === 3)];
  const rest = data;
  const me = data.find((p) => p.isMe);
  const meInTop3 = me && me.rank <= 3;

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Ranking</h1>
          <p className="text-sm text-ios-label2 mt-1">{data.length} participantes</p>
        </div>
        {me && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-2xl shrink-0"
            style={{ background: "rgba(10,132,255,0.1)", border: "1px solid rgba(10,132,255,0.2)" }}
          >
            <span className="text-xs font-black text-ios-blue">#{me.rank}</span>
            <div className="w-px h-3" style={{ background: "rgba(10,132,255,0.3)" }} />
            <span className="text-xs font-bold text-ios-blue tabular-nums">{me.total_points} pts</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl animate-pulse" style={{ height: i === 1 ? 180 : 64, background: "#1c1c1e" }} />
          ))}
        </div>
      ) : (
        <>
          {/* Podio con glow de fondo */}
          {top3.some(Boolean) && (
            <div className="mb-6 relative">
              {/* Ambient glow */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(255,214,0,0.07) 0%, transparent 65%)" }} />
              <p className="text-[10px] font-black text-ios-label3 uppercase tracking-[0.12em] mb-4">Podio</p>
              <div className="flex items-end gap-1.5 px-1">
                <PodiumSlot player={top3[1]} position={2} isMe={top3[1]?.isMe} />
                <PodiumSlot player={top3[0]} position={1} isMe={top3[0]?.isMe} />
                <PodiumSlot player={top3[2]} position={3} isMe={top3[2]?.isMe} />
              </div>
            </div>
          )}

          {/* Lista rank 4+ */}
          {rest.length > 0 && (
            <div className="mb-24">
              <p className="text-[10px] font-black text-ios-label3 uppercase tracking-[0.12em] mb-3">Clasificación</p>
              <motion.div variants={container} initial="hidden" animate="show" className="rounded-2xl overflow-hidden" style={{ background: "#1c1c1e" }}>
                {rest.map((player, i) => (
                  <ListRow key={player.id} player={player} isLast={i === rest.length - 1} isMe={player.isMe} />
                ))}
              </motion.div>
            </div>
          )}

          {/* Sticky "tú" si no está en top 3 */}
          {me && !meInTop3 && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 360, damping: 30, delay: 0.25 }}
              className="fixed bottom-0 left-0 right-0 z-40 px-4"
              style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))", paddingTop: 8 }}
            >
              <div
                className="rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ background: "rgba(10,132,255,0.13)", border: "1px solid rgba(10,132,255,0.3)", backdropFilter: "blur(24px)" }}
              >
                <div className="flex flex-col items-center w-7 shrink-0">
                  <span className="text-xs font-black text-ios-blue">#{me.rank}</span>
                </div>
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
      )}
    </>
  );
}
