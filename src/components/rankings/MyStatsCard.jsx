import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Target, ChevronRight } from 'lucide-react'
import { useMyStats } from '../../hooks/useMyStats'
import BetHistorySheet from './BetHistorySheet'

function StatPill({ value, label, color = '#aeaeb2', highlight = false }) {
  return (
    <div
      className="flex flex-col items-center gap-1 flex-1 py-3 rounded-xl"
      style={{ background: highlight ? `${color}12` : 'rgba(255,255,255,0.04)' }}
    >
      <span
        className="text-xl font-black tabular-nums leading-none"
        style={{ color: highlight ? color : '#fff' }}
      >
        {value}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#636366' }}>
        {label}
      </span>
    </div>
  )
}

export default function MyStatsCard() {
  const { stats, loading } = useMyStats()
  const [sheetOpen, setSheetOpen] = useState(false)

  if (loading || !stats) return null
  if (stats.total === 0 && stats.pending === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
      className="rounded-2xl overflow-hidden mb-6"
      style={{ background: '#1c1c1e' }}
    >
      {/* Top bar */}
      <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #0a84ff, #bf5af2 60%, transparent)' }} />

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black text-ios-label3 uppercase tracking-[0.12em]">
            Mi rendimiento
          </span>
          <div className="flex items-center gap-3">
            {stats.streak > 1 && (
              <div className="flex items-center gap-1">
                <Flame size={11} style={{ color: '#ff9f0a' }} />
                <span className="text-[11px] font-black" style={{ color: '#ff9f0a' }}>
                  {stats.streak} seguidos
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Target size={11} className="text-ios-label3" />
              <span className="text-[11px] font-bold text-ios-label2">{stats.pct}%</span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="flex gap-2">
          <StatPill value={stats.exactos}   label="Exactos"   color="#ffd60a" highlight={stats.exactos > 0} />
          <StatPill value={stats.acertados} label="Aciertos"  color="#30d158" highlight={stats.acertados > 0} />
          <StatPill value={stats.fallados}  label="Fallos"    color="#ff453a" highlight={false} />
          <StatPill value={stats.pending}   label="Pendiente" color="#0a84ff" highlight={false} />
        </div>

        {/* Footer: total + ver historial */}
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center justify-between w-full mt-3 pt-3 border-t border-ios-border/30"
        >
          <span className="text-[11px] text-ios-label3">
            {stats.total} con resultado · {stats.total + stats.pending} en total
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-ios-blue">Ver historial</span>
            <ChevronRight size={12} className="text-ios-blue" />
          </div>
        </button>
      </div>

      <BetHistorySheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </motion.div>
  )
}
