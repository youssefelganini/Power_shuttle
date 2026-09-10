import React, { useState } from 'react'
import VinSearch from './VinSearch.jsx'
import CarDashboard from './CarDashboard.jsx'
import { getMockCarByVin } from '../data/mockData.js'

export default function BuyerPortal() {
  const [car, setCar] = useState(null)

  const handleFound = (vin) => {
    setCar(getMockCarByVin(vin))
  }

  return (
    <div className="container">
      {car ? (
        <CarDashboard car={car} onNewSearch={() => setCar(null)} />
      ) : (
        <VinSearch onFound={handleFound} />
      )}
    </div>
  )
}
