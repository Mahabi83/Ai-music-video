export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { token, model, input } = req.body || {}
    if (!token || !model || !input) {
      return res.status(400).json({ error: 'Missing token, model, or input' })
    }

    const start = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=60',
      },
      body: JSON.stringify({ model, input }),
    })

    const data = await start.json()
    if (!start.ok) {
      return res.status(start.status).json({ error: data.detail || data.error || 'Replicate error' })
    }

    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' })
  }
}
