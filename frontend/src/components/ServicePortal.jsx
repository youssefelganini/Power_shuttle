import React, { useState } from 'react'
import { Check } from 'lucide-react'
import ServiceForm from './ServiceForm.jsx'
import './ServiceForm.css'

export default function ServicePortal({ goto }) {
  const [submittedVin, setSubmittedVin] = useState(null)

  if (submittedVin) {
    return (
      <div className="container service-success fade-in">
        <div className="service-success-badge pop">
          <Check size={36} strokeWidth={3} />
        </div>
        <h2 className="service-success-title">Repair logged to the registry</h2>
        <p className="service-success-sub">VIN {submittedVin} has been updated.</p>
        <div className="service-success-actions">
          <button className="btn btn-primary" onClick={() => setSubmittedVin(null)}>
            Log Another Repair
          </button>
          <button className="btn btn-outline" onClick={() => goto('landing')}>
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container fade-in">
      <h2 className="dashboard-model service-portal-title">Log a repair</h2>
      <ServiceForm onSubmitted={setSubmittedVin} />
    </div>
  )
}
