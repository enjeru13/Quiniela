import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star } from 'lucide-react'
import TeamFlag from '../matches/TeamFlag'
import { useBetHistory } from '../../hooks/useBetHistory'
import { useMatches } from '../../contexts/MatchesContext'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const FILTERS = [
  { id: 'all',      label: 'Todos' },
  { id: 'exact',    label: 'Exactos' },
  { id: 'correct',  label: 'Aciertos' },
  { id: 'wrong',    label: 'Fallos' },
  { id: 'pending',  label: 'Pendientes' },
]

function PredBadge({ pred, pts, isFinished }) {
  const color = !isFinished ? '#636366'
    : pts === 3 ? '#ffd60a'
    : pts === 1 ? '#30d158'
    : '#48484a'
  const bg = !isFinished ? 'rgba(255,255,255,0.06)'
    : pts === 3 ? 'rgba(255,214,0,0.12)'
    : pts === 1 ? 'rgba(48,209,88,0.1)'
    : 'rgba(255,255,255,0.04)'

  return (
    <div className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl shrink-0" style={{ background: bg, minWidth: 44 }}>
      <span className="text-sm font-black tabular-nums leading-none" style={{ color }}>
        {pred.pred_home}–{pred.pred_away}
      </span>
      {isFinished && pts !== null && (
        <span className="text-[9px] font-bold leading-none" style={{ color, opacity: 0.75 }}>
          {pts === 3 ? '★ 3pts' : pts === 1 ? '1pt' : '0pts'}
        </span>
      )}
      {!isFinished && (
        <span className="text-[9px] font-medium leading-none" style={{ color: '#636366' }}>pend.</span>
      )}
    </div>
  )
}

function HistoryRow({ pred, match, isLast }) {
  if (!match) return null
  const isFinished = match.status === 'finished'
  const dateStr = format(parseISO(match.kickoff_at), "d MMM", { locale: es })

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${!isLast ? 'border-b border-ios-border/20' : ''}`}>
      {/* Teams + result */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <TeamFlag code={match.home_team.flag_code} short={match.home_team.short} size="xs" />
          <span className="text-xs font-bold text-white">{match.home_team.short}</span>
          {isFinished ? (
            <span className="text-xs font-black tabular-nums text-ios-label2 mx-0.5">
              {match.home_score}–{match.away_score}
            </span>
          ) : (
            <span className="text-[10px] text-ios-label3 mx-0.5">vs</span>
          )}
          <span className="text-xs font-bold text-white">{match.away_team.short}</span>
          <TeamFlag code={match.away_team.flag_code} short={match.away_team.short} size="xs" />
        </div>
        <p className="text-[10px] text-ios-label3 mt-0.5 truncate">
          {match.stage} · {dateStr}
        </p>
      </div>

      {/* Prediction badge */}
      <PredBadge pred={pred} pts={pred.points_earned} isFinished={isFinished} />
    </div>
  )
}

export default function BetHistorySheet({ open, onClose }) {
  const { predictions, loading } = useBetHistory()
  const { matches } = useMatches()
  const [filter, setFilter] = useState('all')

  const enriched = useMemo(() => {
    return predictions
      .map(pred => ({
        pred,
        match: matches.find(m => m.id === pred.api_match_id) ?? null,
      }))
      .filter(({ match }) => match !== null)
      .sort((a, b) => new Date(b.match.kickoff_at) - new Date(a.match.kickoff_at))
  }, [predictions, matches])

  const filtered = useMemo(() => {
    switch (filter) {
      case 'exact':   return enriched.filter(({ pred }) => pred.points_earned === 3)
      case 'correct': return enriched.filter(({ pred }) => pred.points_earned === 1)
      case 'wrong':   return enriched.filter(({ pred }) => pred.points_earned === 0)
      case 'pending': return enriched.filter(({ pred }) => pred.points_earned === null)
      default:        return enriched
    }
  }, [enriched, filter])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-[61] rounded-t-3xl overflow-hidden"
            style={{ background: '#1c1c1e', maxHeight: '82vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: '#3a3a3c' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <h2 className="text-base font-black tracking-tight">Mis apuestas</h2>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <X size={14} className="text-ios-label2" />
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 px-5 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={
                    filter === f.id
                      ? { background: '#0a84ff', color: '#fff' }
                      : { background: 'rgba(255,255,255,0.07)', color: '#636366' }
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(82vh - 140px)' }}>
              {loading ? (
                <div className="flex flex-col gap-2 px-4 py-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: '#2c2c2e' }} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-ios-label3 text-sm py-12">Sin pronósticos en esta categoría</p>
              ) : (
                <div style={{ background: '#2c2c2e', borderRadius: 16, margin: '0 16px 32px' }}>
                  {filtered.map(({ pred, match }, i) => (
                    <HistoryRow
                      key={pred.api_match_id}
                      pred={pred}
                      match={match}
                      isLast={i === filtered.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
