import { NavLink } from 'react-router-dom'
import { Home, LayoutGrid, Trophy, BarChart2, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useMatches } from '../../contexts/MatchesContext'

const navItems = [
  { path: '/', label: 'Partidos', icon: Home },
  { path: '/grupos', label: 'Grupos', icon: LayoutGrid },
  { path: '/eliminatorias', label: 'Eliminatorias', icon: Trophy },
  { path: '/ranking', label: 'Ranking', icon: BarChart2 },
]

function Avatar({ username = '?', size = 32 }) {
  const colors = [
    ['#0a84ff', '#30d158'],
    ['#ff453a', '#ff9f0a'],
    ['#bf5af2', '#0a84ff'],
    ['#30d158', '#0a84ff'],
    ['#ff9f0a', '#ff453a'],
  ]
  const [from, to] = colors[username.charCodeAt(0) % colors.length]
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-black text-white"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        fontSize: size * 0.34,
      }}
    >
      {username.slice(0, 2).toUpperCase()}
    </div>
  )
}

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const { matches } = useMatches()
  const liveCount = matches.filter((m) => m.status === 'live').length

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 z-50"
      style={{ background: '#111111', borderRight: '1px solid #2c2c2e' }}
    >
      {/* Logo */}
      <div className="px-5 py-6">
        <div
          className="flex items-center gap-3 p-3 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,69,58,0.08))',
            border: '1px solid rgba(255,107,53,0.2)',
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #ff6b35, #ff453a)' }}
          >
            <Trophy size={17} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight leading-none text-white">Quiniela</p>
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#ff9f0a' }}>
              Mundial 2026
            </p>
          </div>
        </div>
      </div>

      {/* Live indicator — only when matches are live */}
      {liveCount > 0 && (
        <div className="px-5 mb-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.15)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-ios-red live-pulse" />
            <span className="text-[10px] font-black text-ios-red uppercase tracking-widest">
              {liveCount === 1 ? '1 partido en vivo' : `${liveCount} partidos en vivo`}
            </span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-ios-card2 text-white'
                  : 'text-ios-label2 hover:text-white hover:bg-ios-card2/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    isActive ? 'bg-ios-orange' : 'bg-transparent group-hover:bg-ios-card'
                  }`}
                >
                  <Icon
                    size={15}
                    className={isActive ? 'text-black' : 'text-current'}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-5 py-4 border-t" style={{ borderColor: '#2c2c2e' }}>
        <div className="flex items-center gap-2.5">
          <Avatar username={profile?.username ?? '?'} size={32} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate leading-none">
              {profile?.username ?? 'Usuario'}
            </p>
            <p className="text-[10px] text-ios-label3 mt-0.5">
              {profile?.total_points ?? 0} pts
            </p>
          </div>
          <button
            onClick={signOut}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-ios-label3 hover:text-ios-red transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            title="Cerrar sesión"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
