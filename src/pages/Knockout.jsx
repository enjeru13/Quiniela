import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, CheckCircle2, Clock, LayoutList, Trophy } from 'lucide-react'
import TeamFlag from '../components/matches/TeamFlag'
import LiveBadge from '../components/matches/LiveBadge'
import { useMatches } from '../contexts/MatchesContext'
import { computeGroupStandings } from '../lib/utils'
import { format as dateFnsFormat } from 'date-fns'
import { es } from 'date-fns/locale'

const PHASE_ORDER = [
  'Ronda de 32',
  'Octavos de Final',
  'Cuartos de Final',
  'Semifinal',
  'Tercer Puesto',
  'Final',
]

const PHASE_SHORT = {
  'Ronda de 32': 'Ronda 32',
  'Octavos de Final': 'Octavos',
  'Cuartos de Final': 'Cuartos',
  'Semifinal': 'Semis',
  'Tercer Puesto': '3er Lugar',
  'Final': 'Final',
}

// ── Match card for knockout ─────────────────────────────────────────────────
function KnockoutMatchCard({ match }) {
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const isScheduled = match.status === 'scheduled'
  const homeWon = isFinished && match.home_score > match.away_score
  const awayWon = isFinished && match.away_score > match.home_score
  const tbd = !match.home_team?.name || match.home_team.name === '?'

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#1c1c1e' }}
    >
      {isLive && <div className="h-[2px] bg-gradient-to-r from-ios-red via-ios-orange to-transparent" />}

      <div className="p-4">
        {/* Top row */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-black text-ios-label3 uppercase tracking-[0.12em]">
            {match.stage}
          </span>
          {isLive ? (
            <LiveBadge minute={match.minute} kickoffAt={match.kickoff_at} apiStatus={match.api_status} />
          ) : isFinished ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={11} style={{ color: '#30d158' }} />
              <span className="text-[10px] font-bold text-ios-label3 uppercase tracking-wider">Final</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-ios-label3" />
              <span className="text-[11px] font-semibold text-ios-label2">
                {dateFnsFormat(new Date(match.kickoff_at), "d MMM · HH:mm", { locale: es })}
              </span>
            </div>
          )}
        </div>

        {/* Teams */}
        {tbd ? (
          <div className="flex items-center justify-center py-4 gap-3">
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-14 h-10 rounded-sm animate-pulse" style={{ background: '#2c2c2e' }} />
              <span className="text-[10px] text-ios-label3">Por definir</span>
            </div>
            <span className="text-lg font-black text-ios-label3">vs</span>
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-14 h-10 rounded-sm animate-pulse" style={{ background: '#2c2c2e' }} />
              <span className="text-[10px] text-ios-label3">Por definir</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Home */}
            <div className="flex flex-col items-center flex-1 gap-2 min-w-0">
              <div className={isFinished && awayWon ? 'opacity-35' : ''}>
                <TeamFlag code={match.home_team.flag_code} short={match.home_team.short} />
              </div>
              <span className={`text-[11px] font-bold text-center leading-tight w-full ${homeWon ? 'text-white' : 'text-ios-label2'}`}>
                {match.home_team.name}
              </span>
            </div>

            {/* Score */}
            <div className="shrink-0 min-w-[80px] flex flex-col items-center gap-1">
              {isScheduled ? (
                <span className="text-xl font-black text-ios-label3">vs</span>
              ) : (
                <div className="flex items-center gap-1">
                  <span className={`text-[40px] font-black tabular-nums leading-none ${homeWon ? 'text-white' : 'text-ios-label2'}`}>
                    {match.home_score}
                  </span>
                  <span className="text-ios-label3 text-lg font-light">—</span>
                  <span className={`text-[40px] font-black tabular-nums leading-none ${awayWon ? 'text-white' : 'text-ios-label2'}`}>
                    {match.away_score}
                  </span>
                </div>
              )}
            </div>

            {/* Away */}
            <div className="flex flex-col items-center flex-1 gap-2 min-w-0">
              <div className={isFinished && homeWon ? 'opacity-35' : ''}>
                <TeamFlag code={match.away_team.flag_code} short={match.away_team.short} />
              </div>
              <span className={`text-[11px] font-bold text-center leading-tight w-full ${awayWon ? 'text-white' : 'text-ios-label2'}`}>
                {match.away_team.name}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Phase tab ───────────────────────────────────────────────────────────────
function PhaseTab({ label, isSelected, count, hasLive, onClick }) {
  return (
    <motion.button
      layout
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="shrink-0 flex flex-col items-center gap-1 rounded-xl px-3 py-2"
      style={
        isSelected
          ? { background: '#0a84ff', boxShadow: '0 4px 16px rgba(10,132,255,0.3)' }
          : { background: '#1c1c1e' }
      }
    >
      <span className={`text-[11px] font-black uppercase tracking-wide whitespace-nowrap ${isSelected ? 'text-white' : 'text-ios-label3'}`}>
        {label}
      </span>
      <div className="flex items-center gap-1">
        {hasLive
          ? <span className="w-1.5 h-1.5 rounded-full bg-ios-red live-pulse" />
          : <span className="text-[9px] font-semibold" style={{ color: isSelected ? 'rgba(255,255,255,0.6)' : '#48484a' }}>{count}</span>
        }
      </div>
    </motion.button>
  )
}

// ── Qualified teams list ────────────────────────────────────────────────────
function QualifiedList({ matches }) {
  const standings = useMemo(() => computeGroupStandings(matches), [matches])

  const qualified = standings.flatMap(g => {
    const finished = g.teams.filter(t => t.pj === 3)
    if (finished.length < 4) return []
    return g.teams.slice(0, 2).map((t, i) => ({
      ...t,
      from: `${i === 0 ? '1°' : '2°'} ${g.name}`,
    }))
  })

  if (qualified.length === 0) return null

  return (
    <div className="mb-6">
      <p className="text-[10px] font-black text-ios-label3 uppercase tracking-[0.12em] mb-3">
        Clasificados · {qualified.length} de 32
      </p>
      <div className="rounded-2xl overflow-hidden" style={{ background: '#1c1c1e' }}>
        {qualified.map((t, i) => (
          <div key={`${t.team.short}-${i}`} className={`flex items-center gap-3 px-4 py-3 ${i < qualified.length - 1 ? 'border-b border-ios-border/25' : ''}`}>
            <div className="w-[3px] h-5 rounded-full bg-ios-green shrink-0" />
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
  )
}

// ── Bracket slot — altura siempre consistente (2 filas) ────────────────────
function BracketSlot({ match, large = false }) {
  const pad = large ? '10px 14px' : '8px 12px'
  const minW = large ? 180 : 150
  const hasteams = match?.home_team?.name && match.home_team.name !== '?'

  const rows = hasteams
    ? [
        { team: match.home_team, score: match.home_score, won: match.status === 'finished' && match.home_score > match.away_score },
        { team: match.away_team, score: match.away_score, won: match.status === 'finished' && match.away_score > match.home_score },
      ]
    : [{ team: null }, { team: null }]

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#2c2c2e', minWidth: minW }}>
      {rows.map(({ team, score, won }, i) => (
        <div
          key={i}
          className={`flex items-center gap-2.5 ${i === 0 ? 'border-b border-ios-border/30' : ''} ${won ? 'bg-ios-green/10' : ''}`}
          style={{ padding: pad }}
        >
          {team ? (
            <>
              <TeamFlag code={team.flag_code} size="sm" short={team.short} />
              <span className={`${large ? 'text-xs' : 'text-[11px]'} font-bold flex-1 truncate ${won ? 'text-white' : 'text-ios-label2'}`}>
                {team.name}
              </span>
              {score !== null && score !== undefined && (
                <span className={`${large ? 'text-sm' : 'text-xs'} font-black tabular-nums ${won ? 'text-white' : 'text-ios-label3'}`}>
                  {score}
                </span>
              )}
            </>
          ) : (
            <>
              <div className="rounded-sm shrink-0" style={{ width: 32, height: 20, background: '#3a3a3c' }} />
              <div className="h-2.5 rounded flex-1" style={{ background: '#3a3a3c', opacity: 0.4, maxWidth: i === 0 ? 72 : 56 }} />
            </>
          )}
        </div>
      ))}
    </div>
  )
}

// ── SVG bracket arm ─────────────────────────────────────────────────────────
function BracketArm({ height, slotA_y, slotB_y, armW }) {
  const vx = Math.round(armW * 0.55)
  const cy = (slotA_y + slotB_y) / 2
  const c = 'rgba(80,80,85,0.7)'
  return (
    <svg width={armW} height={height} style={{ flexShrink: 0, display: 'block' }}>
      <line x1={0}   y1={slotA_y} x2={vx} y2={slotA_y} stroke={c} strokeWidth={1.5} strokeLinecap="round" />
      <line x1={vx}  y1={slotA_y} x2={vx} y2={slotB_y} stroke={c} strokeWidth={1.5} />
      <line x1={0}   y1={slotB_y} x2={vx} y2={slotB_y} stroke={c} strokeWidth={1.5} strokeLinecap="round" />
      <line x1={vx}  y1={cy}      x2={armW} y2={cy}     stroke={c} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  )
}

// ── Bracket with lines ───────────────────────────────────────────────────────
function BracketPreview({ knockoutMatches, large = false }) {
  // Slot heights based on CSS: padding-top/bottom + flag(20px) × 2 rows + 1px border
  const SH = large ? 81 : 73
  const IG = large ? 10 : 6    // inner gap between slots in a pair
  const GG = large ? 24 : 16   // gap between pairs in Cuartos
  const AW = large ? 24 : 18   // arm width

  const pairH  = SH * 2 + IG
  const P1C    = SH / 2 + IG / 2 + SH / 2       // = SH + IG/2  ≈ 86
  const P2C    = pairH + GG + P1C               // pair 2 center ≈ 284

  const S1top  = Math.round(P1C - SH / 2)        // ≈ 45
  const S2top  = Math.round(P2C - SH / 2)        // ≈ 243
  const semisGap = S2top - S1top - SH            // ≈ 117

  const FC     = Math.round((P1C + P2C) / 2)     // ≈ 185
  const Ftop   = FC - Math.round(SH / 2)         // ≈ 145

  // Arm Q→S: one per pair (height = pairH)
  const qArmA  = Math.round(SH / 2)
  const qArmB  = pairH - Math.round(SH / 2)

  // Arm S→F (relative to S1 top)
  const sArmH  = SH + semisGap + SH
  const sArmA  = Math.round(SH / 2)
  const sArmB  = sArmH - Math.round(SH / 2)

  const qm = knockoutMatches.filter(m => m.stage === 'Cuartos de Final')
  const sm = knockoutMatches.filter(m => m.stage === 'Semifinal')
  const fm = knockoutMatches.filter(m => m.stage === 'Final')
  const tm = knockoutMatches.filter(m => m.stage === 'Tercer Puesto')

  const slotW = large ? 180 : 150
  const labels = [
    { label: 'Cuartos', left: 0 },
    { label: 'Semis',   left: slotW + AW },
    { label: 'Final',   left: slotW + AW + slotW + AW },
  ]

  return (
    <div className={large ? '' : 'mb-4'}>
      {!large && (
        <p className="text-[10px] font-black text-ios-label3 uppercase tracking-[0.12em] mb-3">Bracket final</p>
      )}
      <div className="overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
        <div style={{ minWidth: 'max-content', position: 'relative' }}>

          {/* Column labels */}
          <div className="flex mb-3" style={{ gap: 0 }}>
            {labels.map(({ label, left }) => (
              <div key={label} style={{ width: slotW, marginLeft: left === 0 ? 0 : AW }}>
                <p className={`font-black text-ios-label3 uppercase tracking-wider text-center ${large ? 'text-xs' : 'text-[10px]'}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Bracket row */}
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>

            {/* Cuartos: 2 pairs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: GG }}>
              {[[qm[0], qm[1]], [qm[2], qm[3]]].map((pair, pi) => (
                <div key={pi} style={{ display: 'flex', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: IG }}>
                    <BracketSlot match={pair[0]} large={large} />
                    <BracketSlot match={pair[1]} large={large} />
                  </div>
                  <BracketArm height={pairH} slotA_y={qArmA} slotB_y={qArmB} armW={AW} />
                </div>
              ))}
            </div>

            {/* Semis */}
            <div style={{ paddingTop: S1top, display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: semisGap }}>
                <BracketSlot match={sm[0]} large={large} />
                <BracketSlot match={sm[1]} large={large} />
              </div>
              <BracketArm height={sArmH} slotA_y={sArmA} slotB_y={sArmB} armW={AW} />
            </div>

            {/* Final */}
            <div style={{ paddingTop: Ftop }}>
              <BracketSlot match={fm[0]} large={large} />
            </div>

          </div>

          {/* 3er Lugar */}
          <div style={{ marginTop: large ? 20 : 14 }}>
            <p className={`font-black text-ios-label3 uppercase tracking-wider mb-2 ${large ? 'text-xs' : 'text-[10px]'}`}>
              3er Lugar
            </p>
            <BracketSlot match={tm[0]} large={large} />
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function Knockout() {
  const { matches, loading } = useMatches()
  const [selectedPhase, setSelectedPhase] = useState(0)
  const [view, setView] = useState('list') // 'list' | 'bracket'

  const knockoutMatches = useMemo(
    () => matches.filter(m => !m.stage.startsWith('Grupo')),
    [matches]
  )

  const phases = useMemo(() => {
    const present = new Set(knockoutMatches.map(m => m.stage))
    return PHASE_ORDER.filter(p => present.has(p))
  }, [knockoutMatches])

  const phaseMatches = useMemo(() => {
    const phase = phases[selectedPhase]
    if (!phase) return []
    return knockoutMatches.filter(m => m.stage === phase)
  }, [knockoutMatches, phases, selectedPhase])

  const groupStillActive = useMemo(() => {
    const groupMatches = matches.filter(m => m.stage.startsWith('Grupo'))
    return groupMatches.some(m => m.status !== 'finished')
  }, [matches])

  const finishedGroupMatches = useMemo(() => {
    return matches.filter(m => m.stage.startsWith('Grupo') && m.status === 'finished').length
  }, [matches])

  const totalGroupMatches = useMemo(() => {
    return matches.filter(m => m.stage.startsWith('Grupo')).length
  }, [matches])

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Eliminatorias</h1>
          <p className="text-sm text-ios-label2 mt-1">FIFA World Cup 2026</p>
        </div>
        {!loading && phases.length > 0 && (
          <div className="flex rounded-xl overflow-hidden shrink-0" style={{ background: '#1c1c1e' }}>
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-1.5 px-3 py-2 transition-all"
              style={{ background: view === 'list' ? '#0a84ff' : 'transparent' }}
            >
              <LayoutList size={13} style={{ color: view === 'list' ? '#fff' : '#636366' }} />
              <span className="text-[11px] font-black" style={{ color: view === 'list' ? '#fff' : '#636366' }}>Lista</span>
            </button>
            <button
              onClick={() => setView('bracket')}
              className="flex items-center gap-1.5 px-3 py-2 transition-all"
              style={{ background: view === 'bracket' ? '#0a84ff' : 'transparent' }}
            >
              <Trophy size={13} style={{ color: view === 'bracket' ? '#fff' : '#636366' }} />
              <span className="text-[11px] font-black" style={{ color: view === 'bracket' ? '#fff' : '#636366' }}>Bracket</span>
            </button>
          </div>
        )}
      </div>

      {/* Status banner */}
      {groupStillActive && (
        <div className="rounded-2xl p-4 mb-5 flex items-start gap-3" style={{ background: '#1c1c1e' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,159,10,0.15)' }}>
            <Lock size={15} className="text-ios-orange" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black">Fase de grupos en curso</p>
            <p className="text-xs text-ios-label2 mt-1 leading-relaxed">
              Los cruces se definen al terminar la jornada 3.
            </p>
            <div className="mt-2.5 h-1.5 rounded-full overflow-hidden" style={{ background: '#2c2c2e' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((finishedGroupMatches / totalGroupMatches) * 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                className="h-full rounded-full bg-ios-orange"
              />
            </div>
            <p className="text-[10px] text-ios-label3 mt-1">{finishedGroupMatches} / {totalGroupMatches} partidos de grupos</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: '#1c1c1e' }} />
          ))}
        </div>
      ) : phases.length === 0 ? (
        <>
          <QualifiedList matches={matches} />
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#1c1c1e' }}>
              <Lock size={24} className="text-ios-label3" />
            </div>
            <p className="text-sm font-black text-ios-label2">Bracket no disponible aún</p>
            <p className="text-xs text-ios-label3 text-center max-w-[220px] leading-relaxed">
              Los cruces se publicarán al finalizar la fase de grupos
            </p>
          </div>
        </>
      ) : (
        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {/* Phase tabs */}
              <motion.div layout className="flex gap-2 overflow-x-auto pb-1 mb-5" style={{ scrollbarWidth: 'none' }}>
                {phases.map((p, i) => {
                  const pm = knockoutMatches.filter(m => m.stage === p)
                  return (
                    <PhaseTab
                      key={p}
                      label={PHASE_SHORT[p] ?? p}
                      isSelected={i === selectedPhase}
                      count={pm.length}
                      hasLive={pm.some(m => m.status === 'live')}
                      onClick={() => setSelectedPhase(i)}
                    />
                  )
                })}
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedPhase}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-3 mb-6"
                >
                  {phaseMatches.map(m => (
                    <KnockoutMatchCard key={m.id} match={m} />
                  ))}
                </motion.div>
              </AnimatePresence>
              <QualifiedList matches={matches} />
            </motion.div>
          ) : (
            <motion.div key="bracket" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <BracketPreview knockoutMatches={knockoutMatches} large />
              <QualifiedList matches={matches} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  )
}
