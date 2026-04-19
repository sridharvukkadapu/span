'use client'

import { useState, useCallback } from 'react'
import type { BasicAnalyzerData } from '@/lib/types'

/* ── Types ─────────────────────────────────────────────── */
interface Scenario {
  growthRatePct:      number
  netProfitPct:       number
  peMultiple:         number
  dilutionPctPerYear: number
  years:              number
  requiredReturnPct:  number
}

interface Result {
  price:      number
  gain:       number
  fairValue:  number
  margin:     number   // (fairValue - currentPrice) / currentPrice * 100
}

/* ── Calc ──────────────────────────────────────────────── */
function calcScenario(rev: number, shares: number, currentPrice: number, s: Scenario): Result {
  const revB         = rev / 1e9
  const sharesB      = shares / 1e9
  const futureRev    = revB * Math.pow(1 + s.growthRatePct / 100, s.years)
  const futureEarn   = futureRev * (s.netProfitPct / 100)
  const futureMcap   = futureEarn * s.peMultiple
  const futureShares = sharesB * Math.pow(1 + s.dilutionPctPerYear / 100, s.years)
  const price        = futureShares > 0 ? futureMcap / futureShares : 0
  const gain         = currentPrice > 0 ? ((price - currentPrice) / currentPrice) * 100 : 0
  // Discount future price back to today using required return
  const fairValue    = s.years > 0 ? price / Math.pow(1 + s.requiredReturnPct / 100, s.years) : price
  const margin       = currentPrice > 0 ? ((fairValue - currentPrice) / currentPrice) * 100 : 0
  return { price, gain, fairValue, margin }
}

function fmtPrice(v: number) {
  return v < 0 ? `-$${Math.abs(v).toFixed(2)}` : `$${v.toFixed(2)}`
}

/* ── Signal helpers ─────────────────────────────────────── */
function verdictColor(gain: number)  { return gain > 15 ? '#047857' : gain < -15 ? '#B91C1C' : '#B45309' }
function verdictBg(gain: number)     { return gain > 15 ? 'rgba(5,150,105,0.09)' : gain < -15 ? 'rgba(220,38,38,0.09)' : 'rgba(217,119,6,0.09)' }
function verdictBorder(gain: number) { return gain > 15 ? 'rgba(5,150,105,0.22)' : gain < -15 ? 'rgba(220,38,38,0.22)' : 'rgba(217,119,6,0.22)' }
function verdictLabel(gain: number)  { return gain > 15 ? 'BUY' : gain < -15 ? 'SELL' : 'HOLD' }
function verdictBarColor(gain: number) { return gain > 15 ? '#059669' : gain < -15 ? '#DC2626' : '#D97706' }

