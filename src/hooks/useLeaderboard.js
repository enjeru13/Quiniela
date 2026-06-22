import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("leaderboard")
      .select("*")
      .order("rank");
    setError(err ?? null);
    setLeaderboard(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();

    // Realtime — se dispara cuando cualquier profile actualiza total_points
    const channel = supabase
      .channel("leaderboard-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        () => { fetch(); },
      )
      .subscribe();

    // Fallback polling cada 30s por si Realtime no está habilitado
    const interval = setInterval(fetch, 30_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetch]);

  return { leaderboard, loading, error, refetch: fetch };
}
