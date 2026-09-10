const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'

// Returns the car history object, or null if the VIN isn't on record.
export async function fetchVehicleHistory(vin) {
  const res = await fetch(`${API_BASE_URL}/vehicles/${encodeURIComponent(vin)}/history`)

  if (res.status === 404) return null

  if (!res.ok) {
    throw new Error(`Failed to load vehicle history (${res.status})`)
  }

  const data = await res.json()
  if (!data || (Array.isArray(data) && data.length === 0)) return null

  return data
}

export async function submitServiceRecord(fields) {
  const formData = new FormData()
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== null && value !== undefined) formData.append(key, value)
  })

  const res = await fetch(`${API_BASE_URL}/service-records`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    throw new Error(`Failed to submit service record (${res.status})`)
  }

  return res.json()
}
