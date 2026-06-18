import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { MatchesProvider } from './contexts/MatchesContext'
import Layout from './components/layout/Layout'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Groups from './pages/Groups'
import Knockout from './pages/Knockout'
import Rankings from './pages/Rankings'
import Leagues from './pages/Leagues'
import JoinLeague from './pages/JoinLeague'
import UpdatePrompt from './components/UpdatePrompt'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-ios-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-ios-orange border-t-transparent animate-spin" />
        <p className="text-xs text-ios-label3 font-medium">Cargando...</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />

  // Join route — works with or without auth (JoinLeague handles noauth state)
  if (window.location.pathname.startsWith('/unirse')) {
    return (
      <Routes>
        <Route path="/unirse/:code" element={<JoinLeague />} />
      </Routes>
    )
  }

  if (!user) return <Auth />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/grupos" element={<Groups />} />
        <Route path="/eliminatorias" element={<Knockout />} />
        <Route path="/ranking" element={<Rankings />} />
        <Route path="/ligas" element={<Leagues />} />
        <Route path="/unirse/:code" element={<JoinLeague />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MatchesProvider>
          <AppRoutes />
          <UpdatePrompt />
        </MatchesProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
