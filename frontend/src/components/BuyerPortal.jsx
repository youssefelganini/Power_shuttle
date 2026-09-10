import React, { useState } from 'react'
import VinSearch from './VinSearch.jsx'
import CarDashboard from './CarDashboard.jsx'
import NotFound from './NotFound.jsx'
import { fetchVehicleHistory } from '../api.js'

// status: 'idle' | 'loading' | 'found' | 'not-found' | 'error'
export default function BuyerPortal() {
  const [status, setStatus] = useState('idle')
  const [car, setCar] = useState(null)
  const [lastVin, setLastVin] = useState('')

  const handleSearch = async (vin) => {
    setLastVin(vin)
    setStatus('loading')
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

  const reset = () => {
    setCar(null)
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
