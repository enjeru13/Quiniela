/* eslint-disable react-hooks/refs */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export function usePredictions(matches = []) {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchPredictions = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("predictions")
      .select("api_match_id, pred_home, pred_away, points_earned")
      .eq("user_id", user.id);

    if (error || !data) { setLoading(false); return; }

    const mapped = {};
    data.forEach((p) => {
      mapped[p.api_match_id] = {
        pred_home: p.pred_home,
        pred_away: p.pred_away,
        points_earned: p.points_earned,
      };
    });
    setPredictions(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPredictions(); }, [fetchPredictions]);


  const savePrediction = useCallback(
    async (apiMatchId, { pred_home, pred_away }) => {
      if (!user) return { error: new Error("No autenticado") };

      setPredictions((prev) => ({
        ...prev,
        [apiMatchId]: { pred_home, pred_away, points_earned: null },
      }));

      const { data: existing } = await supabase
        .from("predictions")
        .select("id")
        .eq("user_id", user.id)
        .eq("api_match_id", apiMatchId)
        .maybeSingle();

      const { error } = existing
        ? await supabase
            .from("predictions")
            .update({ pred_home, pred_away, points_earned: null })
            .eq("user_id", user.id)
            .eq("api_match_id", apiMatchId)
        : await supabase.from("predictions").insert({
            user_id: user.id,
            api_match_id: apiMatchId,
            pred_home,
            pred_away,
          });

      if (error) {
        setPredictions((prev) => {
          const next = { ...prev };
          delete next[apiMatchId];
          return next;
        });
        return { error };
      }

      return { error: null };
    },
    [user],
  );

  return { predictions, loading, savePrediction };
}
