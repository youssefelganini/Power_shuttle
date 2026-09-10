const OpenAI = require('openai')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

// Wall-clock ceiling is timeout x (1 + maxRetries). The old 120000 with
// maxRetries:1 is exactly why the last run died at 240s and not 120s, so
// maxRetries MUST stay 0 for this to be a real 60s cap.
const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 60000

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.SOVEREIGNEG_BASE_URL || 'https://api.sovereigneg.com/v1',
  timeout: TIMEOUT_MS,
  maxRetries: 0,
})

// Optional: without it we still work, just slower (full-size images on the wire).
let sharp = null
try {
  sharp = require('sharp')
} catch {
  console.error('[ai] sharp not installed - sending full-size photos, expect slow analysis. Fix: npm i sharp')
}

// Overridable so the model can be swapped from .env without a code change.
const MODEL = process.env.AI_MODEL || 'qwen3-vl-32b-instruct'

// affected_areas values are rendered by DamageIndicator.jsx, which only recognizes
// this exact 6-key set - anything else silently fails to highlight the diagram.
const SYSTEM_PROMPT = `You are a strict data-extraction engine for a used-car transparency registry in Egypt. You are given up to three images. Each one is introduced by its own text label telling you exactly what it is:
1. the 'before' photo - the car as it arrived, before any work
2. the 'after' photo - the same car once the work was finished
3. the repair invoice
The invoice is always present. The 'before' and 'after' photos are each optional and are often absent for routine servicing. Work only from the images you were actually given - never invent the contents of an image that was not provided.

CRITICAL: Do NOT guess or infer. Do NOT use general knowledge about cars, do NOT estimate, do NOT fill in gaps with plausible values, do NOT describe damage you cannot actually see. Every value you output must be directly readable in one of the supplied images. When in doubt, output null or [].

FIELD RULES
- "repaired_items": you MUST ALWAYS read the invoice text and output every line item written on it, whatever the job was. Copy the invoice's own wording for each line item. This applies to EVERY service type without exception - a routine oil-and-filter service is itemised in exactly the same way as a crash repair (e.g. "engine oil", "oil filter", "air filter", "labour"). There is no job too small or too routine to itemise. Damage severity is IRRELEVANT to this field: no visible damage, a minor job, or a service type of "routine maintenance" is NEVER a reason to leave this empty. Do NOT add work you think a repair like this would normally involve. Return [] ONLY if the invoice is genuinely illegible, missing, or has no readable line items.
- "affected_components": you MUST ALWAYS read the invoice text and output every component named in it, whatever the job was. This applies to EVERY service type without exception - for routine maintenance, list the parts serviced or replaced exactly as named on the invoice (e.g. "engine oil", "oil filter", "brake pads"). The invoice text is the ONLY source: do NOT infer components from the photos or from visible damage. Damage severity is IRRELEVANT to this field. Return [] ONLY if the invoice is genuinely illegible - never because the job was routine, minor, or showed no damage.
- "affected_areas": ONLY list zones that are visibly crushed, smashed, dented, broken or destroyed in the 'before' photo. A zone that is not clearly visible in the photo is NOT damaged - leave it out. Do NOT infer a zone from the invoice text. Return [] if no damage is clearly visible, and return [] if no 'before' photo was supplied at all. An empty "affected_areas" is normal for routine maintenance and is NEVER a reason to leave "repaired_items" or "affected_components" empty.
  You MUST use these exact strings, lowercase and hyphenated, and nothing else - no synonyms, no capitalization changes, no plurals, no extra words:
  "front", "rear", "front-left", "front-right", "rear-left", "rear-right"
  Any other string is rejected by the consumer and the damage will not display at all.
- "model": ONLY if the vehicle model is printed on the invoice. Otherwise null. Never guess it from the photos.
- "first_registration": ONLY the registration year if it is printed on the invoice. Otherwise null. Never use the current year, never estimate the age from the car's appearance.
- "repair_date": ONLY if a date is printed on the invoice - copy it exactly as printed. Otherwise null.
- "estimatedValueEGP": integer estimate of the vehicle's CURRENT market value in EGP, as it stands after the work on this invoice. Review the 'after' photo to assess the final repair quality and use this to calculate the estimatedValueEGP: clean panel gaps, colour-matched paint and straight bodywork support a higher figure, while visible overspray, mismatched paint, ripples, or damage still present in the 'after' photo pull it down. Weigh that finish against the damage seen in the 'before' photo and the work billed on the invoice. If no 'after' photo was supplied, judge from the invoice and the 'before' photo alone. Use null only if you genuinely cannot judge it.
- "overview": short factual summary of the damage actually visible in the 'before' photo. If no damage is visible, say exactly that. If no 'before' photo was supplied, say the submission was invoice-only and summarise the billed work instead.
- "overall_opinion": general advice about the vehicle overall (condition, resale value), taking into account the standard of finish visible in the 'after' photo where one was supplied.
- "repair_insight": comment about THIS invoice/repair only - whether the billed work and cost look reasonable for what is written, and whether the 'after' photo shows the work was actually carried out to a decent standard. Must be different text from "overall_opinion", never a restatement of it.

MISSING DATA - no exceptions
- Missing string field -> the JSON literal null. Never the text "null", never "N/A", never "unknown", never "".
- Missing list field -> [] (an empty array). Never null, never a string, never a placeholder entry.

Return ONLY strictly valid JSON. No markdown, no code fences, no commentary before or after:
{
  "model": "<string exactly as printed on invoice, or null>",
  "first_registration": "<year exactly as printed on invoice, or null>",
  "repair_date": "<date exactly as printed on invoice, or null>",
  "repaired_items": ["<line item copied verbatim from the invoice>"],
  "affected_components": ["<component copied verbatim from the invoice>"],
  "estimatedValueEGP": <number or null>,
  "overview": "<short summary of damage visible in the photo>",
  "overall_opinion": "<general advice about the vehicle overall>",
  "repair_insight": "<comment specific to this invoice/repair>",
  "affected_areas": ["front" | "rear" | "front-left" | "front-right" | "rear-left" | "rear-right"]
}`

function mimeTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  return 'image/jpeg'
}

// A 4MB phone photo becomes ~5.5MB of base64 on the wire, and three of them is
// the single biggest cause of a slow analysis. 1280px is still far more detail
// than the model needs to read an invoice or spot a crushed panel.
// .rotate() applies EXIF orientation so the car isn't sideways to the model.
async function toDataUri(filePath) {
  if (sharp) {
    try {
      const buf = await sharp(filePath)
        .rotate()
        .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 72 })
        .toBuffer()
      return `data:image/jpeg;base64,${buf.toString('base64')}`
    } catch (err) {
      console.error(`[ai] downscale failed for ${path.basename(filePath)}, sending original:`, err.message)
    }
  }

  const base64 = fs.readFileSync(filePath).toString('base64')
  return `data:${mimeTypeFor(filePath)};base64,${base64}`
}

// One missing/unreadable photo must not sink the whole analysis - the invoice
// alone is still a valid submission, so a failed read is downgraded to "absent".
async function toDataUriOrNull(filePath, label) {
  if (!filePath) return null
  try {
    return await toDataUri(filePath)
  } catch (err) {
    console.error(`[ai] could not read ${label} photo (${path.basename(filePath)}): ${err.message} - continuing without it`)
    return null
  }
}

// Models ignore "no markdown" often enough that a bare JSON.parse is the single
// most common reason a background analysis dies and the record stays empty.
function parseJsonLoose(raw) {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error('model returned empty message content')
  }

  const text = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  try {
    return JSON.parse(text)
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start !== -1 && end > start) return JSON.parse(text.slice(start, end + 1))
    throw new Error(`model did not return JSON. First 200 chars: ${text.slice(0, 200)}`)
  }
}

// The SDK aborts the socket itself at TIMEOUT_MS and throws
// APIConnectionTimeoutError. Label it here - a bare "Request timed out" in the
// log reads like a network blip rather than the provider being too slow.
function isTimeout(err) {
  return err?.name === 'APIConnectionTimeoutError' || /timed?\s?out/i.test(err?.message || '')
}

