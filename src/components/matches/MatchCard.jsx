import { motion } from 'framer-motion'
import { ChevronRight, Lock } from 'lucide-react'
import TeamFlag from './TeamFlag'
import LiveBadge from './LiveBadge'
import { formatTime, calcPoints } from '../../lib/utils'

export default function MatchCard({ match, prediction, onPredict }) {
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const isUpcoming = match.status === 'scheduled'
  const points = isFinished && prediction ? calcPoints(match, prediction) : null
  const homeWon = isFinished && match.home_score > match.away_score
  const awayWon = isFinished && match.away_score > match.home_score
  const isDraw = isFinished && match.home_score === match.away_score

  return (
    <motion.div
      onClick={() => isUpcoming && onPredict(match)}
      whileHover={isUpcoming ? { scale: 1.015, y: -1 } : {}}
      whileTap={isUpcoming ? { scale: 0.985 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`relative rounded-2xl overflow-hidden ${isUpcoming ? 'cursor-pointer' : ''}`}
      style={
        isLive
          ? { background: '#1c1c1e' }
          : { background: '#1c1c1e' }
      }
    >
      {/* Live gradient overlay */}
      {isLive && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,69,58,0.06) 0%, transparent 60%)',
          }}
        />
      )}

      {/* Live top bar */}
      {isLive && <div className="h-[2px] bg-gradient-to-r from-ios-red via-ios-orange to-transparent" />}

      <div className="relative p-5">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <span className="text-[10px] font-black text-ios-label3 uppercase tracking-[0.12em]">
            {match.stage}
          </span>
          {isLive ? (
            <LiveBadge minute={match.minute} kickoffAt={match.kickoff_at} apiStatus={match.api_status} />
          ) : isFinished ? (
            <span className="text-[10px] font-bold text-ios-label3 uppercase tracking-wider">Final</span>
          ) : (
            <span className="text-[11px] font-semibold text-ios-label2">{formatTime(match.kickoff_at)}</span>
          )}
        </div>

        {/* Teams + Score row */}
        <div className="flex items-center gap-2">
          {/* Home */}
          <div className="flex flex-col items-center flex-1 gap-2.5 min-w-0">
            <div className={`transition-opacity ${isFinished && awayWon ? 'opacity-40' : 'opacity-100'}`}>
              <TeamFlag code={match.home_team.flag_code} short={match.home_team.short} />
            </div>
            <span
              className={`text-[11px] font-bold text-center tracking-tight leading-tight w-full ${
                homeWon ? 'text-white' : 'text-ios-label2'
              }`}
            >
              {match.home_team.name}
            </span>
          </div>

          {/* Score center */}
          <div className="flex flex-col items-center shrink-0 min-w-[96px] gap-1">
            {isUpcoming ? (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[22px] font-black text-ios-label3 tracking-tight leading-none">vs</span>
                <span className="text-[10px] text-ios-label3 font-medium">{formatTime(match.kickoff_at)}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[46px] font-black tabular-nums leading-none tracking-tighter ${
                      homeWon ? 'text-white' : isDraw ? 'text-ios-label2' : 'text-ios-label3'
                    }`}
                  >
                    {match.home_score}
                  </span>
                  <span className="text-ios-label3 text-xl font-light mb-0.5">—</span>
                  <span
                    className={`text-[46px] font-black tabular-nums leading-none tracking-tighter ${
                      awayWon ? 'text-white' : isDraw ? 'text-ios-label2' : 'text-ios-label3'
                    }`}
                  >
                    {match.away_score}
                  </span>
                </div>
                {match.api_status === 'FINISHED' && match.half_time_home !== null && (
                  <span className="text-[10px] text-ios-label3 font-medium tabular-nums">
                    1T: {match.half_time_home}–{match.half_time_away}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-col items-center flex-1 gap-2.5 min-w-0">
            <div className={`transition-opacity ${isFinished && homeWon ? 'opacity-40' : 'opacity-100'}`}>
              <TeamFlag code={match.away_team.flag_code} short={match.away_team.short} />
            </div>
            <span
              className={`text-[11px] font-bold text-center tracking-tight leading-tight w-full ${
                awayWon ? 'text-white' : 'text-ios-label2'
              }`}
            >
              {match.away_team.name}
            </span>
          </div>
        </div>

        {/* Footer */}
        {prediction ? (
          <div className="mt-4 pt-3.5 border-t border-ios-border flex justify-between items-center">
            <span className="text-[11px] text-ios-label3 font-medium">
              Pronóstico:{' '}
              <span className="text-ios-label2 font-semibold">
                {prediction.pred_home}–{prediction.pred_away}
              </span>
            </span>
            <div className="flex items-center gap-2">
              {isFinished && points !== null && (
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    points > 0
                      ? 'bg-ios-green/15 text-ios-green'
                      : 'bg-ios-border/50 text-ios-label3'
                  }`}
                >
                  {points > 0 ? `+${points} pts` : '0 pts'}
                </span>
              )}
              {isUpcoming && (
                <>
                  <span className="text-[11px] text-ios-blue font-semibold">Editar</span>
                  <ChevronRight size={12} className="text-ios-blue" />
                </>
              )}
              {isLive && <Lock size={11} className="text-ios-label3" />}
            </div>
          </div>
        ) : isUpcoming ? (
          <div className="mt-4 pt-3.5 border-t border-ios-border flex justify-between items-center">
            <span className="text-[11px] font-bold text-ios-blue">Hacer pronóstico</span>
            <ChevronRight size={14} className="text-ios-blue" />
          </div>
        ) : isFinished ? (
          <div className="mt-4 pt-3.5 border-t border-ios-border">
            <span className="text-[11px] text-ios-label3 font-medium">Sin pronóstico</span>
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
