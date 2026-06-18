import { Trophy } from 'lucide-react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import PullToRefresh from './PullToRefresh'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-ios-bg">
      <Sidebar />

      <div className="lg:ml-64 min-h-screen">
        <header className="lg:hidden sticky top-0 z-40 bg-ios-bg/95 backdrop-blur-xl border-b border-ios-border px-4 py-3 flex items-center gap-2.5">
          <Trophy size={18} className="text-ios-orange" />
          <span className="font-bold tracking-tight text-sm">Quiniela Mundial 2026</span>
        </header>

        <PullToRefresh />

        <main className="max-w-2xl lg:max-w-3xl mx-auto px-4 lg:px-8 pt-6 pb-28 lg:pb-12">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
