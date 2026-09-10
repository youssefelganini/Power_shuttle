const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')

const db = new Database(path.join(__dirname, 'power_shuttle.db'))
db.pragma('journal_mode = WAL')

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
db.exec(schema)

// Migrate existing databases created before repair_date/repaired_items existed.
function ensureColumn(table, column, type) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name)
  if (!columns.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`)
  }
}
ensureColumn('service_records', 'repair_date', 'TEXT')
ensureColumn('service_records', 'repaired_items', 'TEXT')
ensureColumn('service_records', 'affected_components', 'TEXT')
ensureColumn('service_records', 'repair_insight', 'TEXT')

function getVehicle(vin) {
  return db.prepare('SELECT * FROM vehicles WHERE vin = ?').get(vin)
}

// Only overwrites a column when a non-null value is supplied, so a routine
// service (no AI call) never wipes out the cached valuation from a prior submission.
function upsertVehicle({ vin, model, firstRegistration, estimatedValue, overview, opinion }) {
  db.prepare(
    `INSERT INTO vehicles (vin, model, first_registration, estimated_value, overview, opinion, updated_at)
     VALUES (@vin, @model, @firstRegistration, @estimatedValue, @overview, @opinion, @updatedAt)
     ON CONFLICT(vin) DO UPDATE SET
       model = COALESCE(excluded.model, vehicles.model),
       first_registration = COALESCE(excluded.first_registration, vehicles.first_registration),
       estimated_value = COALESCE(excluded.estimated_value, vehicles.estimated_value),
       overview = COALESCE(excluded.overview, vehicles.overview),
       opinion = COALESCE(excluded.opinion, vehicles.opinion),
       updated_at = excluded.updated_at`
  ).run({
    vin,
    model: model ?? null,
    firstRegistration: firstRegistration ?? null,
    estimatedValue: estimatedValue ?? null,
    overview: overview ?? null,
    opinion: opinion ?? null,
    updatedAt: new Date().toISOString(),
  })
}

// Called once the background AI analysis finishes, to fill in fields that were
// inserted as null/default when the record was first created.
function updateVehicleAiFields(vin, { model, firstRegistration, estimatedValue, overview, opinion }) {
  db.prepare(
    `UPDATE vehicles SET
       model = COALESCE(@model, model),
       first_registration = COALESCE(@firstRegistration, first_registration),
       estimated_value = COALESCE(@estimatedValue, estimated_value),
       overview = COALESCE(@overview, overview),
       opinion = COALESCE(@opinion, opinion),
       updated_at = @updatedAt
     WHERE vin = @vin`
  ).run({
    vin,
    model: model ?? null,
    firstRegistration: firstRegistration ?? null,
    estimatedValue: estimatedValue ?? null,
    overview: overview ?? null,
    opinion: opinion ?? null,
    updatedAt: new Date().toISOString(),
  })
}

function updateServiceRecordAiFields(id, { repairDate, repairedItems, affectedComponents, repairInsight, affectedAreas }) {
  db.prepare(
    `UPDATE service_records SET
       repair_date = @repairDate,
       repaired_items = @repairedItems,
       affected_components = @affectedComponents,
       repair_insight = @repairInsight,
       affected_areas = @affectedAreas
     WHERE id = @id`
  ).run({ id, repairDate, repairedItems, affectedComponents, repairInsight, affectedAreas })
}

function insertServiceRecord(record) {
  const info = db
    .prepare(
      `INSERT INTO service_records
        (vin, repair_date, odometer_km, service_type, insurance_claim, repaired_items, affected_components,
         repair_insight, notes, before_photo_path, after_photo_path, invoice_photo_path, affected_areas, created_at)
       VALUES
        (@vin, @repairDate, @odometerKm, @serviceType, @insuranceClaim, @repairedItems, @affectedComponents,
         @repairInsight, @notes, @beforePhotoPath, @afterPhotoPath, @invoicePhotoPath, @affectedAreas, @createdAt)`
    )
    .run(record)
  return db.prepare('SELECT * FROM service_records WHERE id = ?').get(info.lastInsertRowid)
}

// created_at is a full ISO-8601 string, so lexicographic DESC is chronological.
// id breaks ties for records written inside the same millisecond.
function getServiceRecords(vin) {
  return db.prepare('SELECT * FROM service_records WHERE vin = ? ORDER BY created_at DESC, id DESC').all(vin)
}

module.exports = {
  db,
  getVehicle,
  upsertVehicle,
  updateVehicleAiFields,
  insertServiceRecord,
  updateServiceRecordAiFields,
  getServiceRecords,
}
