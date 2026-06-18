import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
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
  }, [fetch]);

  return { leaderboard, loading, error, refetch: fetch };
}
