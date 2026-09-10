import React from 'react'
import './MileageGraph.css'

const WIDTH = 320
const HEIGHT = 148
const PAD_L = 12
const PAD_R = 12
const PAD_T = 22
const PAD_B = 26
const DAY_MS = 86400000

const PLOT_W = WIDTH - PAD_L - PAD_R
const PLOT_H = HEIGHT - PAD_T - PAD_B

// Backend sends { date: ISO, label, year, km }. `year` alone is the old shape.
function toTime(d) {
  if (d?.date) {
    const t = Date.parse(d.date)
    if (Number.isFinite(t)) return t
  }
  if (Number.isFinite(d?.year)) return Date.parse(`${d.year}-01-01T00:00:00Z`)
  return NaN
}

function formatDate(time) {
  return new Date(time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function MileageGraph({ data }) {
  const readings = (data || [])
    .map((d) => ({ t: toTime(d), km: Number(d.km), label: d.label }))
    .filter((d) => Number.isFinite(d.t) && Number.isFinite(d.km))
    .sort((a, b) => a.t - b.t)

  if (readings.length === 0) {
    return <div className="mileage-graph mileage-graph--empty">Not enough mileage data yet</div>
  }

  // A single reading has no span to draw - duplicate it a day later so the chart
  // still renders a sensible flat line instead of collapsing to a sliver.
  const series = readings.length === 1 ? [readings[0], { ...readings[0], t: readings[0].t + DAY_MS }] : readings

  const minT = series[0].t
  const maxT = series[series.length - 1].t
  const tSpan = maxT - minT

  // Odometers sit far from zero (120k -> 122k), so a zero-based y-axis squashes
  // every real change into a flat line. Frame the actual range instead.
  const kms = series.map((p) => p.km)
  const minKm = Math.min(...kms)
  const maxKm = Math.max(...kms)
  const headroom = Math.max((maxKm - minKm) * 0.15, maxKm * 0.02, 1)
  const lo = Math.max(minKm - headroom, 0)
  const hi = maxKm + headroom

  const points = series.map((p, i) => {
    // tSpan can be 0 if several records share a timestamp - fall back to even spacing.
    const ratio = tSpan > 0 ? (p.t - minT) / tSpan : series.length > 1 ? i / (series.length - 1) : 0.5
    return {
      ...p,
      x: PAD_L + ratio * PLOT_W,
      y: PAD_T + PLOT_H - ((p.km - lo) / (hi - lo)) * PLOT_H,
    }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')
  const baseline = PAD_T + PLOT_H
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`

  // Only the real readings get a dot - not the padding twin of a lone reading.
  const dots = points.slice(0, readings.length)
  const first = dots[0]
  const last = dots[dots.length - 1]

  // Direct-label the endpoints only; a number on every point is unreadable at 320px.
  const valueLabels = last === first ? [first] : [first, last]

  // Same for the date axis: ends always, plus a midpoint once there's room.
  const axisIdx = dots.length >= 4 ? [0, Math.floor((dots.length - 1) / 2), dots.length - 1] : [0, dots.length - 1]
  const axisTicks = [...new Set(axisIdx)].map((i) => dots[i])

  const anchorFor = (p) => (p.x <= PAD_L + 1 ? 'start' : p.x >= WIDTH - PAD_R - 1 ? 'end' : 'middle')

  return (
    <div className="mileage-graph">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mileage-svg" role="img" aria-label="Odometer readings over time">
        <line x1={PAD_L} y1={baseline} x2={WIDTH - PAD_R} y2={baseline} className="mileage-baseline" />
        <path d={areaPath} className="mileage-area" />
        <path d={linePath} className="mileage-line" />

        {dots.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" className="mileage-dot" />
            {/* Oversized transparent hit target so the tooltip is easy to catch. */}
            <circle cx={p.x} cy={p.y} r="10" className="mileage-hit">
              <title>{`${p.label || formatDate(p.t)} — ${p.km.toLocaleString()} km`}</title>
            </circle>
          </g>
        ))}

        {valueLabels.map((p, i) => (
          <text key={i} x={p.x} y={p.y - 9} textAnchor={anchorFor(p)} className="mileage-value-label">
            {p.km.toLocaleString()}
          </text>
        ))}

        {axisTicks.map((p, i) => (
          <text key={i} x={p.x} y={HEIGHT - 8} textAnchor={anchorFor(p)} className="mileage-axis-label">
            {p.label || formatDate(p.t)}
          </text>
        ))}
      </svg>
    </div>
  )
}
