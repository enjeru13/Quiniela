exports.handler = async (event) => {
  // event.path = /api/fd/v4/competitions/WC/matches (original path before rewrite)
  const apiPath = event.path.replace(/^\/api\/fd/, '') || '/'
  const qs = event.rawQuery ? `?${event.rawQuery}` : ''
  const url = `https://api.football-data.org${apiPath}${qs}`

  try {
    const res = await fetch(url, {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_KEY },
    })
    const body = await res.text()
    return {
      statusCode: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body,
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
