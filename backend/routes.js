const express = require('express')
const multer = require('multer')
const path = require('path')
const crypto = require('crypto')

const {
  getVehicle,
  upsertVehicle,
  updateVehicleAiFields,
  insertServiceRecord,
  updateServiceRecordAiFields,
  getServiceRecords,
} = require('./database')
const { analyzeDamage, AI_MODEL } = require('./aiService')

const router = express.Router()

const UPLOAD_DIR = path.join(__dirname, 'uploads')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(8).toString('hex')
    cb(null, `${Date.now()}-${unique}${path.extname(file.originalname)}`)
  },
})
const upload = multer({ storage })

const SERVICE_TYPE_LABELS = {
  routine: 'Routine maintenance',
  panel: 'Panel / body repair',
  engine: 'Engine / transmission',
  electrical: 'Electrical',
  other: 'Other',
}

function isValidVin(vin) {
  return typeof vin === 'string' && vin.trim().length === 17
}

// better-sqlite3 can only bind numbers/strings/bigints/buffers/null, but the AI
// sometimes returns arrays/objects for "list" style fields (e.g. repaired_items).
function toText(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.join(', ')
  return JSON.stringify(value)
}

const VALID_ZONES = new Set(['front', 'rear', 'front-left', 'front-right', 'rear-left', 'rear-right'])

// Defense-in-depth in case the model ignores the prompt: DamageIndicator.jsx
// only recognizes the exact keys in VALID_ZONES, and a bad year breaks the graph's axis.
function sanitizeZones(value) {
  if (!Array.isArray(value)) return []
  return value.filter((zone) => VALID_ZONES.has(zone))
}

function sanitizeYear(value) {
  const year = parseInt(toText(value), 10)
  const currentYear = new Date().getFullYear()
  if (!Number.isFinite(year) || year < 1970 || year > currentYear) return null
  return String(year)
}

function toStringArray(value) {
  if (Array.isArray(value)) return value.map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}

