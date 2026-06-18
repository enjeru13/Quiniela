/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { getWCMatches } from "../lib/footballApi";
import { getTeamInfo } from "../lib/teamMappings";

const STATUS = {
  SCHEDULED: "scheduled",
  TIMED: "scheduled",
  IN_PLAY: "live",
  PAUSED: "live",
  FINISHED: "finished",
  SUSPENDED: "scheduled",
  POSTPONED: "scheduled",
  CANCELLED: "scheduled",
  AWARDED: "finished",
};

const STAGE_LABEL = {
  ROUND_OF_32: "Ronda de 32",
  ROUND_OF_16: "Octavos de Final",
  QUARTER_FINALS: "Cuartos de Final",
  SEMI_FINALS: "Semifinal",
  THIRD_PLACE: "Tercer Puesto",
  FINAL: "Final",
};

function transform(m) {
  const homeInfo = getTeamInfo(m.homeTeam?.tla);
  const awayInfo = getTeamInfo(m.awayTeam?.tla);
  const stage =
    m.stage === "GROUP_STAGE" && m.group
      ? `Grupo ${m.group.replace("GROUP_", "")}`
      : (STAGE_LABEL[m.stage] ?? m.stage);

  return {
    id: m.id,
    home_team: {
      name: homeInfo.name,
      short: m.homeTeam?.tla ?? "?",
      flag_code: homeInfo.flag,
    },
    away_team: {
      name: awayInfo.name,
      short: m.awayTeam?.tla ?? "?",
      flag_code: awayInfo.flag,
    },
    home_score: m.score?.fullTime?.home ?? null,
    away_score: m.score?.fullTime?.away ?? null,
    status: STATUS[m.status] ?? "scheduled",
    api_status: m.status,
    kickoff_at: m.utcDate,
    stage,
    minute: m.minute ?? null,
  };
}

const MatchesContext = createContext(null);

export function MatchesProvider({ children }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(() => {
    setLoading((prev) => (prev ? prev : true));
    return getWCMatches()
      .then((raw) => {
        const transformed = raw.map(transform);
        setMatches(transformed);
        setError(null);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch();
    // Poll every 60s always — ensures live→finished transitions and next-day matches update without reload
    const id = setInterval(fetch, 60_000);
    return () => clearInterval(id);
  }, [fetch]);

  return (
    <MatchesContext.Provider
      value={{ matches, loading, error, refetch: fetch }}
    >
      {children}
    </MatchesContext.Provider>
  );
}

export const useMatches = () => useContext(MatchesContext);
