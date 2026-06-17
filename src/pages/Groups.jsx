import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TeamFlag from '../components/matches/TeamFlag'
import { useMatches } from '../contexts/MatchesContext'
import { computeGroupStandings } from '../lib/utils'

// WC 2026: top 2 per group (24) + best 8 third-place = 32 total
const POS_STYLE = {
  0: { bar: '#30d158', label: 'Clasifica', labelColor: '#30d158' },
  1: { bar: '#30d158', label: 'Clasifica', labelColor: '#30d158' },
  2: { bar: '#ff9f0a', label: '3er lugar', labelColor: '#ff9f0a' },
  3: { bar: '#3a3a3c', label: null, labelColor: null },
}

function GroupTab({ letter, isSelected, onClick }) {
  return (
    <motion.button
      layout
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="shrink-0 rounded-xl font-black text-xs uppercase tracking-wider"
      style={
        isSelected
          ? { background: '#0a84ff', color: '#fff', padding: '7px 14px', boxShadow: '0 4px 16px rgba(10,132,255,0.35)' }
          : { background: '#1c1c1e', color: '#636366', padding: '7px 14px' }
      }
    >
      {letter}
    </motion.button>
  )
}

function GroupTable({ group }) {
  return (
    <div className="bg-ios-card rounded-2xl overflow-hidden">
      {/* Column headers */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-ios-border/30">
        <div className="w-3 shrink-0" />
        <div className="w-4 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-bold text-ios-label3 uppercase tracking-wider">Equipo</span>
        </div>
        {['PJ', 'G', 'E', 'P', 'GF', 'GC', 'Pts'].map((col) => (
          <span key={col} className={`text-[9px] font-bold uppercase tracking-wider text-center shrink-0 ${col === 'Pts' ? 'w-8 text-white/50' : 'w-6 text-ios-label3'}`}>
            {col}
          </span>
        ))}
      </div>

      {group.teams.map((entry, i) => {
        const pos = POS_STYLE[i] ?? POS_STYLE[3]
        const gd = entry.gf - entry.gc

        return (
          <motion.div
            key={entry.team.short}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 30 }}
            className={`flex items-center gap-1 px-4 py-3 ${i < group.teams.length - 1 ? 'border-b border-ios-border/20' : ''}`}
          >
            {/* Position bar */}
            <div className="w-[3px] h-7 rounded-full shrink-0" style={{ background: pos.bar }} />

            {/* Position number */}
            <span className="text-[10px] font-black text-ios-label3 w-4 text-center tabular-nums shrink-0">{i + 1}</span>

            {/* Team */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <TeamFlag code={entry.team.flag_code} size="sm" short={entry.team.short} />
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate leading-none ${i < 2 ? 'text-white' : 'text-ios-label2'}`}>
                  {entry.team.name}
                </p>
                {pos.label && (
                  <p className="text-[9px] font-semibold mt-0.5" style={{ color: pos.labelColor }}>
                    {pos.label}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            {[entry.pj, entry.g, entry.e, entry.p, entry.gf, entry.gc].map((val, j) => (
              <span key={j} className="text-xs w-6 text-center tabular-nums text-ios-label2 shrink-0">{val}</span>
            ))}

            {/* Points */}
            <span className={`text-xs font-black w-8 text-center tabular-nums shrink-0 ${i === 0 ? 'text-white' : i < 2 ? 'text-ios-label2' : 'text-ios-label3'}`}>
              {entry.pts}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-52 rounded-2xl animate-pulse" style={{ background: '#1c1c1e' }} />
      ))}
    </div>
  )
}

export default function Groups() {
  const { matches, loading } = useMatches()
  const groups = useMemo(() => computeGroupStandings(matches), [matches])
  const [selected, setSelected] = useState(0)

  const current = groups[selected]

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
            <span className="w-2 h-2 rounded-full" style={{ background: '#ff9f0a' }} />
            <p className="text-[11px] text-ios-label3">Mejores 3ros también</p>
          </div>
        </div>
      </div>

      {/* Group tab selector */}
      {!loading && groups.length > 0 && (
        <motion.div
          layout
          className="flex gap-2 overflow-x-auto pb-1 mb-5"
          style={{ scrollbarWidth: 'none' }}
        >
          {groups.map((g, i) => (
            <GroupTab
              key={g.name}
              letter={g.name.replace('Grupo ', '')}
              isSelected={i === selected}
              onClick={() => setSelected(i)}
            />
          ))}
        </motion.div>
      )}

      {/* Group table */}
      {loading ? (
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
            {/* Group title */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-5 rounded-full bg-ios-orange" />
              <span className="text-sm font-black text-white uppercase tracking-wider">{current.name}</span>
              <span className="text-[11px] text-ios-label3 font-medium ml-1">
                {current.teams[0]?.pj ?? 0} de 3 jornadas
              </span>
            </div>

            <GroupTable group={current} />

            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 px-1">
              {[['PJ','Partidos jugados'], ['G','Ganados'], ['E','Empatados'], ['P','Perdidos'], ['GF','Goles a favor'], ['GC','Goles en contra'], ['Pts','Puntos']].map(([k, v]) => (
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
    </>
  )
}
