import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus } from 'lucide-react'
import TeamFlag from '../matches/TeamFlag'
import { formatTime } from '../../lib/utils'

function ScoreInput({ value, onChange, teamName }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={() => onChange(value + 1)}
        className="w-10 h-10 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <Plus size={18} strokeWidth={2.5} />
      </button>

      <div className="flex flex-col items-center">
        <span className="text-[52px] font-black tabular-nums leading-none">{value}</span>
        <span className="text-[10px] font-semibold text-ios-label3 mt-1 text-center max-w-[80px] leading-tight">
          {teamName}
        </span>
      </div>

      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-10 h-10 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <Minus size={18} strokeWidth={2.5} />
      </button>
    </div>
  )
}

function WinnerPill({ homeScore, awayScore, homeName, awayName }) {
  const isHome = homeScore > awayScore
  const isAway = awayScore > homeScore
  const isDraw = homeScore === awayScore

  let label, color, bg

  if (isDraw) {
    label = 'Empate'
    color = '#ff9f0a'
    bg = 'rgba(255,159,10,0.12)'
  } else {
    label = `Gana ${isHome ? homeName : awayName}`
    color = '#30d158'
    bg = 'rgba(48,209,88,0.1)'
  }

  return (
    <motion.div
      key={label}
      initial={{ opacity: 0, y: 4, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="rounded-xl py-2.5 px-4 text-center"
      style={{ background: bg, border: `1px solid ${color}30` }}
    >
      <p className="text-sm font-black" style={{ color }}>
        {label}
      </p>
    </motion.div>
  )
}

export default function PredictionModal({ match, prediction, onSave, onClose }) {
  const [homeScore, setHomeScore] = useState(prediction?.pred_home ?? 0)
  const [awayScore, setAwayScore] = useState(prediction?.pred_away ?? 0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    setHomeScore(prediction?.pred_home ?? 0)
    setAwayScore(prediction?.pred_away ?? 0)
  }, [match, prediction])

  useEffect(() => {
    const handleKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!match) return null

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    const result = await onSave(match.id, { pred_home: homeScore, pred_away: awayScore })
    setSaving(false)
    if (result?.error) {
      setSaveError(result.error.message ?? 'Error al guardar')
    } else {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        />

        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="relative w-full sm:max-w-sm mx-4 sm:mx-auto rounded-3xl overflow-hidden z-10"
          style={{ background: '#1c1c1e', border: '1px solid #3a3a3c' }}
        >
          {/* Drag handle (mobile hint) */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full" style={{ background: '#636366' }} />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-3 pb-4">
            <div>
              <p className="text-[10px] font-black text-ios-label3 uppercase tracking-[0.14em]">
                {match.stage}
              </p>
              <p className="text-xs font-semibold text-ios-label2 mt-0.5">
                {formatTime(match.kickoff_at)} · Hoy
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ios-label2 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Flags row */}
          <div className="flex items-center justify-center gap-6 px-5 pb-5">
            <div className="flex flex-col items-center gap-1.5">
              <TeamFlag code={match.home_team.flag_code} size="md" />
              <span className="text-xs font-bold text-ios-label2 text-center max-w-[72px] leading-tight">
                {match.home_team.name}
              </span>
            </div>
            <span className="text-xl font-light text-ios-label3 mb-3">vs</span>
            <div className="flex flex-col items-center gap-1.5">
              <TeamFlag code={match.away_team.flag_code} size="md" />
              <span className="text-xs font-bold text-ios-label2 text-center max-w-[72px] leading-tight">
                {match.away_team.name}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px mx-5" style={{ background: '#3a3a3c' }} />

          {/* Score inputs side by side */}
          <div className="flex items-center justify-center gap-4 px-5 pt-6 pb-4">
            <div className="flex-1 flex justify-center">
              <ScoreInput
                value={homeScore}
                onChange={setHomeScore}
                teamName={match.home_team.name}
              />
            </div>

            <div className="flex flex-col items-center gap-1 shrink-0">
              <span className="text-3xl font-black text-ios-label3">–</span>
            </div>

            <div className="flex-1 flex justify-center">
              <ScoreInput
                value={awayScore}
                onChange={setAwayScore}
                teamName={match.away_team.name}
              />
            </div>
          </div>

          {/* Winner indicator */}
          <div className="px-5 pb-4">
            <AnimatePresence mode="wait">
              <WinnerPill
                key={`${homeScore}-${awayScore}`}
                homeScore={homeScore}
                awayScore={awayScore}
                homeName={match.home_team.name}
                awayName={match.away_team.name}
              />
            </AnimatePresence>
          </div>

          {/* Points hint */}
          <div className="flex justify-center gap-5 pb-4">
            <div className="flex items-center gap-1.5">
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,159,10,0.12)', color: '#ff9f0a' }}
              >
                +3
              </span>
              <span className="text-[10px] text-ios-label3 font-medium">resultado exacto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(10,132,255,0.12)', color: '#0a84ff' }}
              >
                +1
              </span>
              <span className="text-[10px] text-ios-label3 font-medium">ganador correcto</span>
            </div>
          </div>

          {/* Save button */}
          <div className="px-5 pb-6">
            {saveError && (
              <p className="text-center text-xs text-ios-red font-semibold mb-3">{saveError}</p>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 rounded-2xl text-white text-sm font-black active:scale-[0.98] transition-all"
              style={{
                background: saving ? '#2c2c2e' : 'linear-gradient(135deg, #0a84ff, #0066cc)',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Guardando…' : 'Guardar pronóstico'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