async function createCompletion(messages, jsonMode) {
  const startedAt = Date.now()
  try {
    return await client.chat.completions.create({
      model: MODEL,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      messages,
    })
  } catch (err) {
    if (isTimeout(err)) {
      console.error(
        `[ai] ABORTED after ${Date.now() - startedAt}ms: ${MODEL} exceeded the ${TIMEOUT_MS}ms cap - request killed, no retry`
      )
    }
    throw err
  }
}

// Only the invoice is required. before/after photos are each optional, so a
// routine oil change (invoice only) is still analysed and still gets its
// repaired_items / affected_components extracted from the invoice text.
async function analyzeDamage({ beforePhotoPath, afterPhotoPath, invoicePhotoPath }) {
  if (!invoicePhotoPath) throw new Error('invoice photo is required for analysis')

  const [beforeUri, afterUri, invoiceUri] = await Promise.all([
    toDataUriOrNull(beforePhotoPath, 'before'),
    toDataUriOrNull(afterPhotoPath, 'after'),
    toDataUri(invoicePhotoPath),
  ])

  // Each image gets its own label immediately before it, so the model can never
  // mistake the 'after' photo for the 'before' one when only some are present.
  const content = []
  if (beforeUri) {
    content.push({ type: 'text', text: "IMAGE 1 - the 'before' photo: the car as it arrived, before any work." })
    content.push({ type: 'image_url', image_url: { url: beforeUri } })
  }
  if (afterUri) {
    content.push({
      type: 'text',
      text: "IMAGE 2 - the 'after' photo: the same car once the work was finished. Judge the final repair quality from this image and use it to calculate estimatedValueEGP.",
    })
    content.push({ type: 'image_url', image_url: { url: afterUri } })
  }
  content.push({
    type: 'text',
    text: 'IMAGE 3 - the repair invoice. Read its text and list EVERY billed line item in "repaired_items" and every component it names in "affected_components", even if this was only routine maintenance.',
  })
  content.push({ type: 'image_url', image_url: { url: invoiceUri } })

  if (!beforeUri && !afterUri) {
    content.push({
      type: 'text',
      text: "No 'before' or 'after' photo was supplied with this submission. Return [] for \"affected_areas\", but still extract the full invoice contents.",
    })
  }

  const supplied = [beforeUri && 'before', afterUri && 'after', 'invoice'].filter(Boolean)
  const totalBytes = (beforeUri?.length || 0) + (afterUri?.length || 0) + invoiceUri.length
  const payloadMb = (totalBytes / 1024 / 1024).toFixed(1)
  console.log(
    `[ai] image payload: ${payloadMb}MB across ${supplied.length} image(s) [${supplied.join(', ')}]${
      sharp ? '' : ' (un-resized - install sharp)'
    }`
  )

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content },
  ]

  let response
  try {
    response = await createCompletion(messages, true)
  } catch (err) {
    // Not every model on the gateway accepts response_format - retry once plain
    // rather than losing the whole analysis over one unsupported parameter.
    // A model the gateway doesn't serve also comes back as a 400. Retrying that
    // without response_format just fails again - only retry real param errors.
    const badModel = /model.*(not found|does not exist|unknown|unsupported|invalid)/i.test(err?.message || '')
    const rejectedParam =
      !badModel && (err?.status === 400 || /response_format|json_object/i.test(err?.message || ''))
    if (!rejectedParam) throw err
    console.error(`[ai] ${MODEL} rejected json mode (${err.status}: ${err.message}) - retrying without response_format`)
    response = await createCompletion(messages, false)
  }

  const finishReason = response?.choices?.[0]?.finish_reason
  if (finishReason && finishReason !== 'stop') {
    console.error(`[ai] ${MODEL} finished with reason "${finishReason}" - output may be truncated`)
  }

  return parseJsonLoose(response?.choices?.[0]?.message?.content)
}

module.exports = { analyzeDamage, AI_MODEL: MODEL }
