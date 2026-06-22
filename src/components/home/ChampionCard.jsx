import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Pencil, ChevronRight, X } from 'lucide-react'
import TeamFlag from '../matches/TeamFlag'
import { useChampionPick } from '../../hooks/useChampionPick'

export default function ChampionCard({ matches }) {
  const { pick, savePick, saving } = useChampionPick()
  const [open, setOpen] = useState(false)

  // Lock once any knockout match is live or finished
  const isLocked = useMemo(
    () => matches.some(m => !m.stage.startsWith('Grupo') && m.status !== 'scheduled'),
    [matches]
  )

  // All unique teams from match data, sorted alphabetically
  const teams = useMemo(() => {
    const map = new Map()
    matches.forEach(m => {
      if (m.home_team?.short) map.set(m.home_team.short, m.home_team)
      if (m.away_team?.short) map.set(m.away_team.short, m.away_team)
    })
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [matches])

  const pickedTeam = pick ? teams.find(t => t.short === pick) : null

  const handlePick = async (tla) => {
    await savePick(tla)
    setOpen(false)
  }

  return (
    <div className="mb-5">
      <motion.div
        layout
        className="rounded-2xl overflow-hidden"
        style={{ background: '#1c1c1e' }}
      >
        {/* Top accent bar */}
        <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #ffd60a, #ff9f0a 60%, transparent)' }} />

        <div className="p-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black text-ios-label3 uppercase tracking-[0.14em]">
              Campeón Mundial
            </span>
            {isLocked && <Lock size={11} className="text-ios-label3" />}
          </div>

          {!open ? (
            /* Collapsed state */
            pickedTeam ? (
              <div className="flex items-center gap-3 mt-2">
                <TeamFlag code={pickedTeam.flag_code} short={pickedTeam.short} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-black text-white leading-none">{pickedTeam.name}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: '#ffd60a' }}>+10 pts si aciertas</p>
                </div>
                {!isLocked && (
                  <button
                    onClick={() => setOpen(true)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <Pencil size={13} className="text-ios-label2" />
                  </button>
                )}
              </div>
            ) : isLocked ? (
              <p className="text-sm text-ios-label3 mt-2">No elegiste campeón</p>
            ) : (
              <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 mt-2 group"
              >
                <p className="text-base font-black text-white">¿Quién gana el Mundial?</p>
                <ChevronRight size={16} className="text-ios-blue group-hover:translate-x-0.5 transition-transform" />
              </button>
            )
          ) : (
            /* Picker expanded */
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mt-2 mb-3">
                  <p className="text-sm font-bold text-ios-label2">Elige tu campeón</p>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    <X size={12} className="text-ios-label2" />
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {teams.map(team => (
                    <motion.button
                      key={team.short}
                      onClick={() => handlePick(team.short)}
                      disabled={saving}
                      whileTap={{ scale: 0.88 }}
                      className="flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all focus:outline-none"
                      style={
                        pick === team.short
                          ? { background: 'rgba(255,214,10,0.15)', outline: '1.5px solid #ffd60a' }
                          : { background: 'rgba(255,255,255,0.04)' }
                      }
                    >
                      <TeamFlag code={team.flag_code} short={team.short} size="sm" />
                      <span className="text-[8px] font-bold text-ios-label3 text-center leading-tight">
                        {team.short}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  )
}
