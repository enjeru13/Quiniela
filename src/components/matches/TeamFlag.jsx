import { useState } from 'react'

export default function TeamFlag({ code, size = 'md', short }) {
  const [error, setError] = useState(false)

  const sizes = {
    xs: 'w-5 h-3',
    sm: 'w-8 h-5',
    md: 'w-14 h-10',
    lg: 'w-20 h-14',
  }

  if (error) {
    return (
      <div
        className={`${sizes[size]} rounded-sm flex items-center justify-center`}
        style={{ background: '#3a3a3c' }}
      >
        <span className="text-[9px] font-black text-ios-label3 uppercase">
          {short ?? code?.slice(0, 3) ?? '?'}
        </span>
      </div>
    )
  }

  return (
    <img
      src={`https://flagcdn.com/w80/${code?.toLowerCase()}.png`}
      alt={code}
      className={`${sizes[size]} object-cover rounded-sm shadow-lg`}
      loading="lazy"
      onError={() => setError(true)}
    />
  )
}
