'use client'

import { useRef, useEffect, useState } from 'react'
import type { EquityPoint } from '@/lib/types'

export default function EquityChart({ data }: { data: EquityPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.offsetWidth))
    ro.observe(el)
    setW(el.offsetWidth)
    return () => ro.disconnect()
  }, [])

  const H = 320
  const hasData = data.length > 0

  return (
    <div ref={containerRef} style={{ width: '100%', height: H, position: 'relative' }}>
      {hasData && w > 0 && <Chart data={data} w={w} h={H} />}
    </div>
  )
}

function Chart({ data, w, h }: { data: EquityPoint[]; w: number; h: number }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const PAD = { top: 20, right: 16, bottom: 40, left: 64 }
  const W = w - PAD.left - PAD.right
  const CH = h - PAD.top - PAD.bottom

  const allVals = data.flatMap(d => [d.strategyValue, d.buyAndHoldValue])
  const minV = Math.min(...allVals)
  const maxV = Math.max(...allVals)
  const range = maxV - minV || 1

  const xScale = (i: number) => PAD.left + (i / (data.length - 1)) * W
  const yScale = (v: number) => PAD.top + CH - ((v - minV) / range) * CH

  function makePath(vals: number[]) {
    return vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ')
  }
  function makeArea(vals: number[]) {
    const line = makePath(vals)
    const base = (PAD.top + CH).toFixed(1)
    return `${line} L${xScale(vals.length - 1).toFixed(1)},${base} L${xScale(0).toFixed(1)},${base} Z`
  }

  const stratPath = makePath(data.map(d => d.strategyValue))
  const bhPath    = makePath(data.map(d => d.buyAndHoldValue))
  const stratArea = makeArea(data.map(d => d.strategyValue))
  const bhArea    = makeArea(data.map(d => d.buyAndHoldValue))

  // Y ticks
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const v = minV + (range * i) / 4
    return { v, y: yScale(v) }
  })

  // X ticks
  const xStep = Math.max(1, Math.ceil(data.length / 6))
  const xTicks = data
    .map((d, i) => ({ i, label: d.date }))
    .filter((_, i, arr) => i % xStep === 0 || i === arr.length - 1)

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left - PAD.left
    const idx = Math.round((mx / W) * (data.length - 1))
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)))
  }

  const hov = hoverIdx !== null ? data[hoverIdx] : null

  return (
    <>
      <svg
        width={w}
        height={h}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
        style={{ display: 'block', cursor: 'crosshair' }}
      >
        <defs>
          <linearGradient id="ec-gs" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ec-gb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9A9A98" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#9A9A98" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {yTicks.map(({ y }, i) => (
          <line key={i} x1={PAD.left} y1={y.toFixed(1)} x2={PAD.left + W} y2={y.toFixed(1)}
            stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
        ))}

        {/* Areas */}
        <path d={bhArea}    fill="url(#ec-gb)" />
        <path d={stratArea} fill="url(#ec-gs)" />

        {/* Lines */}
        <path d={bhPath}    fill="none" stroke="#9CA3AF" strokeWidth="1.5"
          strokeDasharray="4 4" strokeLinecap="round" />
        <path d={stratPath} fill="none" stroke="#059669" strokeWidth="2"
          strokeLinecap="round" />

        {/* Y labels */}
        {yTicks.map(({ v, y }, i) => (
          <text key={i} x={PAD.left - 8} y={y + 4} textAnchor="end"
            fill="#9CA3AF" fontSize="10" fontFamily="monospace">
            ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)}
          </text>
        ))}

        {/* X labels */}
        {xTicks.map(({ i, label }) => (
          <text key={i} x={xScale(i).toFixed(1)} y={PAD.top + CH + 28} textAnchor="middle"
            fill="#9CA3AF" fontSize="10" fontFamily="monospace">
            {label.slice(0, 7)}
          </text>
        ))}

        {/* Hover */}
        {hov && hoverIdx !== null && (() => {
          const x = xScale(hoverIdx)
          const ys = yScale(hov.strategyValue)
          const yb = yScale(hov.buyAndHoldValue)
          const tw = 160
          const th = 64
          const tx = Math.min(x + 12, w - tw - 8)
          const ty = Math.max(PAD.top, Math.min(ys - th / 2, h - th - 8))
          return (
            <>
              <line x1={x.toFixed(1)} y1={PAD.top} x2={x.toFixed(1)} y2={PAD.top + CH}
                stroke="rgba(0,0,0,0.1)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={x.toFixed(1)} cy={ys.toFixed(1)} r="4" fill="#059669" />
              <circle cx={x.toFixed(1)} cy={yb.toFixed(1)} r="3.5" fill="#9CA3AF" />
              <rect x={tx} y={ty} width={tw} height={th} rx="6"
                fill="white" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
              <text x={tx + 10} y={ty + 16} fill="#9CA3AF" fontSize="9" fontFamily="monospace">
                {hov.date}
              </text>
              <circle cx={tx + 14} cy={ty + 30} r="3" fill="#059669" />
              <text x={tx + 24} y={ty + 34} fill="#111827" fontSize="10" fontFamily="monospace">
                ${hov.strategyValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </text>
              <circle cx={tx + 14} cy={ty + 48} r="3" fill="#9CA3AF" />
              <text x={tx + 24} y={ty + 52} fill="#6B7280" fontSize="10" fontFamily="monospace">
                ${hov.buyAndHoldValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </text>
            </>
          )
        })()}
      </svg>

      {/* Legend */}
      <div style={{
        position: 'absolute', top: 6, right: 12,
        display: 'flex', gap: 14, alignItems: 'center',
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#6B7280',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 14, height: 2, background: '#059669', display: 'inline-block', borderRadius: 1 }} />
          Strategy
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 14, height: 0, borderTop: '1.5px dashed #9CA3AF', display: 'inline-block' }} />
          Buy &amp; Hold
        </span>
      </div>
    </>
  )
}
