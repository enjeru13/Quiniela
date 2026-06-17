import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { calcPoints } from '../lib/utils'

export function usePredictions(matches = []) {
  const { user } = useAuth()
  const [predictions, setPredictions] = useState({})
  const [loading, setLoading] = useState(true)
  const syncedIds = useRef(new Set())
  const matchesRef = useRef(matches)
  const predictionsRef = useRef(predictions)
  matchesRef.current = matches
  predictionsRef.current = predictions

  // Fetch once per user login — stable, no matches dep
  const fetchPredictions = useCallback(async () => {
    if (!user) { setLoading(false); return }

    const { data, error } = await supabase
      .from('predictions')
      .select('api_match_id, pred_home, pred_away, points_earned')
      .eq('user_id', user.id)

    if (error) { setLoading(false); return } // schema not migrated yet → silent fail
    if (!data) { setLoading(false); return }

    const mapped = {}
    data.forEach((p) => {
      mapped[p.api_match_id] = {
        pred_home: p.pred_home,
        pred_away: p.pred_away,
        points_earned: p.points_earned,
      }
    })
    setPredictions(mapped)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchPredictions()
  }, [fetchPredictions])

  // Sync points separately — runs when finished matches available, not on every render
  useEffect(() => {
    if (!user || loading) return
    const finishedMatches = matchesRef.current.filter(
      (m) => m.status === 'finished' && m.home_score !== null
    )
    if (finishedMatches.length === 0) return

    const syncPoints = async () => {
      const preds = predictionsRef.current
      const toSync = finishedMatches.filter(
        (m) =>
          preds[m.id] &&
          preds[m.id].points_earned === null &&
          !syncedIds.current.has(m.id)
      )
      if (toSync.length === 0) return

      const updatedMapped = { ...preds }
      for (const m of toSync) {
        const pred = preds[m.id]
        const pts = calcPoints(m, pred)
        syncedIds.current.add(m.id)
        await supabase
          .from('predictions')
          .update({ points_earned: pts })
          .eq('user_id', user.id)
          .eq('api_match_id', m.id)
        updatedMapped[m.id] = { ...pred, points_earned: pts }
      }

      const allPreds = Object.values(updatedMapped)
      const total = allPreds.reduce((s, p) => s + (p.points_earned ?? 0), 0)
      const pCount = allPreds.filter((p) => p.points_earned !== null).length
      const eCount = allPreds.filter((p) => p.points_earned === 3).length
      await supabase
        .from('profiles')
        .update({ total_points: total, predictions_count: pCount, exact_count: eCount })
        .eq('id', user.id)

      setPredictions(updatedMapped)
    }

    syncPoints()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, matches.filter(m => m.status === 'finished').length])

  const savePrediction = useCallback(
    async (apiMatchId, { pred_home, pred_away }) => {
      if (!user) return { error: new Error('No autenticado') }

      setPredictions((prev) => ({
        ...prev,
        [apiMatchId]: { pred_home, pred_away, points_earned: null },
      }))

      // Check if prediction exists first, then insert or update
      const { data: existing } = await supabase
        .from('predictions')
        .select('id')
        .eq('user_id', user.id)
        .eq('api_match_id', apiMatchId)
        .maybeSingle()

      const { error } = existing
        ? await supabase
            .from('predictions')
            .update({ pred_home, pred_away, points_earned: null })
            .eq('user_id', user.id)
            .eq('api_match_id', apiMatchId)
        : await supabase
            .from('predictions')
            .insert({ user_id: user.id, api_match_id: apiMatchId, pred_home, pred_away })

      if (error) {
        setPredictions((prev) => {
          const next = { ...prev }
          delete next[apiMatchId]
          return next
        })
        return { error }
      }

      return { error: null }
    },
    [user]
  )

  return { predictions, loading, savePrediction }
}
