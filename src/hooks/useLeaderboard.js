import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('leaderboard')
      .select('*')
      .order('rank')
      .then(({ data }) => {
        setLeaderboard(data ?? [])
        setLoading(false)
      })
  }, [])

  return { leaderboard, loading }
}
