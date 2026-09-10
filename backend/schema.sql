CREATE TABLE IF NOT EXISTS vehicles (
  vin TEXT PRIMARY KEY,
  model TEXT,
  first_registration TEXT,
  estimated_value INTEGER,
  overview TEXT,
  opinion TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS service_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vin TEXT NOT NULL REFERENCES vehicles(vin),
  repair_date TEXT,
  odometer_km INTEGER NOT NULL,
  service_type TEXT NOT NULL,
  insurance_claim INTEGER DEFAULT 0,
  repaired_items TEXT,
  affected_components TEXT,
  repair_insight TEXT,
  notes TEXT,
  before_photo_path TEXT,
  after_photo_path TEXT,
  invoice_photo_path TEXT,
  affected_areas TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_service_records_vin ON service_records(vin);
