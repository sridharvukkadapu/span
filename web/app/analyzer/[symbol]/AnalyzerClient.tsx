'use client'

import { useState } from 'react'
import type { AnalyzerData } from '@/lib/types'

interface Scenario {
  revenueGrowthPct: number
  profitMarginPct: number
  fcfMarginPct: number
  peMultiple: number
  pfcfMultiple: number
  years: number
  desiredReturnPct: number
}

interface Result {
  fvPE: number
  fvFCF: number
  fvAvg: number
  upside: number
  verdict: 'BUY' | 'HOLD' | 'SELL'
}

function calcScenario(rev: number, shares: number, currentPrice: number, s: Scenario): Result {
  const revB = rev / 1e9
  const sharesB = shares / 1e9
  const futureRev = revB * Math.pow(1 + s.revenueGrowthPct / 100, s.years)
  const futureEarn = futureRev * (s.profitMarginPct / 100)
  const futureFCF = futureRev * (s.fcfMarginPct / 100)
  const dr = 1 + s.desiredReturnPct / 100
  const discount = Math.pow(dr, s.years)
  const fvPE = sharesB > 0 ? (futureEarn * s.peMultiple) / sharesB / discount : 0
  const fvFCF = sharesB > 0 ? (futureFCF * s.pfcfMultiple) / sharesB / discount : 0
  const fvAvg = (fvPE + fvFCF) / 2
  const upside = currentPrice > 0 ? ((fvAvg - currentPrice) / currentPrice) * 100 : 0
  const verdict: 'BUY' | 'HOLD' | 'SELL' = upside > 20 ? 'BUY' : upside < -20 ? 'SELL' : 'HOLD'
  return { fvPE, fvFCF, fvAvg, upside, verdict }
}

const SCENARIOS = [
  {
    key: 'bear' as const,
    label: 'Bear',
    accent: '#ef4444',
    accentDim: 'rgba(239,68,68,0.08)',
    accentBorder: 'rgba(239,68,68,0.2)',
    topLine: '#ef4444',
  },
  {
    key: 'base' as const,
    label: 'Base',
    accent: '#60a5fa',
    accentDim: 'rgba(59,130,246,0.08)',
    accentBorder: 'rgba(59,130,246,0.2)',
    topLine: '#60a5fa',
  },
  {
    key: 'bull' as const,
    label: 'Bull',
    accent: '#34d399',
    accentDim: 'rgba(16,185,129,0.08)',
    accentBorder: 'rgba(16,185,129,0.2)',
    topLine: '#34d399',
  },
]

const VERDICT_STYLE = {
  BUY:  { color: '#34d399', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)' },
  HOLD: { color: '#fbbf24', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.22)' },
  SELL: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.22)' },
}

