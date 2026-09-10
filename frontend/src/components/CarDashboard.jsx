import React from 'react'
import { RotateCcw } from 'lucide-react'
import AIHero from './AIHero.jsx'
import MileageGraph from './MileageGraph.jsx'
import TimelineItem from './TimelineItem.jsx'
import './CarDashboard.css'

export default function CarDashboard({ car, onNewSearch }) {
  return (
    <div className="dashboard fade-in">
      <button className="dashboard-back" onClick={onNewSearch}>
        <RotateCcw size={15} />
        Check another car
      </button>

      <AIHero ai={car.ai} />

      <div className="dashboard-header">
        <h2 className="dashboard-model">{car.model}</h2>
        <div className="dashboard-meta">
          <div>
            <span className="dashboard-meta-label">VIN</span>
            <span className="dashboard-meta-value">{car.vin}</span>
          </div>
          <div>
            <span className="dashboard-meta-label">Last odometer reading</span>
            <span className="dashboard-meta-value">{car.odometer.toLocaleString()} km</span>
          </div>
          <div>
            <span className="dashboard-meta-label">First registration</span>
            <span className="dashboard-meta-value">{car.firstRegistration}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-overview">
        <div className="dashboard-graph">
          <span className="dashboard-graph-label">Odometer over time</span>
          <MileageGraph data={car.mileageHistory} />
        </div>
      </div>

      <div className="dashboard-timeline">
        <h3 className="dashboard-timeline-title">Maintenance &amp; accident timeline</h3>
        {car.timeline.map((record) => (
          <TimelineItem key={record.id} record={record} />
        ))}
      </div>
    </div>
  )
}
