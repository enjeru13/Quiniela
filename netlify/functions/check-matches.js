const { createClient } = require('@supabase/supabase-js')
const webpush = require('web-push')

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getMatches() {
  const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_KEY },
  })
  if (!res.ok) throw new Error(`football-data ${res.status}`)
  const { matches } = await res.json()
  return matches
}

async function sendToUsers(userIds, title, body, url) {
  if (!userIds.length) return

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('user_id', userIds)

  if (!subs?.length) return

  const payload = JSON.stringify({ title, body, url })

  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  )
}

exports.handler = async () => {
  try {
    const matches = await getMatches()
    const now = Date.now()
    const WINDOW = 15 * 60 * 1000 // 15 min in ms

    // ── Upcoming: starts in next 5-20 min ──────────────────────────────────
    const upcoming = matches.filter((m) => {
      const kick = new Date(m.utcDate).getTime()
      return kick > now + 5 * 60 * 1000 && kick <= now + 20 * 60 * 1000
    })

    for (const m of upcoming) {
      const home = m.homeTeam?.shortName ?? m.homeTeam?.name ?? '?'
      const away = m.awayTeam?.shortName ?? m.awayTeam?.name ?? '?'

      // Find users who predicted this match
      const { data: preds } = await supabase
        .from('predictions')
        .select('user_id')
        .eq('api_match_id', m.id)

      const userIds = preds?.map((p) => p.user_id) ?? []
      await sendToUsers(
        userIds,
        'Partido en 15 min',
        `${home} vs ${away} — tu pronóstico está listo`,
        '/'
      )
    }

    // ── Finished: ended in last 15 min ─────────────────────────────────────
    const finished = matches.filter((m) => {
      if (m.status !== 'FINISHED') return false
      // football-data doesn't give exact end time — use utcDate + ~105 min
      const approxEnd = new Date(m.utcDate).getTime() + 105 * 60 * 1000
      return approxEnd > now - WINDOW && approxEnd <= now
    })

    for (const m of finished) {
      const home = m.homeTeam?.shortName ?? '?'
      const away = m.awayTeam?.shortName ?? '?'
      const score = `${m.score?.fullTime?.home ?? 0}-${m.score?.fullTime?.away ?? 0}`

      const { data: preds } = await supabase
        .from('predictions')
        .select('user_id, points_earned')
        .eq('api_match_id', m.id)
        .not('points_earned', 'is', null)

      for (const pred of preds ?? []) {
        const pts = pred.points_earned
        const msg =
          pts === 3 ? `Exacto. Ganaste 3 pts` :
          pts === 1 ? `Acertaste el ganador. +1 pt` :
                      `Sin puntos esta vez`

        await sendToUsers(
          [pred.user_id],
          `${home} ${score} ${away}`,
          msg,
          '/ranking'
        )
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (err) {
    return { statusCode: 500, body: err.message }
  }
}
