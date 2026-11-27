// Função serverless (Vercel). Define MP_ACCESS_TOKEN nas variáveis de ambiente.
/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') return res.status(405).end()
    const items = Array.isArray(req.body?.items) ? req.body.items : []
    if (!items.length) return res.status(400).json({ error: 'Sacola vazia' })
    const origin = `https://${req.headers.host}`
    const r = await fetch('POST https://sandbox.api.pagseguro.com/checkouts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i: any) => ({
          title: String(i.title).slice(0, 200), quantity: Number(i.quantity),
          unit_price: Number(i.unit_price), currency_id: 'BRL',
        })),
        back_urls: { success: origin, failure: origin, pending: origin },
        auto_return: 'approved',
      }),
    })
    const d = await r.json()
    if (!d.init_point) return res.status(500).json({ error: d })
    res.status(200).json({ url: d.init_point })
  }