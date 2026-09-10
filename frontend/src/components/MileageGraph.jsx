import React from 'react'
import './MileageGraph.css'

const WIDTH = 320
const HEIGHT = 120
const PAD = 24

export default function MileageGraph({ data }) {
  if (!data || data.length === 0) return null

  const maxKm = Math.max(...data.map((d) => d.km))
  const minYear = data[0].year
  const maxYear = data[data.length - 1].year
  const yearSpan = Math.max(maxYear - minYear, 1)

  const points = data.map((d) => {
    const x = PAD + ((d.year - minYear) / yearSpan) * (WIDTH - PAD * 2)
    const y = HEIGHT - PAD - (d.km / maxKm) * (HEIGHT - PAD * 2)
    return { x, y, ...d }
  })

  const linePath = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ' ' + p.y).join(' ')
  const areaPath = linePath + ' L ' + points[points.length - 1].x + ' ' + (HEIGHT - PAD) + ' L ' + points[0].x + ' ' + (HEIGHT - PAD) + ' Z'

  return (
    <div className="mileage-graph">
      <svg viewBox={'0 0 ' + WIDTH + ' ' + HEIGHT} className="mileage-svg" role="img" aria-label="Mileage over time">
        <path d={areaPath} className="mileage-area" />
        <path d={linePath} className="mileage-line" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" className="mileage-dot" />
        ))}
      </svg>
      <div className="mileage-labels">
        {data.map((d) => (
          <span key={d.year}>{d.year}</span>
        ))}
      </div>
    </div>
  )
}
