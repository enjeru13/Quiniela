import { motion } from 'framer-motion'
import { Target, Zap } from 'lucide-react'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useAuth } from '../contexts/AuthContext'

const MEDAL = {
  1: { color: '#ffd60a', bg: 'rgba(255,214,0,0.08)', border: 'rgba(255,214,0,0.2)', emoji: '🥇' },
  2: { color: '#aeaeb2', bg: 'rgba(174,174,178,0.07)', border: 'rgba(174,174,178,0.18)', emoji: '🥈' },
  3: { color: '#cd7f32', bg: 'rgba(205,127,50,0.07)', border: 'rgba(205,127,50,0.18)', emoji: '🥉' },
}

function efficiency(p) {
  if (!p.predictions_count) return 0
  return (p.total_points / p.predictions_count).toFixed(1)
}

function Avatar({ username, size = 36 }) {
  const colors = [
    ['#0a84ff', '#30d158'],
    ['#ff453a', '#ff9f0a'],
    ['#bf5af2', '#0a84ff'],
    ['#30d158', '#0a84ff'],
    ['#ff9f0a', '#ff453a'],
  ]
  const [from, to] = colors[username.charCodeAt(0) % colors.length]
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-black text-white"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${from}, ${to})`, fontSize: size * 0.32 }}
    >
      {username.slice(0, 2).toUpperCase()}
    </div>
  )
}

// ── Podio olímpico ──────────────────────────────────────────────────────────
function PodiumSlot({ player, position, isMe }) {
  const m = MEDAL[position]
  const heights = { 1: 88, 2: 64, 3: 52 }
  const avatarSizes = { 1: 52, 2: 44, 3: 40 }
  const order = { 1: 'order-2', 2: 'order-1', 3: 'order-3' }

  if (!player) return <div className={`flex-1 ${order[position]}`} />

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.08, type: 'spring', stiffness: 360, damping: 28 }}
      className={`flex-1 flex flex-col items-center ${order[position]}`}
    >
      {/* Crown/medal */}
      <div className="relative mb-2">
        <Avatar username={player.username} size={avatarSizes[position]} />
        <span
          className="absolute -bottom-1.5 -right-1.5 text-sm leading-none"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
        >
          {m.emoji}
        </span>
        {isMe && (
          <div
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: '0 0 0 2.5px #0a84ff' }}
          />
        )}
      </div>

      <p className="text-xs font-black text-center truncate w-full px-1 leading-tight" style={{ color: isMe ? '#0a84ff' : '#fff' }}>
        {player.username}
      </p>
      <p className="text-lg font-black tabular-nums mt-0.5" style={{ color: m.color }}>
        {player.total_points}
      </p>
      <p className="text-[9px] font-medium mb-2" style={{ color: m.color, opacity: 0.6 }}>pts</p>

      {/* Podium block */}
      <div
        className="w-full rounded-t-xl flex items-center justify-center"
        style={{
          height: heights[position],
          background: m.bg,
          border: `1px solid ${m.border}`,
          borderBottom: 'none',
        }}
      >
        <span className="text-2xl font-black" style={{ color: m.color, opacity: 0.25 }}>
          {position}
        </span>
      </div>
    </motion.div>
  )
}

// ── Fila lista ──────────────────────────────────────────────────────────────
const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
const item = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } },
}

