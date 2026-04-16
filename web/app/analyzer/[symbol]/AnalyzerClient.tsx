'use client'

import { useState, useCallback, useEffect } from 'react'
import type { AnalyzerData } from '@/lib/types'

/* ── Types ─────────────────────────────────────────────── */
interface Scenario {
  revenueGrowthPct: number
  profitMarginPct:  number
  fcfMarginPct:     number
  peMultiple:       number
  pfcfMultiple:     number
  years:            number
  desiredReturnPct: number
}

interface Result {
  fvPE:    number
  fvFCF:   number
  fvAvg:   number
  upside:  number
  verdict: 'BUY' | 'HOLD' | 'SELL'
}

/* ── Calc ──────────────────────────────────────────────── */
function calcScenario(rev: number, shares: number, currentPrice: number, s: Scenario): Result {
  const revB      = rev / 1e9
  const sharesB   = shares / 1e9
  const futureRev  = revB  * Math.pow(1 + s.revenueGrowthPct / 100, s.years)
  const futureEarn = futureRev * (s.profitMarginPct / 100)
  const futureFCF  = futureRev * (s.fcfMarginPct / 100)
  const dr         = 1 + s.desiredReturnPct / 100
  const discount   = Math.pow(dr, s.years)
  const fvPE   = sharesB > 0 ? (futureEarn * s.peMultiple)   / sharesB / discount : 0
  const fvFCF  = sharesB > 0 ? (futureFCF  * s.pfcfMultiple) / sharesB / discount : 0
  const fvAvg  = (fvPE + fvFCF) / 2
  const upside = currentPrice > 0 ? ((fvAvg - currentPrice) / currentPrice) * 100 : 0
  const verdict: 'BUY' | 'HOLD' | 'SELL' = upside > 20 ? 'BUY' : upside < -20 ? 'SELL' : 'HOLD'
  return { fvPE, fvFCF, fvAvg, upside, verdict }
}

/* ── Slider config ─────────────────────────────────────── */
const SLIDER_CONFIG: {
  key:   keyof Scenario
  label: string
  min:   number
  max:   number
  step:  number
  unit:  string
}[] = [
  { key: 'revenueGrowthPct', label: 'Revenue Growth',  min: 0,  max: 50, step: 0.5, unit: '%' },
  { key: 'profitMarginPct',  label: 'Profit Margin',   min: 0,  max: 60, step: 0.5, unit: '%' },
  { key: 'fcfMarginPct',     label: 'FCF Margin',      min: 0,  max: 40, step: 0.5, unit: '%' },
  { key: 'peMultiple',       label: 'P/E Multiple',    min: 5,  max: 60, step: 0.5, unit: 'x' },
  { key: 'pfcfMultiple',     label: 'P/FCF Multiple',  min: 5,  max: 80, step: 0.5, unit: 'x' },
  { key: 'years',            label: 'Years',           min: 1,  max: 10, step: 1,   unit: 'yr' },
  { key: 'desiredReturnPct', label: 'Required Return', min: 0,  max: 30, step: 0.5, unit: '%' },
]

/* ── Scenario meta ─────────────────────────────────────── */
const SCENARIOS = [
  {
    key:    'bear' as const,
    label:  'Bear',
    color:  '#DC2626',
    text:   '#B91C1C',
    bg:     'rgba(220,38,38,0.07)',
    border: 'rgba(220,38,38,0.18)',
  },
  {
    key:    'base' as const,
    label:  'Base',
    color:  '#0D0D0B',
    text:   '#4A4A48',
    bg:     'rgba(13,13,11,0.04)',
    border: 'rgba(13,13,11,0.12)',
  },
  {
    key:    'bull' as const,
    label:  'Bull',
    color:  '#059669',
    text:   '#047857',
    bg:     'rgba(5,150,105,0.07)',
    border: 'rgba(5,150,105,0.18)',
  },
]

