const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  let email, password
  try {
    ({ email, password } = JSON.parse(event.body))
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Datos inválidos' }) }
  }

  if (!email || !password || password.length < 6) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Datos inválidos' }) }
  }

  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) {
    return { statusCode: 500, body: JSON.stringify({ error: listErr.message }) }
  }

  const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) {
    return { statusCode: 404, body: JSON.stringify({ error: 'No existe una cuenta con ese email' }) }
  }

  const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, { password })
  if (updateErr) {
    return { statusCode: 500, body: JSON.stringify({ error: updateErr.message }) }
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) }
}