function ListRow({ player, isLast, isMe }) {
  const eff = efficiency(player)
  const maxPts = 3 * (player.predictions_count || 1)
  const progress = Math.round((player.total_points / maxPts) * 100)

  return (
    <motion.div
      variants={item}
      className={`flex items-center px-4 py-3 gap-3 ${isMe ? 'bg-ios-blue/10' : ''} ${!isLast ? 'border-b border-ios-border/30' : ''}`}
    >
      <span className="text-xs font-black text-ios-label3 w-5 text-center tabular-nums shrink-0">
        {player.rank}
      </span>
      <Avatar username={player.username} size={32} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate leading-none ${isMe ? 'text-ios-blue' : 'text-white'}`}>
          {player.username}
        </p>
        <div className="mt-1.5 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: isMe ? '#0a84ff' : '#3a3a3c' }}
          />
        </div>
      </div>
      {/* exactos */}
      <div className="text-center w-8 shrink-0">
        <p className="text-xs font-bold tabular-nums" style={{ color: '#ff9f0a' }}>{player.exact_count}</p>
        <p className="text-[8px] text-ios-label3 leading-none mt-0.5">exactos</p>
      </div>
      {/* eficiencia */}
      <div className="text-center w-10 shrink-0">
        <p className="text-xs font-bold tabular-nums text-ios-label2">{eff}</p>
        <p className="text-[8px] text-ios-label3 leading-none mt-0.5">pts/pred</p>
      </div>
      {/* puntos */}
      <div className="text-right w-9 shrink-0">
        <p className={`text-sm font-black tabular-nums ${isMe ? 'text-ios-blue' : 'text-white'}`}>
          {player.total_points}
        </p>
        <p className="text-[8px] text-ios-label3 leading-none mt-0.5">pts</p>
      </div>
    </motion.div>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function Rankings() {
  const { leaderboard, loading } = useLeaderboard()
  const { profile } = useAuth()

  const data = leaderboard.map((p) => ({ ...p, isMe: p.id === profile?.id }))
  const top3 = [data.find(p => p.rank === 1), data.find(p => p.rank === 2), data.find(p => p.rank === 3)]
  const rest = data.filter(p => p.rank > 3)
  const me = data.find(p => p.isMe)
  const meInTop3 = me && me.rank <= 3

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Ranking</h1>
        <p className="text-sm text-ios-label2 mt-1">{data.length} participantes</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: '#1c1c1e' }} />
          ))}
        </div>
      ) : (
        <>
          {/* Podio */}
          {top3.some(Boolean) && (
            <div className="mb-6">
              <p className="text-[10px] font-black text-ios-label3 uppercase tracking-[0.12em] mb-4">Podio</p>
              <div className="flex items-end gap-2 px-2">
                <PodiumSlot player={top3[1]} position={2} isMe={top3[1]?.isMe} />
                <PodiumSlot player={top3[0]} position={1} isMe={top3[0]?.isMe} />
                <PodiumSlot player={top3[2]} position={3} isMe={top3[2]?.isMe} />
              </div>
            </div>
          )}

          {/* Lista */}
          {rest.length > 0 && (
            <div className="mb-24">
              <p className="text-[10px] font-black text-ios-label3 uppercase tracking-[0.12em] mb-3">Clasificación</p>
              <motion.div variants={container} initial="hidden" animate="show" className="rounded-2xl overflow-hidden" style={{ background: '#1c1c1e' }}>
                {rest.map((player, i) => (
                  <ListRow key={player.id} player={player} isLast={i === rest.length - 1} isMe={player.isMe} />
                ))}
              </motion.div>
            </div>
          )}

          {/* Sticky "tú" — solo si no está en el top 3 visible */}
          {me && !meInTop3 && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32, delay: 0.3 }}
              className="fixed bottom-0 left-0 right-0 z-40 px-4"
              style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))', paddingTop: 8 }}
            >
              <div
                className="rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{
                  background: 'rgba(10,132,255,0.15)',
                  border: '1px solid rgba(10,132,255,0.35)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <span className="text-xs font-black text-ios-blue w-6 text-center">#{me.rank}</span>
                <Avatar username={me.username} size={34} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-ios-blue truncate">{me.username}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <div className="flex items-center gap-1">
                      <Target size={9} className="text-ios-label3" />
                      <span className="text-[10px] text-ios-label3">{me.exact_count} exactos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap size={9} className="text-ios-label3" />
                      <span className="text-[10px] text-ios-label3">{efficiency(me)} pts/pred</span>
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
  )
}
