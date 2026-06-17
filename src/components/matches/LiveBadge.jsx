import { useState, useEffect } from 'react'

function calcMinuteFromKickoff(kickoffAt) {
  const elapsed = Math.floor((Date.now() - new Date(kickoffAt)) / 60_000)
  if (elapsed < 0) return null
  if (elapsed <= 47) return elapsed           // first half
  if (elapsed <= 60) return null              // half-time break (~15 min)
  const secondHalf = elapsed - 60 + 45       // second half: 71-60+45=56 ✓
  return Math.min(secondHalf, 97)
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
