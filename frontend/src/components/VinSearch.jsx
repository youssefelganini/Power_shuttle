import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import './VinSearch.css'

export default function VinSearch({ onSearch, loading }) {
  const [vin, setVin] = useState('')

  const check = () => {
    if (!vin.trim() || loading) return
    onSearch(vin.trim())
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
        <button className="btn btn-primary vin-search-btn" onClick={check} disabled={loading || !vin.trim()}>
          {loading && <Loader2 size={18} className="spin" />}
          {loading ? 'Checking...' : 'Check This Car'}
        </button>
      </div>
    </div>
  )
}
