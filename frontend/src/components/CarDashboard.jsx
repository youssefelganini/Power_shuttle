import React from 'react'
import { ShieldCheck, ShieldAlert, RotateCcw } from 'lucide-react'
import MileageGraph from './MileageGraph.jsx'
import TimelineItem from './TimelineItem.jsx'
import './CarDashboard.css'

export default function CarDashboard({ car, onNewSearch }) {
  const isSafe = car.aiVerdict === 'safe'

  return (
    <div className="dashboard fade-in">
      <button className="dashboard-back" onClick={onNewSearch}>
        <RotateCcw size={15} />
        Check another car
      </button>

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
        <div className={'dashboard-verdict' + (isSafe ? ' dashboard-verdict--safe' : ' dashboard-verdict--risk')}>
          {isSafe ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
          <span>{car.verdictText}</span>
        </div>

        <div className="dashboard-price">
          <span className="dashboard-price-label">Estimated current price</span>
          <span className="dashboard-price-value">EGP {car.estimatedPriceEGP.toLocaleString()}</span>
        </div>

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