export default function AnalyzerClient({ data }: { data: AnalyzerData }) {
  const [bear, setBear] = useState<Scenario>(data.scenarios[0] ?? defaultScenario(3))
  const [base, setBase] = useState<Scenario>(data.scenarios[1] ?? defaultScenario(5))
  const [bull, setBull] = useState<Scenario>(data.scenarios[2] ?? defaultScenario(8))

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

  const rows: { label: string; key: keyof Scenario; step?: number }[] = [
    { label: 'Revenue Growth %', key: 'revenueGrowthPct' },
    { label: 'Profit Margin %',  key: 'profitMarginPct' },
    { label: 'FCF Margin %',     key: 'fcfMarginPct' },
    { label: 'P/E Multiple',     key: 'peMultiple', step: 1 },
    { label: 'P/FCF Multiple',   key: 'pfcfMultiple', step: 1 },
    { label: 'Years',            key: 'years', step: 1 },
    { label: 'Desired Return %', key: 'desiredReturnPct' },
  ]

  return (
    <div className="space-y-4">
      {/* ── Scenario result cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {SCENARIOS.map(({ key, label, accent, accentDim, accentBorder, topLine }) => {
          const res = results[key]
          const vs = VERDICT_STYLE[res.verdict]
          // Upside meter: clamp -100% to +200%
          const meterPct = Math.max(0, Math.min(100, (res.upside + 100) / 3))
          return (
            <div
              key={key}
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: '#08111f',
                border: `1px solid ${accentBorder}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 30px ${accent}0a`,
              }}
            >
              {/* Top accent line */}
              <div className="h-0.5 w-full" style={{ background: topLine, opacity: 0.7 }} />

              <div className="p-5">
                {/* Label */}
                <div className="label-xs mb-4" style={{ color: accent }}>{label} Case</div>

                {/* Fair value */}
                <div className="num text-3xl font-bold text-white mb-1 leading-none">
                  {res.fvAvg > 0 ? `$${res.fvAvg.toFixed(2)}` : '—'}
                </div>

                {/* Upside */}
                <div
                  className="num text-sm font-bold mb-3"
                  style={{ color: res.upside >= 0 ? '#34d399' : '#ef4444' }}
                >
                  {res.upside >= 0 ? '+' : ''}{res.upside.toFixed(1)}% upside
                </div>

                {/* Upside meter */}
                <div className="h-1 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${meterPct}%`,
                      background: res.upside >= 0 ? accent : '#ef4444',
                    }}
                  />
                </div>

                {/* Verdict */}
                <div
                  className="tag"
                  style={{ background: vs.bg, color: vs.color, borderColor: vs.border }}
                >
                  {res.verdict}
                </div>

                {/* FV breakdown */}
                <div className="mt-4 space-y-1.5">
                  {[
                    { label: 'P/E Fair Value',  val: res.fvPE  },
                    { label: 'P/FCF Fair Value', val: res.fvFCF },
                  ].map(({ label: l, val }) => (
                    <div key={l} className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600">{l}</span>
                      <span className="num text-[10px] font-semibold text-slate-400">
                        {val > 0 ? `$${val.toFixed(2)}` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Current price reference */}
      <div
        className="flex items-center justify-between rounded-xl px-5 py-3.5"
        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <span className="label-xs text-slate-500">Current Price</span>
        <span className="num text-xl font-bold text-white">${currentPrice.toFixed(2)}</span>
      </div>

      {/* ── Assumptions table ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#08111f', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="flex items-center gap-2 px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
          </svg>
          <span className="label-sm text-slate-300">Scenario Assumptions</span>
          <span className="ml-auto label-xs text-slate-600">edit to recalculate</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th className="px-5 py-3 text-left text-[9px] font-semibold text-slate-600 uppercase tracking-[0.12em]">Metric</th>
                {SCENARIOS.map(({ key, label, accent }) => (
                  <th key={key} className="px-3 py-3 text-center text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: accent }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.label}
                  style={{
                    borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                >
                  <td className="px-5 py-2.5 text-xs text-slate-400 whitespace-nowrap">{row.label}</td>
                  {SCENARIOS.map(({ key, accent }) => (
                    <td key={key} className="px-3 py-2">
                      <input
                        type="number"
                        value={values[key][row.key] as number}
                        step={row.step ?? 0.5}
                        onChange={e => setters[key](prev => ({ ...prev, [row.key]: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-2.5 py-1.5 rounded-lg text-white text-xs font-mono font-semibold text-center tabular-nums focus:outline-none transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = `${accent}60` }}
                        onBlur={e =>  { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detailed breakdown ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#08111f', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="flex items-center gap-2 px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
          <span className="label-sm text-slate-300">Detailed Breakdown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th className="px-5 py-3 text-left text-[9px] font-semibold text-slate-600 uppercase tracking-[0.12em]">Metric</th>
                {SCENARIOS.map(({ key, label, accent }) => (
                  <th key={key} className="px-5 py-3 text-center text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: accent }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Fair Value (P/E)',   fn: (r: Result) => `$${r.fvPE.toFixed(2)}`,  highlight: false },
                { label: 'Fair Value (P/FCF)', fn: (r: Result) => `$${r.fvFCF.toFixed(2)}`, highlight: false },
                { label: 'Avg Fair Value',     fn: (r: Result) => `$${r.fvAvg.toFixed(2)}`, highlight: true },
                { label: 'Upside / Downside',  fn: (r: Result) => `${r.upside >= 0 ? '+' : ''}${r.upside.toFixed(1)}%`, highlight: false },
              ].map(({ label, fn, highlight }, i) => (
                <tr
                  key={label}
                  style={{
                    borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: highlight ? 'rgba(59,130,246,0.04)' : undefined,
                  }}
                >
                  <td className={`px-5 py-3 text-xs ${highlight ? 'font-semibold text-slate-200' : 'text-slate-500'}`}>
                    {label}
                  </td>
                  {SCENARIOS.map(({ key }) => (
                    <td key={key} className={`px-5 py-3 text-center num text-sm ${highlight ? 'font-bold text-white' : 'text-slate-400'}`}>
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

function defaultScenario(growth: number): Scenario {
  return { revenueGrowthPct: growth, profitMarginPct: 15, fcfMarginPct: 12, peMultiple: 20, pfcfMultiple: 18, years: 5, desiredReturnPct: 10 }
}
