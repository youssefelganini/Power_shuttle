// Throwaway diagnostic for the "times out every time" bug. Run: node diagnose-ai.js
// Never prints the API key - only whether one is loaded.
const dns = require('dns')
const net = require('net')
const fs = require('fs')
const path = require('path')
const OpenAI = require('openai')
require('dotenv').config()

const BASE = process.env.SOVEREIGNEG_BASE_URL || 'https://api.sovereigneg.com/v1'
const MODEL = process.env.AI_MODEL || 'Qwen3.8-27B'
const url = new URL(BASE)

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: BASE,
  timeout: 20000, // short on purpose - we want fast failures, not a repeat of the 240s hang
  maxRetries: 0,
})

// 1x1 PNG. Tests whether the model accepts image parts at all, with ~100 bytes
// on the wire - so a failure here is about vision support, never payload size.
const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const ms = (t) => `${Date.now() - t}ms`

async function step(label, fn) {
  const t = Date.now()
  try {
    const out = await fn()
    console.log(`  PASS  ${label} (${ms(t)}) ${out || ''}`)
    return true
  } catch (err) {
    const detail = [err?.name, err?.status, err?.code, err?.message].filter(Boolean).join(' | ')
    console.log(`  FAIL  ${label} (${ms(t)}) ${detail}`)
    return false
  }
}

;(async () => {
  console.log('\n=== Power Shuttle AI diagnostic ===')
  console.log(`host:   ${url.host}`)
  console.log(`model:  ${MODEL}`)
  console.log(`apiKey: ${process.env.OPENAI_API_KEY ? 'loaded' : 'MISSING - nothing will work'}\n`)

  console.log('[1] Network')
  const dnsOk = await step('DNS resolves', () =>
    new Promise((res, rej) => dns.lookup(url.hostname, (e, a) => (e ? rej(e) : res(`-> ${a}`))))
  )

  let tcpOk = false
  if (dnsOk) {
    tcpOk = await step('TCP connect', () =>
      new Promise((res, rej) => {
        const port = url.port || (url.protocol === 'https:' ? 443 : 80)
        const s = net.createConnection({ host: url.hostname, port })
        s.setTimeout(10000)
        s.on('connect', () => { s.destroy(); res(`port ${port} open`) })
        s.on('timeout', () => { s.destroy(); rej(new Error('TCP timeout - host is dropping packets (firewall?)')) })
        s.on('error', rej)
      })
    )
  }

  if (!dnsOk || !tcpOk) {
    console.log('\nVERDICT: the endpoint itself is unreachable. No model name will fix this.')
    console.log('The base URL / provider is wrong or offline. Point SOVEREIGNEG_BASE_URL at a')
    console.log('real OpenAI-compatible gateway before touching anything else.\n')
    return
  }

  console.log('\n[2] API')
  let models = []
  await step('models.list()', async () => {
    const r = await client.models.list()
    models = (r?.data || []).map((m) => m.id)
    return `\n        available: ${models.join(', ') || '(empty list)'}`
  })

  if (models.length && !models.includes(MODEL)) {
    console.log(`\n  >>> "${MODEL}" is NOT in the list above. That alone breaks every call.`)
    const vision = models.filter((m) => /vl|vision|multimodal/i.test(m))
    if (vision.length) console.log(`  >>> vision-capable candidates: ${vision.join(', ')}`)
  }

  console.log('\n[3] Model capability')
  const textOk = await step('text-only call', async () => {
    const r = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
      max_tokens: 5,
    })
    return `-> ${JSON.stringify(r?.choices?.[0]?.message?.content)}`
  })

  const imgOk = await step('1x1 image call (vision support)', async () => {
    const r = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Reply with the single word: ok' },
            { type: 'image_url', image_url: { url: TINY_PNG } },
          ],
        },
      ],
      max_tokens: 5,
    })
    return `-> ${JSON.stringify(r?.choices?.[0]?.message?.content)}`
  })

  console.log('\n[4] Real payload size')
  try {
    const dir = path.join(__dirname, 'uploads')
    const files = fs.readdirSync(dir)
      .map((f) => ({ f, s: fs.statSync(path.join(dir, f)) }))
      .sort((a, b) => b.s.mtimeMs - a.s.mtimeMs)
      .slice(0, 2)
    const raw = files.reduce((n, x) => n + x.s.size, 0)
    console.log(`  2 newest uploads: ${(raw / 1024 / 1024).toFixed(1)}MB raw -> ~${(raw * 1.37 / 1024 / 1024).toFixed(1)}MB as base64`)
    console.log('  (sharp downscales these to ~200-400KB total before sending)')
  } catch {
    console.log('  (no uploads yet)')
  }

  console.log('\n=== VERDICT ===')
  if (textOk && imgOk) {
    console.log(`${MODEL} works for both text and images. The timeout is payload/latency,`)
    console.log('not capability - check [4] above and confirm sharp is actually downscaling.')
  } else if (textOk && !imgOk) {
    console.log(`${MODEL} answers text but FAILS on a 1x1 pixel. It is not vision-capable.`)
    console.log('This is your bug. Switch to a -VL / vision model from the [2] list.')
  } else if (!textOk) {
    console.log(`${MODEL} fails even on a trivial text call - the model ID is wrong or`)
    console.log('not served by this gateway. Pick one from the [2] list.')
  }
  console.log()
})()