// "10 Sept 2026" - day-level so two repairs in the same year read as two points.
function formatDayLabel(time) {
  if (!Number.isFinite(time)) return 'Unknown date'
  return new Date(time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Fire-and-forget: runs after the 201 response has already gone out, so a slow
// or failing AI call never blocks form submission. Own try/catch since nothing
// awaits this - an unhandled rejection here would crash the process.
async function runAiAnalysis({ recordId, vin, beforePhotoPath, afterPhotoPath, invoicePhotoPath }) {
  const startedAt = Date.now()
  const supplied = [beforePhotoPath && 'before', afterPhotoPath && 'after', 'invoice'].filter(Boolean)
  console.log(`[ai] record ${recordId} (${vin}): starting analysis with ${AI_MODEL} [${supplied.join(', ')}]`)

  try {
    const aiResult = await analyzeDamage({ beforePhotoPath, afterPhotoPath, invoicePhotoPath })

    const estimatedValue =
      typeof aiResult?.estimatedValueEGP === 'number' ? aiResult.estimatedValueEGP : null

    updateVehicleAiFields(vin, {
      model: toText(aiResult?.model),
      firstRegistration: sanitizeYear(aiResult?.first_registration),
      estimatedValue,
      overview: toText(aiResult?.overview),
      opinion: toText(aiResult?.overall_opinion),
    })

    const zones = sanitizeZones(aiResult?.affected_areas)
    if (Array.isArray(aiResult?.affected_areas) && zones.length !== aiResult.affected_areas.length) {
      console.error(
        `[ai] record ${recordId}: model returned unmappable zone keys, dropped`,
        aiResult.affected_areas.filter((z) => !VALID_ZONES.has(z))
      )
    }

    updateServiceRecordAiFields(recordId, {
      repairDate: toText(aiResult?.repair_date),
      repairedItems: JSON.stringify(toStringArray(aiResult?.repaired_items)),
      affectedComponents: JSON.stringify(toStringArray(aiResult?.affected_components)),
      repairInsight: toText(aiResult?.repair_insight),
      affectedAreas: JSON.stringify(zones),
    })

    console.log(`[ai] record ${recordId}: done in ${Date.now() - startedAt}ms (zones: ${zones.length || 'none'})`)
  } catch (err) {
    // This is the path that leaves "No AI assessment for this record." on screen,
    // so log everything the SDK gives us, not just err.message.
    console.error(`[ai] record ${recordId} (${vin}) FAILED after ${Date.now() - startedAt}ms using ${AI_MODEL}`)
    console.error(`[ai]   name:    ${err?.name}`)
    console.error(`[ai]   message: ${err?.message}`)
    if (err?.status !== undefined) console.error(`[ai]   http:    ${err.status} ${err.code || ''}`)
    if (err?.error) console.error('[ai]   body:   ', err.error)
    console.error(err?.stack || err)
  }
}

router.post(
  '/service-records',
  upload.fields([
    { name: 'before_photo', maxCount: 1 },
    { name: 'after_photo', maxCount: 1 },
    { name: 'invoice', maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const { vin, odometer, serviceType, insurance, notes } = req.body

      if (!isValidVin(vin)) {
        return res.status(400).json({ error: 'VIN must be 17 characters' })
      }
      if (!odometer || !serviceType) {
        return res.status(400).json({ error: 'odometer and serviceType are required' })
      }

      const files = req.files || {}
      const beforePhoto = files.before_photo?.[0]
      const afterPhoto = files.after_photo?.[0]
      const invoicePhoto = files.invoice?.[0]

      const vinClean = vin.trim().toUpperCase()
      const odometerKm = parseInt(odometer, 10)
      const insuranceClaim = insurance === 'yes' ? 1 : 0

      // Insert with AI fields empty/null and respond immediately - the AI call
      // runs afterwards in the background and UPDATEs these rows once it's done.
      upsertVehicle({
        vin: vinClean,
        model: null,
        firstRegistration: null,
        estimatedValue: null,
        overview: null,
        opinion: null,
      })

      const record = insertServiceRecord({
        vin: vinClean,
        repairDate: null,
        odometerKm,
        serviceType,
        insuranceClaim,
        repairedItems: JSON.stringify([]),
        affectedComponents: JSON.stringify([]),
        repairInsight: null,
        notes: notes || null,
        beforePhotoPath: beforePhoto ? beforePhoto.filename : null,
        afterPhotoPath: afterPhoto ? afterPhoto.filename : null,
        invoicePhotoPath: invoicePhoto ? invoicePhoto.filename : null,
        affectedAreas: JSON.stringify([]),
        // Full ISO-8601 with milliseconds - the graph sorts and positions points
        // on this exact timestamp, so same-day records never collapse together.
        createdAt: new Date().toISOString(),
      })

      res.status(201).json(record)

      // Invoice-only is enough: routine maintenance is submitted without photos,
      // and gating on before_photo here is what used to skip those records
      // entirely, leaving repaired_items/affected_components empty forever.
      if (invoicePhoto) {
        // .catch() as well as the internal try/catch - if runAiAnalysis ever throws
        // before its own try block, this is the only thing standing between a bad
        // upload and an unhandled rejection killing the server mid-demo.
        runAiAnalysis({
          recordId: record.id,
          vin: vinClean,
          beforePhotoPath: beforePhoto ? beforePhoto.path : null,
          afterPhotoPath: afterPhoto ? afterPhoto.path : null,
          invoicePhotoPath: invoicePhoto.path,
        }).catch((err) => console.error(`[ai] record ${record.id}: unhandled analysis rejection`, err))
      } else {
        // Silently skipping here is the other way a record ends up with no AI text.
        console.error(`[ai] record ${record.id} (${vinClean}): SKIPPED - no invoice uploaded (invoice is required)`)
      }
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Failed to save service record' })
    }
  }
)

router.get('/vehicles/:vin/history', (req, res) => {
  const vin = req.params.vin.trim().toUpperCase()
  if (!isValidVin(vin)) {
    return res.status(400).json({ error: 'VIN must be 17 characters' })
  }

  const vehicle = getVehicle(vin)
  const records = getServiceRecords(vin)

  if (!vehicle || records.length === 0) {
    return res.status(404).json({ error: 'No history found for this VIN' })
  }

  // Exact timestamps, not year buckets: several repairs in the same year used to
  // collapse into one point, which is what flatlined the graph.
  const mileageHistory = [...records]
    .map((r) => ({ record: r, time: Date.parse(r.created_at) }))
    .filter(({ time, record }) => Number.isFinite(time) && Number.isFinite(record.odometer_km))
    .sort((a, b) => a.time - b.time || a.record.id - b.record.id)
    .map(({ record, time }) => ({
      date: new Date(time).toISOString(),
      label: formatDayLabel(time),
      year: new Date(time).getFullYear(),
      km: record.odometer_km,
    }))

  // Only records that actually had an invoice can ever get AI text - anything
  // else would leave the frontend polling forever. Photos are optional, so this
  // must match the invoice-only gate in POST /service-records.
  const analysable = records.filter((r) => r.invoice_photo_path)
  const aiPending =
    analysable.some((r) => !r.repair_insight) || (analysable.length > 0 && !vehicle.overview)

  const timeline = records.map((r) => {
    const repairedItems = JSON.parse(r.repaired_items || '[]')
    const affectedComponents = JSON.parse(r.affected_components || '[]')
    const canAnalyse = Boolean(r.invoice_photo_path)
    return {
      id: r.id,
      date: r.repair_date || formatDayLabel(Date.parse(r.created_at)),
      timestamp: r.created_at,
      zones: JSON.parse(r.affected_areas || '[]'),
      type: SERVICE_TYPE_LABELS[r.service_type] || r.service_type,
      components: affectedComponents.length > 0 ? affectedComponents.join(', ') : r.notes || 'Not specified',
      repairedItems: repairedItems.length > 0 ? repairedItems.join(', ') : 'Not specified',
      // null rather than a fixed string, so the frontend can tell "still running"
      // apart from "never going to run".
      aiInsight: r.repair_insight || null,
      aiPending: canAnalyse && !r.repair_insight,
    }
  })

  const latest = mileageHistory[mileageHistory.length - 1]
  const earliest = mileageHistory[0]

  res.json({
    vin: vehicle.vin,
    model: vehicle.model || 'Unknown model',
    odometer: latest ? latest.km : records[0].odometer_km,
    firstRegistration:
      vehicle.first_registration ||
      String(earliest ? earliest.year : new Date(records[records.length - 1].created_at).getFullYear()),
    aiPending,
    ai: {
      estimatedValueEGP: vehicle.estimated_value,
      overview: vehicle.overview,
      opinion: vehicle.opinion,
    },
    mileageHistory,
    timeline,
  })
})

module.exports = router
