import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useChampionPick() {
  const { user, profile } = useAuth()
  const [pick, setPick] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile?.champion_pick) setPick(profile.champion_pick)
  }, [profile?.champion_pick])

  const savePick = async (tla) => {
    if (!user) return
    const prev = pick
    setPick(tla)
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ champion_pick: tla })
      .eq('id', user.id)
    if (error) setPick(prev)
    setSaving(false)
  }

  return { pick, savePick, saving }
}
