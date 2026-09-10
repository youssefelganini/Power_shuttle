import React, { useEffect, useRef, useState } from 'react'
import VinSearch from './VinSearch.jsx'
import CarDashboard from './CarDashboard.jsx'
import NotFound from './NotFound.jsx'
import { fetchVehicleHistory } from '../api.js'

// The AI analysis runs in the background after the record is saved, so a car
// looked up seconds later still has null AI fields. Re-fetch until the backend
// stops reporting aiPending, then give up so a failed analysis can't poll forever.
// Window must outlast a real analysis or the UI quits before the result lands.
const POLL_INTERVAL_MS = 5000
const MAX_POLLS = 48 // ~4 minutes

// status: 'idle' | 'loading' | 'found' | 'not-found' | 'error'
export default function BuyerPortal() {
  const [status, setStatus] = useState('idle')
  const [car, setCar] = useState(null)
  const [lastVin, setLastVin] = useState('')
  const pollCount = useRef(0)

  const handleSearch = async (vin) => {
    setLastVin(vin)
    setStatus('loading')
    pollCount.current = 0
    try {
      const data = await fetchVehicleHistory(vin)
      if (!data) {
        setStatus('not-found')
        return
      }
      setCar(data)
      setStatus('found')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  // Each successful poll replaces `car`, which re-runs this effect and schedules
  // the next one - the chain stops as soon as aiPending flips false.
  useEffect(() => {
    if (status !== 'found' || !car?.aiPending || pollCount.current >= MAX_POLLS) return

    const timer = setTimeout(async () => {
      pollCount.current += 1
      try {
        const fresh = await fetchVehicleHistory(lastVin)
        if (fresh) setCar(fresh)
      } catch (err) {
        console.error('AI refresh poll failed', err)
      }
    }, POLL_INTERVAL_MS)

    return () => clearTimeout(timer)
  }, [status, car, lastVin])

  const reset = () => {
    setCar(null)
    pollCount.current = 0
    setStatus('idle')
  }

  return (
    <div className="container">
      {status === 'found' && car && <CarDashboard car={car} onNewSearch={reset} />}
      {status === 'not-found' && <NotFound vin={lastVin} onRetry={reset} />}
      {status === 'error' && (
        <NotFound vin={lastVin} onRetry={reset} message="Something went wrong looking up that VIN. Please try again." />
      )}
      {(status === 'idle' || status === 'loading') && (
        <VinSearch onSearch={handleSearch} loading={status === 'loading'} />
      )}
    </div>
  )
}