const VERDICT_STYLE = {
  BUY:  { color: '#047857', bg: 'rgba(5,150,105,0.09)',  border: 'rgba(5,150,105,0.22)' },
  HOLD: { color: '#B45309', bg: 'rgba(217,119,6,0.09)', border: 'rgba(217,119,6,0.22)' },
  SELL: { color: '#B91C1C', bg: 'rgba(220,38,38,0.09)',  border: 'rgba(220,38,38,0.22)' },
}

/* ── Slider component ──────────────────────────────────── */
function ScenarioSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  accentColor,
  onChange,
}: {
  label:       string
  value:       number
  min:         number
  max:         number
  step:        number
  unit:        string
  accentColor: string
  onChange:    (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color: '#6A6A68', fontFamily: 'var(--font-body)' }}>
          {label}
        </span>
        <span
          className="num text-xs font-bold tabular-nums"
          style={{ color: accentColor, minWidth: '44px', textAlign: 'right' }}
        >
          {value.toFixed(unit === 'yr' ? 0 : unit === 'x' ? 1 : 1)}{unit}
        </span>
      </div>

      <div className="relative h-5 flex items-center" style={{ paddingTop: 2, paddingBottom: 2 }}>
        {/* Track background */}
        <div
          className="absolute left-0 right-0 h-1.5 rounded-full"
          style={{ background: 'rgba(13,13,11,0.08)' }}
        />
        {/* Track fill */}
        <div
          className="absolute left-0 h-1.5 rounded-full transition-all duration-100"
          style={{
            width:      `${pct}%`,
            background: accentColor,
          }}
        />
        {/* Native range input — overlaid, transparent */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="absolute left-0 right-0 w-full opacity-0 cursor-pointer"
          style={{ height: '20px' }}
          aria-label={`${label}: ${value}${unit}`}
        />
        {/* Custom thumb */}
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white transition-all duration-100"
          style={{
            left:       `calc(${pct}% - 8px)`,
            background: accentColor,
            boxShadow:  `0 1px 4px ${accentColor}40, 0 0 0 3px ${accentColor}18`,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

/* ── Price ruler visualization ─────────────────────────── */
function PriceRuler({
  currentPrice,
  bearFV,
  baseFV,
  bullFV,
}: {
  currentPrice: number
  bearFV:       number
  baseFV:       number
  bullFV:       number
}) {
  if (currentPrice <= 0) return null

  const allPrices  = [currentPrice, bearFV, baseFV, bullFV].filter(p => p > 0)
  const minP       = Math.min(...allPrices) * 0.85
  const maxP       = Math.max(...allPrices) * 1.15
  const range      = maxP - minP

  const toX = (p: number) => range > 0 ? ((p - minP) / range) * 100 : 50

  const currentX = toX(currentPrice)
  const bearX    = bearFV > 0 ? toX(bearFV)  : null
  const baseX    = baseFV > 0 ? toX(baseFV)  : null
  const bullX    = bullFV > 0 ? toX(bullFV)  : null

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1px solid rgba(13,13,11,0.09)', boxShadow: '0 1px 4px rgba(13,13,11,0.04)' }}
    >
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid rgba(13,13,11,0.07)' }}
      >
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#0D0D0B', fontFamily: 'var(--font-display)' }}>
          Price Ruler
        </span>
        <span className="label-xs" style={{ color: '#B0B0AE' }}>fair value vs current</span>
      </div>

      <div className="px-6 py-5">
        {/* Ruler track */}
        <div className="relative h-8" aria-hidden="true">
          {/* Base track */}
          <div
            className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2"
            style={{ background: 'rgba(13,13,11,0.08)' }}
          />

          {/* Current price marker */}
          <div
            className="absolute top-0 bottom-0 flex flex-col items-center"
            style={{ left: `${currentX}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-px flex-1" style={{ background: '#0D0D0B' }} />
            <div className="w-2 h-2 rounded-full mt-auto" style={{ background: '#0D0D0B' }} />
          </div>

          {/* Bear */}
          {bearX !== null && bearFV > 0 && (
            <div
              className="absolute top-0 bottom-0 flex flex-col items-center"
              style={{ left: `${bearX}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-px flex-1" style={{ background: '#DC2626' }} />
              <div className="w-2 h-2 rounded-full mt-auto" style={{ background: '#DC2626' }} />
            </div>
          )}

          {/* Base */}
          {baseX !== null && baseFV > 0 && (
            <div
              className="absolute top-0 bottom-0 flex flex-col items-center"
              style={{ left: `${baseX}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-px flex-1" style={{ background: '#4A4A48' }} />
              <div className="w-2 h-2 rounded-full mt-auto" style={{ background: '#4A4A48' }} />
            </div>
          )}

          {/* Bull */}
          {bullX !== null && bullFV > 0 && (
            <div
              className="absolute top-0 bottom-0 flex flex-col items-center"
              style={{ left: `${bullX}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-px flex-1" style={{ background: '#059669' }} />
              <div className="w-2 h-2 rounded-full mt-auto" style={{ background: '#059669' }} />
            </div>
          )}
        </div>

        {/* Labels row */}
        <div className="relative h-12 mt-2" aria-label="Price ruler labels">
          {[
            { x: currentX, label: 'Current',   price: currentPrice, color: '#0D0D0B' },
            ...(bearX !== null && bearFV > 0 ? [{ x: bearX,    label: 'Bear FV',   price: bearFV,    color: '#DC2626' }] : []),
            ...(baseX !== null && baseFV > 0 ? [{ x: baseX,    label: 'Base FV',   price: baseFV,    color: '#4A4A48' }] : []),
            ...(bullX !== null && bullFV > 0 ? [{ x: bullX,    label: 'Bull FV',   price: bullFV,    color: '#059669' }] : []),
          ].map(({ x, label, price, color }) => (
            <div
              key={label}
              className="absolute flex flex-col items-center"
              style={{ left: `${x}%`, transform: 'translateX(-50%)', top: 0 }}
            >
              <span className="text-[9px] font-semibold whitespace-nowrap" style={{ color: '#9A9A98', fontFamily: 'var(--font-body)' }}>
                {label}
              </span>
              <span className="num text-[10px] font-bold whitespace-nowrap" style={{ color }}>
                ${price.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── URL param encoding ──────────────────────────────────── */
const SCENARIO_KEYS: (keyof Scenario)[] = [
  'revenueGrowthPct', 'profitMarginPct', 'fcfMarginPct',
  'peMultiple', 'pfcfMultiple', 'years', 'desiredReturnPct',
]

function encodeScenario(prefix: string, s: Scenario): Record<string, string> {
  const out: Record<string, string> = {}
  SCENARIO_KEYS.forEach(k => { out[`${prefix}_${k}`] = String(s[k]) })
  return out
}

function decodeScenario(prefix: string, params: URLSearchParams, fallback: Scenario): Scenario {
  const s = { ...fallback }
  SCENARIO_KEYS.forEach(k => {
    const v = params.get(`${prefix}_${k}`)
    if (v !== null) (s[k] as number) = parseFloat(v)
  })
  return s
}

/* ── Main component ─────────────────────────────────────── */
function defaultScenario(growth: number): Scenario {
  return { revenueGrowthPct: growth, profitMarginPct: 15, fcfMarginPct: 12, peMultiple: 20, pfcfMultiple: 18, years: 5, desiredReturnPct: 10 }
}

export default function AnalyzerClient({ data }: { data: AnalyzerData }) {
  const defaultBear = data.scenarios[0] ?? defaultScenario(3)
  const defaultBase = data.scenarios[1] ?? defaultScenario(5)
  const defaultBull = data.scenarios[2] ?? defaultScenario(8)

  function loadFromParams(): { bear: Scenario; base: Scenario; bull: Scenario } {
    if (typeof window === 'undefined') return { bear: defaultBear, base: defaultBase, bull: defaultBull }
    const params = new URLSearchParams(window.location.search)
    return {
      bear: decodeScenario('bear', params, defaultBear),
      base: decodeScenario('base', params, defaultBase),
      bull: decodeScenario('bull', params, defaultBull),
    }
  }

  const [bear, setBear] = useState<Scenario>(() => loadFromParams().bear)
  const [base, setBase] = useState<Scenario>(() => loadFromParams().base)
  const [bull, setBull] = useState<Scenario>(() => loadFromParams().bull)
  const [toast, setToast] = useState<string | null>(null)

  const setters = { bear: setBear, base: setBase, bull: setBull }
  const values  = { bear, base, bull }

  const currentPrice = data.currentPrice ?? 0
  const rev    = data.ttmRevenue ?? 0
  const shares = data.sharesOutstanding ?? 1e9

  const results = {
    bear: calcScenario(rev, shares, currentPrice, bear),
    base: calcScenario(rev, shares, currentPrice, base),
    bull: calcScenario(rev, shares, currentPrice, bull),
  }

  const makeUpdater = useCallback(
    (key: 'bear' | 'base' | 'bull', field: keyof Scenario) =>
      (v: number) => setters[key](prev => ({ ...prev, [field]: v })),
    [],
  )

  function resetDefaults() {
    setBear(defaultBear)
    setBase(defaultBase)
    setBull(defaultBull)
  }

  function copyLink() {
    const params = new URLSearchParams({
      ...encodeScenario('bear', bear),
      ...encodeScenario('base', base),
      ...encodeScenario('bull', bull),
    })
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`
    navigator.clipboard.writeText(url).then(() => {
      setToast('Link copied!')
      setTimeout(() => setToast(null), 3000)
    })
  }

  return (
    <div className="space-y-4">

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-up px-5 py-3 rounded-xl flex items-center gap-3"
          style={{
            background: '#0D0D0B',
            color: '#F5F4F0',
            boxShadow: '0 8px 24px rgba(13,13,11,0.3)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span className="text-[12px] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>{toast}</span>
        </div>
      )}

      {/* ── Scenario result cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SCENARIOS.map(({ key, label, color, text, bg, border }) => {
          const res = results[key]
          const vs  = VERDICT_STYLE[res.verdict]
          const meterPct = Math.max(0, Math.min(100, (res.upside + 100) / 3))
          return (
            <div
              key={key}
              className="relative rounded-xl overflow-hidden"
              style={{ background: '#FFFFFF', border: `1px solid ${border}`, boxShadow: '0 1px 4px rgba(13,13,11,0.04)' }}
            >
              <div className="h-[2px] w-full" style={{ background: color }} />
              <div className="p-5">
                <div className="label-xs mb-4" style={{ color: text }}>{label} Case</div>

                <div className="num text-3xl font-bold leading-none mb-1" style={{ color: '#0D0D0B' }}>
                  {res.fvAvg > 0 ? `$${res.fvAvg.toFixed(2)}` : '—'}
                </div>

                <div
                  className="num text-sm font-bold mb-3"
                  style={{ color: res.upside >= 0 ? '#047857' : '#B91C1C' }}
                >
                  {res.upside >= 0 ? '+' : ''}{res.upside.toFixed(1)}% upside
                </div>

                <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(13,13,11,0.07)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${meterPct}%`, background: res.upside >= 0 ? color : '#DC2626' }}
                  />
                </div>

                <div className="tag" style={{ background: vs.bg, color: vs.color, borderColor: vs.border }}>
                  {res.verdict}
                </div>

                <div className="mt-4 space-y-1.5">
                  {[
                    { l: 'P/E Fair Value',   v: res.fvPE  },
                    { l: 'P/FCF Fair Value', v: res.fvFCF },
                  ].map(({ l, v }) => (
                    <div key={l} className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: '#9A9A98' }}>{l}</span>
                      <span className="num text-[10px] font-semibold" style={{ color: '#4A4A48' }}>
                        {v > 0 ? `$${v.toFixed(2)}` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Price ruler ── */}
      <PriceRuler
        currentPrice={currentPrice}
        bearFV={results.bear.fvAvg}
        baseFV={results.base.fvAvg}
        bullFV={results.bull.fvAvg}
      />

      {/* ── Slider assumptions ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#FFFFFF', border: '1px solid rgba(13,13,11,0.09)', boxShadow: '0 1px 4px rgba(13,13,11,0.04)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid rgba(13,13,11,0.07)' }}
        >
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#0D0D0B', fontFamily: 'var(--font-display)' }}>
            Scenario Assumptions
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={resetDefaults}
              className="text-[10px] font-semibold px-3 py-1.5 rounded transition-colors"
              style={{
                background: 'rgba(13,13,11,0.05)',
                border: '1px solid rgba(13,13,11,0.1)',
                color: '#6A6A68',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(13,13,11,0.09)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(13,13,11,0.05)' }}
            >
              Reset
            </button>
            <button
              onClick={copyLink}
              className="text-[10px] font-semibold px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
              style={{
                background: 'rgba(5,150,105,0.08)',
                border: '1px solid rgba(5,150,105,0.2)',
                color: '#047857',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(5,150,105,0.14)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(5,150,105,0.08)' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Copy link
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: 'rgba(13,13,11,0.06)' }}>
          {SCENARIOS.map(({ key, label, color, text }) => (
            <div key={key} className="p-5 space-y-4">
              {/* Scenario header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: text, fontFamily: 'var(--font-display)' }}>
                  {label} Case
                </span>
              </div>

              {SLIDER_CONFIG.map(({ key: field, label: sliderLabel, min, max, step, unit }) => (
                <ScenarioSlider
                  key={field}
                  label={sliderLabel}
                  value={values[key][field] as number}
                  min={min}
                  max={max}
                  step={step}
                  unit={unit}
                  accentColor={color}
                  onChange={makeUpdater(key, field)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Detailed breakdown ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#FFFFFF', border: '1px solid rgba(13,13,11,0.09)', boxShadow: '0 1px 4px rgba(13,13,11,0.04)' }}
      >
        <div
          className="flex items-center gap-2 px-5 py-3.5"
          style={{ borderBottom: '1px solid rgba(13,13,11,0.07)' }}
        >
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#0D0D0B', fontFamily: 'var(--font-display)' }}>
            Detailed Breakdown
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(13,13,11,0.07)' }}>
                <th className="px-5 py-3 text-left text-[9px] font-bold text-[#9A9A98] uppercase tracking-[0.12em]" style={{ fontFamily: 'var(--font-data)' }}>Metric</th>
                {SCENARIOS.map(({ key, label, text }) => (
                  <th key={key} className="px-5 py-3 text-center text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: text, fontFamily: 'var(--font-data)' }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Fair Value (P/E)',   fn: (r: Result) => `$${r.fvPE.toFixed(2)}`,  highlight: false },
                { label: 'Fair Value (P/FCF)', fn: (r: Result) => `$${r.fvFCF.toFixed(2)}`, highlight: false },
                { label: 'Avg Fair Value',     fn: (r: Result) => `$${r.fvAvg.toFixed(2)}`, highlight: true  },
                { label: 'Upside / Downside',  fn: (r: Result) => `${r.upside >= 0 ? '+' : ''}${r.upside.toFixed(1)}%`, highlight: false },
              ].map(({ label, fn, highlight }, i) => (
                <tr
                  key={label}
                  style={{
                    borderBottom: i < 3 ? '1px solid rgba(13,13,11,0.05)' : 'none',
                    background:   highlight ? 'rgba(13,13,11,0.02)' : undefined,
                  }}
                >
                  <td
                    className={`px-5 py-3 text-xs ${highlight ? 'font-semibold' : ''}`}
                    style={{ color: highlight ? '#0D0D0B' : '#6A6A68' }}
                  >
                    {label}
                  </td>
                  {SCENARIOS.map(({ key }) => (
                    <td
                      key={key}
                      className={`px-5 py-3 text-center num text-sm ${highlight ? 'font-bold' : 'font-medium'}`}
                      style={{ color: highlight ? '#0D0D0B' : '#4A4A48' }}
                    >
                      {fn(results[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
