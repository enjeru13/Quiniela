import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";

export function formatTime(isoString) {
  return format(parseISO(isoString), "HH:mm");
}

export function formatDate(isoString) {
  const date = parseISO(isoString);
  if (isToday(date)) return "Hoy";
  if (isTomorrow(date)) return "Mañana";
  return format(date, "EEE d 'de' MMM", { locale: es });
}

export function isBefore(isoString) {
  return new Date() < parseISO(isoString);
}

export function calcPoints(match, prediction) {
  if (match.status !== "finished") return null;
  if (!prediction) return 0;
  const { home_score, away_score } = match;
  const { pred_home, pred_away } = prediction;

  if (pred_home === home_score && pred_away === away_score) return 3;

  const actualWinner =
    home_score > away_score
      ? "home"
      : away_score > home_score
        ? "away"
        : "draw";
  const predWinner =
    pred_home > pred_away ? "home" : pred_away > pred_home ? "away" : "draw";

  if (predWinner === actualWinner) return 1;
  return 0;
}

export function groupMatchesByTime(matches) {
  return matches.reduce((acc, match) => {
    const time = formatTime(match.kickoff_at);
    if (!acc[time]) acc[time] = [];
    acc[time].push(match);
    return acc;
  }, {});
}

export function computeGroupStandings(matches) {
  const groupMap = {};

  for (const m of matches) {
    if (!m.stage.startsWith("Grupo")) continue;
    if (!groupMap[m.stage]) groupMap[m.stage] = {};
    const g = groupMap[m.stage];

    const ensureTeam = (team) => {
      if (!g[team.short])
        g[team.short] = { team, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 };
    };
    ensureTeam(m.home_team);
    ensureTeam(m.away_team);

    if (
      m.status === "finished" &&
      m.home_score !== null &&
      m.away_score !== null
    ) {
      const h = m.home_score,
        a = m.away_score;
      g[m.home_team.short].pj++;
      g[m.away_team.short].pj++;
      g[m.home_team.short].gf += h;
      g[m.home_team.short].gc += a;
      g[m.away_team.short].gf += a;
      g[m.away_team.short].gc += h;
      if (h > a) {
        g[m.home_team.short].g++;
        g[m.home_team.short].pts += 3;
        g[m.away_team.short].p++;
      } else if (a > h) {
        g[m.away_team.short].g++;
        g[m.away_team.short].pts += 3;
        g[m.home_team.short].p++;
      } else {
        g[m.home_team.short].e++;
        g[m.home_team.short].pts++;
        g[m.away_team.short].e++;
        g[m.away_team.short].pts++;
      }
    }
  }

  return Object.entries(groupMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, teams]) => ({
      name,
      teams: Object.values(teams).sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        const gdB = b.gf - b.gc,
          gdA = a.gf - a.gc;
        if (gdB !== gdA) return gdB - gdA;
        return b.gf - a.gf;
      }),
    }));
}
