'use client'

import { useState } from 'react'
import type { AnalyzerData, ScenarioDefaults } from '@/lib/types'

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

function calcScenario(
  rev: number,
  shares: number,
  currentPrice: number,
  s: Scenario,
): Result {
  const revB = rev / 1e9
  const sharesB = shares / 1e9
  const futureRev = revB * Math.pow(1 + s.revenueGrowthPct / 100, s.years)
  const futureEarn = futureRev * (s.profitMarginPct / 100)
  const futureFCF = futureRev * (s.fcfMarginPct / 100)
  // Discount back
  const dr = 1 + s.desiredReturnPct / 100
  const discount = Math.pow(dr, s.years)
  const fvPE = sharesB > 0 ? (futureEarn * s.peMultiple) / sharesB / discount : 0
  const fvFCF = sharesB > 0 ? (futureFCF * s.pfcfMultiple) / sharesB / discount : 0
  const fvAvg = (fvPE + fvFCF) / 2
  const upside = currentPrice > 0 ? ((fvAvg - currentPrice) / currentPrice) * 100 : 0
  const verdict: 'BUY' | 'HOLD' | 'SELL' = upside > 20 ? 'BUY' : upside < -20 ? 'SELL' : 'HOLD'
  return { fvPE, fvFCF, fvAvg, upside, verdict }
}

const verdictStyle = {
  BUY: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  HOLD: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  SELL: 'bg-red-500/10 text-red-400 border-red-500/25',
}

const scenarioCfg = [
  { key: 'bear' as const, emoji: '🐻', label: 'Bear', colorTop: 'border-t-red-500', accent: 'text-red-400' },
  { key: 'base' as const, emoji: '📊', label: 'Base', colorTop: 'border-t-blue-500', accent: 'text-blue-400' },
  { key: 'bull' as const, emoji: '🐂', label: 'Bull', colorTop: 'border-t-emerald-500', accent: 'text-emerald-400' },
]

