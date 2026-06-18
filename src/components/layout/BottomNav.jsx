import { NavLink } from 'react-router-dom'
import { Home, LayoutGrid, Trophy, BarChart2, Users } from 'lucide-react'

const navItems = [
  { path: '/', label: 'Partidos', icon: Home },
  { path: '/grupos', label: 'Grupos', icon: LayoutGrid },
  { path: '/eliminatorias', label: 'KO', icon: Trophy },
  { path: '/ranking', label: 'Ranking', icon: BarChart2 },
  { path: '/ligas', label: 'Ligas', icon: Users },
]

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-ios-card/95 backdrop-blur-xl border-t border-ios-border">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all ${
                isActive ? 'text-ios-orange' : 'text-ios-label3'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
