import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useMyStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    async function fetch() {
      const { data, error } = await supabase
        .from('predictions')
        .select('api_match_id, points_earned')
        .eq('user_id', user.id)
        .order('api_match_id', { ascending: true })

      if (error || !data) { setLoading(false); return }

      const withResult = data.filter(p => p.points_earned !== null)
      const exactos   = withResult.filter(p => p.points_earned === 3).length
      const acertados = withResult.filter(p => p.points_earned === 1).length
      const fallados  = withResult.filter(p => p.points_earned === 0).length
      const total     = withResult.length
      const pending   = data.length - total
      const pct       = total > 0 ? Math.round(((exactos + acertados) / total) * 100) : 0

      // Streak: consecutive non-zero from most recent
      let streak = 0
      for (let i = withResult.length - 1; i >= 0; i--) {
        if (withResult[i].points_earned > 0) streak++
        else break
      }

      setStats({ total, exactos, acertados, fallados, pending, pct, streak })
      setLoading(false)
    }

    fetch()
  }, [user])

  return { stats, loading }
}