export default function AnalyzerClient({ data }: { data: AnalyzerData }) {
  const [bear, setBear] = useState<Scenario>(data.scenarios[0] ?? defaultScenario(3))
  const [base, setBase] = useState<Scenario>(data.scenarios[1] ?? defaultScenario(5))
  const [bull, setBull] = useState<Scenario>(data.scenarios[2] ?? defaultScenario(8))

  const setters = { bear: setBear, base: setBase, bull: setBull }
  const values = { bear, base, bull }

  const currentPrice = data.currentPrice ?? 0
  const rev = data.ttmRevenue ?? 0
  const shares = data.sharesOutstanding ?? 1e9

  const results = {
    bear: calcScenario(rev, shares, currentPrice, bear),
    base: calcScenario(rev, shares, currentPrice, base),
    bull: calcScenario(rev, shares, currentPrice, bull),
  }

  const inp = (val: number, onChange: (v: number) => void, step = 0.5) => (
    <input
      type="number"
      value={val}
      step={step}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className="w-full px-2 py-2 rounded-lg bg-surface-2 border border-white/[0.08] text-white text-sm font-semibold text-center tabular-nums focus:outline-none focus:border-blue-500/60 transition-all"
    />
  )

  const rows: { label: string; key: keyof Scenario; step?: number }[] = [
    { label: 'Revenue Growth %', key: 'revenueGrowthPct' },
    { label: 'Profit Margin %', key: 'profitMarginPct' },
    { label: 'FCF Margin %', key: 'fcfMarginPct' },
    { label: 'P/E Multiple', key: 'peMultiple', step: 1 },
    { label: 'P/FCF Multiple', key: 'pfcfMultiple', step: 1 },
    { label: 'Years', key: 'years', step: 1 },
    { label: 'Desired Return %', key: 'desiredReturnPct' },
  ]

  return (
    <>
      {/* Result cards */}
      <div className="grid grid-cols-3 gap-4">
        {scenarioCfg.map(({ key, emoji, label, colorTop, accent }) => {
          const res = results[key]
          return (
            <div key={key} className={`bg-surface border border-white/[0.07] rounded-2xl border-t-2 ${colorTop} pt-5 px-5 pb-6 text-center card-hover`}>
              <div className="text-2xl mb-1">{emoji}</div>
              <div className={`text-xs font-black uppercase tracking-widest ${accent} mb-3`}>{label}</div>
              <div className="text-2xl font-black text-white tabular-nums">
                ${res.fvAvg > 0 ? res.fvAvg.toFixed(2) : '—'}
              </div>
              <div className={`text-base font-bold mt-1 tabular-nums ${res.upside >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {res.upside >= 0 ? '+' : ''}{res.upside.toFixed(1)}%
              </div>
              <span className={`inline-block mt-3 px-4 py-1 rounded-full text-xs font-black tracking-widest border ${verdictStyle[res.verdict]}`}>
                {res.verdict}
              </span>
            </div>
          )
        })}
      </div>

      {/* Assumptions table */}
      <div className="bg-surface border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-0">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">🔧 Scenario Assumptions</h2>
        </div>
        <div className="px-6 py-5 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="pb-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Metric</th>
                <th className="pb-3 text-center text-[10px] font-semibold text-red-400 uppercase tracking-wider">🐻 Bear</th>
                <th className="pb-3 text-center text-[10px] font-semibold text-blue-400 uppercase tracking-wider">📊 Base</th>
                <th className="pb-3 text-center text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">🐂 Bull</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.label} className="border-b border-white/[0.04] last:border-0">
                  <td className="py-2.5 text-sm text-slate-400 font-medium pr-4 whitespace-nowrap">{row.label}</td>
                  {(['bear', 'base', 'bull'] as const).map(k => (
                    <td key={k} className="py-2 px-2">
                      {inp(values[k][row.key] as number, v => setters[k](prev => ({ ...prev, [row.key]: v })), row.step)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex items-center justify-between bg-surface-2 rounded-xl px-4 py-3">
            <span className="text-xs text-slate-500">Current Price</span>
            <span className="text-lg font-extrabold text-white tabular-nums">${currentPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Detail breakdown */}
      <div className="bg-surface border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-0">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">📋 Detailed Breakdown</h2>
        </div>
        <div className="px-6 py-5 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="pb-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Metric</th>
                <th className="pb-3 text-center text-[10px] font-semibold text-red-400 uppercase tracking-wider">🐻 Bear</th>
                <th className="pb-3 text-center text-[10px] font-semibold text-blue-400 uppercase tracking-wider">📊 Base</th>
                <th className="pb-3 text-center text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">🐂 Bull</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Fair Value (P/E)', fn: (r: Result) => r.fvPE },
                { label: 'Fair Value (P/FCF)', fn: (r: Result) => r.fvFCF },
                { label: 'Avg Fair Value', fn: (r: Result) => r.fvAvg, highlight: true },
                { label: 'Upside %', fn: (r: Result) => r.upside, pct: true },
              ].map(({ label, fn, highlight, pct }) => (
                <tr key={label} className={`border-b border-white/[0.04] last:border-0 ${highlight ? 'bg-blue-500/[0.05]' : ''}`}>
                  <td className={`py-2.5 text-sm pr-4 ${highlight ? 'font-bold text-white' : 'text-slate-400 font-medium'}`}>{label}</td>
                  {(['bear', 'base', 'bull'] as const).map(k => {
                    const v = fn(results[k])
                    return (
                      <td key={k} className={`py-2.5 text-sm text-center tabular-nums ${highlight ? 'font-extrabold text-white' : 'font-semibold text-slate-300'}`}>
                        {pct ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` : `$${v.toFixed(2)}`}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function defaultScenario(growth: number): Scenario {
  return { revenueGrowthPct: growth, profitMarginPct: 15, fcfMarginPct: 12, peMultiple: 20, pfcfMultiple: 18, years: 5, desiredReturnPct: 10 }
}