/* ── Slider ─────────────────────────────────────────────── */
function ScenarioSlider({
  label, value, min, max, step, unit, accentColor, onChange,
}: {
  label: string; value: number; min: number; max: number;
  step: number; unit: string; accentColor: string; onChange: (v: number) => void
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color: '#6A6A68', fontFamily: 'var(--font-body)' }}>{label}</span>
        <span className="num text-xs font-bold tabular-nums" style={{ color: accentColor, minWidth: '44px', textAlign: 'right' }}>
          {value.toFixed(unit === 'yr' ? 0 : 1)}{unit}
        </span>
      </div>
      <div className="relative h-5 flex items-center">
        <div className="absolute left-0 right-0 h-1.5 rounded-full" style={{ background: 'rgba(13,13,11,0.08)' }} />
        <div className="absolute left-0 h-1.5 rounded-full transition-all duration-100" style={{ width: `${pct}%`, background: accentColor }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="absolute left-0 right-0 w-full opacity-0 cursor-pointer"
          style={{ height: '20px' }}
          aria-label={`${label}: ${value}${unit}`}
        />
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white transition-all duration-100 pointer-events-none"
          style={{
            left: `calc(${pct}% - 8px)`,
            background: accentColor,
            boxShadow: `0 1px 4px ${accentColor}40, 0 0 0 3px ${accentColor}18`,
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

/* ── Slider configs ─────────────────────────────────────── */
const SLIDER_CFG: { key: keyof Scenario; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: 'growthRatePct',      label: 'Revenue Growth',   min: 0,  max: 100, step: 0.5, unit: '%'  },
  { key: 'netProfitPct',       label: 'Net Profit Margin',min: 0,  max: 60,  step: 0.5, unit: '%'  },
  { key: 'peMultiple',         label: 'P/E Multiple',     min: 5,  max: 200, step: 0.5, unit: 'x'  },
  { key: 'dilutionPctPerYear', label: 'Dilution / Year',  min: 0,  max: 10,  step: 0.1, unit: '%'  },
  { key: 'years',              label: 'Years',            min: 1,  max: 10,  step: 1,   unit: 'yr' },
  { key: 'requiredReturnPct',  label: 'Required Return',  min: 0,  max: 30,  step: 0.5, unit: '%'  },
]

/* ── CAGR display ───────────────────────────────────────── */
function Cagr({ gain, years }: { gain: number; years: number }) {
  const cagr = years > 0 ? (Math.pow(1 + gain / 100, 1 / years) - 1) * 100 : 0
  const color = verdictColor(gain)
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px]" style={{ color: '#9A9A98' }}>CAGR</span>
      <span className="num text-xs font-bold" style={{ color }}>
        {cagr >= 0 ? '+' : ''}{cagr.toFixed(1)}%/yr
      </span>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────── */
export default function BasicAnalyzerClient({ data }: { data: BasicAnalyzerData }) {
  const [r, setR] = useState<Scenario>({ ...data.reasonable,     requiredReturnPct: data.reasonable.requiredReturnPct     ?? 15 })
  const [g, setG] = useState<Scenario>({ ...data.greatExecution, requiredReturnPct: data.greatExecution.requiredReturnPct ?? 15 })

  const currentPrice = data.currentPrice ?? 0
  const rev          = data.ttmRevenue ?? 0
  const shares       = data.sharesOutstanding ?? 1

  const resultR = calcScenario(rev, shares, currentPrice, r)
  const resultG = calcScenario(rev, shares, currentPrice, g)

  const SCENARIOS = [
    { key: 'reasonable'     as const, label: 'Reasonable',     color: '#4A4A48', topColor: '#0D0D0B', values: r, setter: setR },
    { key: 'greatExecution' as const, label: 'Great Execution', color: '#059669', topColor: '#059669', values: g, setter: setG },
  ]
  const resultMap = { reasonable: resultR, greatExecution: resultG }

  return (
    <>
      {/* Result Cards */}
      <div className="grid grid-cols-2 gap-4">
        {SCENARIOS.map(({ key, label, topColor }) => {
          const result = resultMap[key]
          const barPct = Math.max(0, Math.min(100, (result.gain + 100) / 3))
          return (
            <div
              key={key}
              className="rounded-xl overflow-hidden text-center"
              style={{ background: '#FFFFFF', border: '1px solid rgba(13,13,11,0.09)', boxShadow: '0 1px 4px rgba(13,13,11,0.04)' }}
            >
              <div className="h-[2px]" style={{ background: topColor }} />
              <div className="px-6 py-6">
                <div className="label-xs mb-3" style={{ color: '#9A9A98' }}>{label}</div>
                <div className="num text-3xl font-black tabular-nums mb-1" style={{ color: '#0D0D0B' }}>
                  {fmtPrice(result.price)}
                </div>
                <div className="num text-lg font-bold mt-1 tabular-nums" style={{ color: result.gain >= 0 ? '#047857' : '#B91C1C' }}>
                  {result.gain >= 0 ? '+' : ''}{result.gain.toFixed(1)}%
                </div>

                {/* Progress bar */}
                <div className="h-1.5 rounded-full overflow-hidden mt-3 mx-auto max-w-[120px]" style={{ background: 'rgba(13,13,11,0.07)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${barPct}%`, background: verdictBarColor(result.gain) }}
                  />
                </div>

                <div className="flex items-center justify-center gap-2 mt-3">
                  <span
                    className="tag"
                    style={{
                      background:  verdictBg(result.gain),
                      color:       verdictColor(result.gain),
                      borderColor: verdictBorder(result.gain),
                      padding: '4px 12px', fontSize: '10px',
                    }}
                  >
                    {verdictLabel(result.gain)}
                  </span>
                  <Cagr gain={result.gain} years={resultMap[key] === resultR ? r.years : g.years} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Slider assumptions */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#FFFFFF', border: '1px solid rgba(13,13,11,0.09)', boxShadow: '0 1px 4px rgba(13,13,11,0.04)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid rgba(13,13,11,0.07)' }}
        >
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#0D0D0B', fontFamily: 'var(--font-display)' }}>
            Scenario Inputs
          </span>
          <span className="label-xs" style={{ color: '#B0B0AE' }}>drag to recalculate</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: 'rgba(13,13,11,0.06)' }}>
          {SCENARIOS.map(({ key, label, color, values, setter }) => (
            <div key={key} className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color, fontFamily: 'var(--font-display)' }}>
                  {label}
                </span>
              </div>
              {SLIDER_CFG.map(({ key: field, label: sliderLabel, min, max, step, unit }) => (
                <ScenarioSlider
                  key={field}
                  label={sliderLabel}
                  value={values[field] as number}
                  min={min} max={max} step={step} unit={unit}
                  accentColor={color}
                  onChange={v => setter(prev => ({ ...prev, [field]: v }))}
                />
              ))}

              {/* Fair Value Today */}
              {(() => {
                const result = resultMap[key]
                const isUp = result.margin >= 0
                const signalColor  = isUp ? '#047857' : '#B91C1C'
                const signalBg     = isUp ? 'rgba(5,150,105,0.07)' : 'rgba(220,38,38,0.07)'
                const signalBorder = isUp ? 'rgba(5,150,105,0.22)' : 'rgba(220,38,38,0.22)'
                return (
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(13,13,11,0.09)' }}>
                    <div
                      className="rounded-xl"
                      style={{ background: signalBg, border: `1.5px solid ${signalBorder}`, padding: '16px 18px 14px' }}
                    >
                      {/* Label row */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="uppercase tracking-widest font-bold"
                          style={{ fontSize: '10px', color: signalColor, fontFamily: 'var(--font-display)', letterSpacing: '0.12em' }}
                        >
                          Fair Value Today
                        </span>
                        <span
                          className="num font-bold tabular-nums"
                          style={{ fontSize: '11px', color: signalColor, background: isUp ? 'rgba(5,150,105,0.12)' : 'rgba(220,38,38,0.12)', borderRadius: '4px', padding: '1px 6px' }}
                        >
                          {result.margin >= 0 ? '+' : ''}{result.margin.toFixed(1)}%
                        </span>
                      </div>
                      {/* Hero number */}
                      <div
                        className="num tabular-nums font-black"
                        style={{ fontSize: '36px', lineHeight: 1, color: signalColor, letterSpacing: '-0.02em' }}
                      >
                        {fmtPrice(result.fairValue)}
                      </div>
                      <div style={{ fontSize: '10px', color: signalColor, opacity: 0.65, marginTop: '4px', fontFamily: 'var(--font-sans)' }}>
                        vs current ${currentPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          ))}
        </div>

        {/* Current price footer */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: '1px solid rgba(13,13,11,0.07)', background: 'rgba(13,13,11,0.02)' }}
        >
          <span className="text-xs" style={{ color: '#9A9A98' }}>Current Price</span>
          <span className="num text-lg font-extrabold tabular-nums" style={{ color: '#0D0D0B' }}>
            ${currentPrice.toFixed(2)}
          </span>
        </div>
      </div>
    </>
  )
}
