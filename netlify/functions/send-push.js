const webpush = require('web-push')

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 }

  const secret = event.headers['x-internal-secret']
  if (secret !== process.env.INTERNAL_SECRET) return { statusCode: 401 }

  const { subscriptions, title, body, url } = JSON.parse(event.body)
  const payload = JSON.stringify({ title, body, url: url ?? '/' })

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  )

  return {
    statusCode: 200,
    body: JSON.stringify({
      sent:   results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    }),
  }
}
