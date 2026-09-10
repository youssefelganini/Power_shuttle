import React from 'react'
import './DamageIndicator.css'

const ZONE_SIDES = {
  'front-left': ['front', 'left'],
  front: ['front'],
  'front-right': ['front', 'right'],
  'rear-left': ['rear', 'left'],
  rear: ['rear'],
  'rear-right': ['rear', 'right'],
}

const ZONE_LABELS = {
  'front-left': 'Front left',
  front: 'Front',
  'front-right': 'Front right',
  'rear-left': 'Left rear',
  rear: 'Rear',
  'rear-right': 'Right rear',
}

function CarGlyph() {
  return (
    <svg viewBox="0 0 60 100" className="dd-car">
      <rect x="14" y="4" width="32" height="92" rx="12" className="dd-car-body" />
      <rect x="18" y="16" width="24" height="18" rx="4" className="dd-car-glass" />
      <rect x="18" y="66" width="24" height="16" rx="4" className="dd-car-glass" />
      <rect x="6" y="24" width="8" height="16" rx="3" className="dd-car-mirror" />
      <rect x="46" y="24" width="8" height="16" rx="3" className="dd-car-mirror" />
    </svg>
  )
}

export default function DamageIndicator({ zones = [] }) {
  const activeSides = new Set(zones.flatMap((z) => ZONE_SIDES[z] || []))
  const frameClass =
    'dd-frame' +
    (activeSides.has('front') ? ' dd-frame--front' : '') +
    (activeSides.has('rear') ? ' dd-frame--rear' : '') +
    (activeSides.has('left') ? ' dd-frame--left' : '') +
    (activeSides.has('right') ? ' dd-frame--right' : '')

  return (
    <div className="damage-indicator">
      <div className="dd-outer">
        <span className="dd-label dd-label--front">FRONT</span>
        <div className="dd-middle">
          <span className="dd-label dd-label--left">LEFT</span>
          <div className={frameClass}>
            <CarGlyph />
          </div>
          <span className="dd-label dd-label--right">RIGHT</span>
        </div>
        <span className="dd-label dd-label--rear">REAR</span>
      </div>

      <div className="dd-pills">
        {zones.length === 0 ? (
          <span className="dd-pill dd-pill--clean">No affected area</span>
        ) : (
          zones.map((z) => (
            <span className="dd-pill" key={z}>
              {ZONE_LABELS[z] || z}
            </span>
          ))
        )}
      </div>
    </div>
  )
}
