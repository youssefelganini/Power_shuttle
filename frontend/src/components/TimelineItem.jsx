import React from 'react'
import { Calendar, Square } from 'lucide-react'
import DamageIndicator from './DamageIndicator.jsx'
import './TimelineItem.css'

export default function TimelineItem({ record }) {
  return (
    <div className="timeline-item">
      <div className="timeline-marker" />
      <div className="timeline-content">
        <div className="timeline-date-row">
          <Calendar size={16} />
          <span>Date of maintenance: {record.date}</span>
        </div>

        <div className="timeline-body">
          <div className="timeline-diagram-col">
            <div className="timeline-affected-heading">
              <Square size={13} />
              Affected area ({record.zones.length}):
            </div>
            <p className="timeline-affected-note">
              Location reference, does not indicate the extent of the damage.
            </p>
            <DamageIndicator zones={record.zones} />
          </div>

          <div className="timeline-details-col">
            <div className="timeline-detail-row">
              <span className="timeline-detail-label">Damage Type</span>
              <span className="timeline-detail-value">{record.type}</span>
            </div>
            <div className="timeline-detail-row">
              <span className="timeline-detail-label">Affected components</span>
              <span className="timeline-detail-value">{record.components}</span>
            </div>
            <div className="timeline-detail-row">
              <span className="timeline-detail-label">Price</span>
              <span className="timeline-detail-value timeline-detail-value--price">
                EGP {record.costEGP.toLocaleString()}
              </span>
            </div>

            <div className="timeline-insight">
              <span className="timeline-insight-label">AI comments</span>
              <p>{record.aiInsight}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
