import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useBetHistory() {
  const { user } = useAuth()
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    supabase
      .from('predictions')
      .select('api_match_id, pred_home, pred_away, points_earned')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setPredictions(data ?? [])
        setLoading(false)
      })
  }, [user])

  return { predictions, loading }
}
