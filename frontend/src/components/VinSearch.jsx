import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import './VinSearch.css'

export default function VinSearch({ onFound }) {
  const [vin, setVin] = useState('')
  const [checking, setChecking] = useState(false)

  const check = () => {
    if (!vin.trim() || checking) return
    setChecking(true)
    setTimeout(() => {
      setChecking(false)
      onFound(vin)
    }, 1100)
  }

  return (
    <div className="vin-search fade-in">
      <h2 className="vin-search-title">Enter Car's VIN Number</h2>
      <div className="vin-search-row">
        <input
          className="input vin-search-input"
          type="text"
          value={vin}
          onChange={(e) => setVin(e.target.value.toUpperCase())}
          placeholder="e.g. WBA3A5C50DF123456"
          maxLength={17}
        />
        <button className="btn btn-primary vin-search-btn" onClick={check} disabled={checking || !vin.trim()}>
          {checking && <Loader2 size={18} className="spin" />}
          {checking ? 'Checking...' : 'Check This Car'}
        </button>
      </div>
      <p className="vin-search-hint">Tip: any VIN ending in an odd digit shows the high-risk demo record.</p>
    </div>
  )
}
