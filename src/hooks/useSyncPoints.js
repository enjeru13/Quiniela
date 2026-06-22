import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useMatches } from "../contexts/MatchesContext";

export function useSyncPoints() {
  const { user } = useAuth();
  const { matches } = useMatches();
  const syncedIds = useRef(new Set());
  const championSyncedRef = useRef(false);

  useEffect(() => {
    if (!user || !matches.length) return;

    const finishedMatches = matches.filter(
      (m) => m.status === "finished" && m.home_score !== null,
    );
    if (finishedMatches.length === 0) return;

    const toSync = finishedMatches.filter((m) => !syncedIds.current.has(m.id));

    const run = async () => {
      // Sync match points for all users
      for (const m of toSync) {
        syncedIds.current.add(m.id);
        const { error } = await supabase.rpc("sync_match_points", {
          p_api_match_id: m.id,
          p_home_score: m.home_score,
          p_away_score: m.away_score,
        });
        if (error) console.error("sync_match_points error:", m.id, error.message);
      }

      // Sync champion points once the Final is finished
      const finalMatch = finishedMatches.find(
        (m) => m.stage === "Final" && m.winner != null,
      );
      if (finalMatch && !championSyncedRef.current) {
        championSyncedRef.current = true;
        const winnerTla =
          finalMatch.winner === "HOME_TEAM"
            ? finalMatch.home_team.short
            : finalMatch.away_team.short;
        const { error } = await supabase.rpc("sync_champion_points", {
          p_winner_tla: winnerTla,
        });
        if (error) {
          championSyncedRef.current = false;
          console.error("sync_champion_points error:", error.message);
        }
      }
    };

    if (toSync.length > 0 || (!championSyncedRef.current && finishedMatches.some(m => m.stage === "Final" && m.winner))) {
      run();
    }
  }, [user, matches.filter((m) => m.status === "finished").length]);
}
