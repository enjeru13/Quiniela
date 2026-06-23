const webpush = require('web-push')
const { createClient } = require('@supabase/supabase-js')

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

exports.handler = async (event) => {
  // Simple secret guard
  const { secret } = event.queryStringParameters ?? {}
  if (secret !== process.env.INTERNAL_SECRET) {
    return { statusCode: 401, body: 'Unauthorized' }
  }

  // Get all subscriptions
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')

  if (error) return { statusCode: 500, body: JSON.stringify(error) }
  if (!subs?.length) return { statusCode: 200, body: 'No subscriptions found' }

  const payload = JSON.stringify({
    title: 'Quiniela test',
    body: 'Notificaciones funcionando correctamente',
    url: '/',
  })

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  )

  const sent   = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').map((r) => r.reason?.message)

  return {
    statusCode: 200,
    body: JSON.stringify({ subs: subs.length, sent, failed }),
  }
}
