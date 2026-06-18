import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function useLeagues() {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeagues = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const { data: memberships } = await supabase
      .from("league_members")
      .select("league_id")
      .eq("user_id", user.id);

    if (!memberships?.length) { setLeagues([]); setLoading(false); return; }

    const ids = memberships.map((m) => m.league_id);
    const { data } = await supabase
      .from("leagues")
      .select("id, name, code, created_by, created_at")
      .in("id", ids)
      .order("created_at");

    setLeagues(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchLeagues(); }, [fetchLeagues]);

  const createLeague = async (name) => {
    if (!user) return { error: new Error("No auth") };
    const code = generateCode();
    const { data: league, error } = await supabase
      .from("leagues")
      .insert({ name: name.trim(), code, created_by: user.id })
      .select()
      .single();
    if (error) return { error };
    await supabase.from("league_members").insert({ league_id: league.id, user_id: user.id });
    await fetchLeagues();
    return { league, error: null };
  };

  const joinLeague = async (code) => {
    if (!user) return { error: new Error("No auth") };
    const { data: league, error: findErr } = await supabase
      .from("leagues")
      .select("id, name, code")
      .eq("code", code.toUpperCase().trim())
      .maybeSingle();
    if (findErr || !league) return { error: new Error("Liga no encontrada") };

    const { error } = await supabase
      .from("league_members")
      .insert({ league_id: league.id, user_id: user.id });
    if (error && error.code !== "23505") return { error };
    await fetchLeagues();
    return { league, error: null };
  };

  const getLeagueRanking = async (leagueId) => {
    const { data: members } = await supabase
      .from("league_members")
      .select("profile:profiles(id, username, avatar_url, total_points)")
      .eq("league_id", leagueId);

    if (!members) return [];

    const profiles = members.map((r) => r.profile).filter(Boolean);
    const userIds = profiles.map((p) => p.id);

    const { data: preds } = await supabase
      .from("predictions")
      .select("user_id, points_earned")
      .in("user_id", userIds);

    return profiles
      .map((p) => {
        const up = (preds ?? []).filter((pr) => pr.user_id === p.id);
        return {
          ...p,
          predictions_count: up.length,
          exact_count: up.filter((pr) => pr.points_earned === 3).length,
        };
      })
      .sort((a, b) => (b.total_points ?? 0) - (a.total_points ?? 0))
      .map((m, i) => ({ ...m, rank: i + 1 }));
  };

  const leaveLeague = async (leagueId) => {
    if (!user) return;
    await supabase.from("league_members").delete().eq("league_id", leagueId).eq("user_id", user.id);
    await fetchLeagues();
  };

  const deleteLeague = async (leagueId) => {
    if (!user) return;
    await supabase.from("leagues").delete().eq("id", leagueId).eq("created_by", user.id);
    await fetchLeagues();
  };

  const getLeaguePredictions = async (leagueId) => {
    const { data: members } = await supabase
      .from("league_members")
      .select("profile:profiles(id, username)")
      .eq("league_id", leagueId);

    if (!members) return { members: [], predsByMatch: {} };

    const profiles = members.map((m) => m.profile).filter(Boolean);
    const userIds = profiles.map((p) => p.id);

    const { data: preds } = await supabase
      .from("predictions")
      .select("user_id, api_match_id, pred_home, pred_away, points_earned")
      .in("user_id", userIds);

    const predsByMatch = {};
    (preds ?? []).forEach((p) => {
      if (!predsByMatch[p.api_match_id]) predsByMatch[p.api_match_id] = {};
      predsByMatch[p.api_match_id][p.user_id] = p;
    });

    return { members: profiles, predsByMatch };
  };

  return { leagues, loading, createLeague, joinLeague, getLeagueRanking, getLeaguePredictions, leaveLeague, deleteLeague, refetch: fetchLeagues };
}
