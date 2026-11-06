import { useRef, useState } from 'react'

export interface Point {
  x: number // Zeitstempel
  y: number
}

/** Einfaches Liniendiagramm (eine Serie) mit Hover-/Touch-Tooltip */
export default function LineChart({
  points,
  formatY,
  formatX,
}: {
  points: Point[]
  formatY: (v: number) => string
  formatX: (v: number) => string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const W = 340
  const H = 200
  const pad = { l: 44, r: 22, t: 12, b: 26 }
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b

  const ys = points.map((p) => p.y)
  let minY = Math.min(...ys)
  let maxY = Math.max(...ys)
  if (minY === maxY) {
    minY -= 5
    maxY += 5
  }
  const span = maxY - minY
  minY = Math.max(0, minY - span * 0.1)
  maxY = maxY + span * 0.1
  const ticks = niceTicks(minY, maxY, 4)
  minY = Math.min(minY, ticks[0])
  maxY = Math.max(maxY, ticks[ticks.length - 1])

  // Gleichmäßiger Abstand pro Training: lesbarer als echte Zeitachse bei unregelmäßigen Terminen
  const sx = (i: number) => pad.l + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw)
  const sy = (v: number) => pad.t + ih - ((v - minY) / (maxY - minY)) * ih

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ')

  const onMove = (clientX: number) => {
    const svg = svgRef.current
    if (!svg || points.length === 0) return
    const rect = svg.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * W
    let best = 0
    let bestD = Infinity
    points.forEach((_, i) => {
      const d = Math.abs(sx(i) - x)
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    setHover(best)
  }

  // X-Achsen-Beschriftung: höchstens ~5 Labels
  const labelEvery = Math.max(1, Math.ceil(points.length / 5))
  const hp = hover !== null ? points[hover] : null

  return (
    <div className="chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => onMove(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid" x1={pad.l} x2={W - pad.r} y1={sy(t)} y2={sy(t)} />
            <text className="axis" x={pad.l - 6} y={sy(t)} dy="0.32em" textAnchor="end">{formatY(t)}</text>
          </g>
        ))}
        {points.map((p, i) =>
          i % labelEvery === 0 || i === points.length - 1 ? (
            <text key={i} className="axis" x={sx(i)} y={H - 8} textAnchor="middle">{formatX(p.x)}</text>
          ) : null,
        )}
        {hp && hover !== null && (
          <line className="crosshair" x1={sx(hover)} x2={sx(hover)} y1={pad.t} y2={pad.t + ih} />
        )}
        <path className="line" d={path} />
        {points.map((p, i) => (
          <circle key={i} className={'marker' + (i === hover ? ' active' : '')} cx={sx(i)} cy={sy(p.y)} r={i === hover ? 5.5 : 4} />
        ))}
        {/* großflächige Trefferzone */}
        <rect x={0} y={0} width={W} height={H} fill="transparent" />
      </svg>
      {hp && hover !== null && (
        <div
          className="tooltip"
          style={{ left: `${(sx(hover) / W) * 100}%`, top: `${(sy(hp.y) / H) * 100}%` }}
        >
          <div className="tt-value">{formatY(hp.y)}</div>
          <div className="tt-label">{formatX(hp.x)}</div>
        </div>
      )}
    </div>
  )
}

function niceTicks(min: number, max: number, count: number): number[] {
  const raw = (max - min) / count
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const norm = raw / mag
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag
  const start = Math.floor(min / step) * step
  const out: number[] = []
  for (let v = start; v <= max + step * 0.5; v += step) out.push(Math.round(v * 1000) / 1000)
  return out
}
