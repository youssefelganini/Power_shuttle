import React from 'react'
import { SearchX } from 'lucide-react'
import './NotFound.css'

export default function NotFound({ vin, onRetry, message }) {
  return (
    <div className="not-found fade-in">
      <SearchX size={40} className="not-found-icon" />
      <h2 className="not-found-title">
        {message || 'This Chassis Number is not in our records.'}
      </h2>
      {vin && <p className="not-found-vin">Searched: {vin}</p>}
      <button className="btn btn-primary" onClick={onRetry}>
        Search again
      </button>
    </div>
  )
}
