import { useState, useEffect } from 'react'

function calcMinuteFromKickoff(kickoffAt) {
  const elapsed = Math.floor((Date.now() - new Date(kickoffAt)) / 60_000)
  if (elapsed < 0) return null

  // First half: break at 22' (3 real min), then play resumes to 45'
  if (elapsed < 22) return elapsed
  if (elapsed < 25) return 22              // hydration break
  if (elapsed < 70) return Math.min(elapsed - 3, 55)  // 22–45'+ added time

  // Half-time (15 min, starts after 45'+ added time whistle)
  if (elapsed < 85) return null

  // Second half: same pattern offset, break at 67' (45+22)
  const sh = elapsed - 85
  if (sh < 22) return 45 + sh
  if (sh < 25) return 67                   // hydration break
  return Math.min(45 + sh - 3, 97)
}

export default function LiveBadge({ minute, kickoffAt, apiStatus }) {
  const [localMinute, setLocalMinute] = useState(() =>
    minute != null ? minute : calcMinuteFromKickoff(kickoffAt)
  )

  useEffect(() => {
    if (minute != null) {
      setLocalMinute(minute)
      return
    }
    // No API minute → compute locally, update every 30s
    setLocalMinute(calcMinuteFromKickoff(kickoffAt))
    const id = setInterval(() => {
      setLocalMinute(calcMinuteFromKickoff(kickoffAt))
    }, 30_000)
    return () => clearInterval(id)
  }, [minute, kickoffAt])

  const isHalfTime = apiStatus === 'PAUSED' || localMinute === null

  return (
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-ios-red live-pulse shrink-0" />
      <span className="text-xs font-black text-ios-red tabular-nums">
        {isHalfTime ? 'MT' : localMinute != null ? `${localMinute}'` : 'EN VIVO'}
      </span>
    </div>
  )
}
