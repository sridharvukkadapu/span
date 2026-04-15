'use client'

import { useState, useCallback } from 'react'
import type { BasicAnalyzerData } from '@/lib/types'

interface Scenario {
  growthRatePct: number
  netProfitPct: number
  peMultiple: number
  dilutionPctPerYear: number
  years: number
}

interface Result {
  price: number
  gain: number
}

function calcScenario(rev: number, shares: number, currentPrice: number, s: Scenario): Result {
  const revB = rev / 1e9
  const sharesB = shares / 1e9
  const futureRev = revB * Math.pow(1 + s.growthRatePct / 100, s.years)
  const futureEarn = futureRev * (s.netProfitPct / 100)
  const futureMcap = futureEarn * s.peMultiple
  const futureShares = sharesB * Math.pow(1 + s.dilutionPctPerYear / 100, s.years)
  const price = futureShares > 0 ? futureMcap / futureShares : 0
  const gain = currentPrice > 0 ? ((price - currentPrice) / currentPrice) * 100 : 0
  return { price, gain }
}

function fmtPrice(v: number) {
  return v < 0 ? `-$${Math.abs(v).toFixed(2)}` : `$${v.toFixed(2)}`
}

export default function BasicAnalyzerClient({ data }: { data: BasicAnalyzerData }) {
  const [r, setR] = useState<Scenario>(data.reasonable)
  const [g, setG] = useState<Scenario>(data.greatExecution)

  const currentPrice = data.currentPrice ?? 0
  const rev = data.ttmRevenue ?? 0
  const shares = data.sharesOutstanding ?? 1

  const resultR = calcScenario(rev, shares, currentPrice, r)
  const resultG = calcScenario(rev, shares, currentPrice, g)

  const verdictClass = (gain: number) =>
    gain > 15 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' :
    gain < -15 ? 'bg-red-500/10 text-red-400 border-red-500/25' :
    'bg-amber-500/10 text-amber-400 border-amber-500/25'

  const verdictLabel = (gain: number) => gain > 15 ? 'BUY' : gain < -15 ? 'SELL' : 'HOLD'

  const inp = (val: number, onChange: (v: number) => void, step = 0.5, min?: number) => (
    <input
      type="number"
      value={val}
      step={step}
      min={min}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-white/[0.08] text-white text-sm font-semibold text-center tabular-nums focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
    />
  )

  return (
    <>
      {/* Result Cards */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: '📊 Reasonable', result: resultR, color: 'border-t-blue-500' },
          { label: '⚡ Great Execution', result: resultG, color: 'border-t-violet-500' },
        ].map(({ label, result, color }) => (
          <div key={label} className={`bg-surface border border-white/[0.07] rounded-2xl pt-4 px-6 pb-6 border-t-2 ${color} text-center card-hover`}>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{label}</div>
            <div className="text-3xl font-black text-white tabular-nums">{fmtPrice(result.price)}</div>
            <div className={`text-lg font-bold mt-1 tabular-nums ${result.gain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.gain >= 0 ? '+' : ''}{result.gain.toFixed(1)}%
            </div>
            <span className={`inline-block mt-3 px-4 py-1 rounded-full text-xs font-black tracking-widest border ${verdictClass(result.gain)}`}>
              {verdictLabel(result.gain)}
            </span>
          </div>
        ))}
      </div>

      {/* Inputs */}
      <div className="bg-surface border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-0">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">🔧 Scenario Inputs</h2>
        </div>
        <div className="px-6 py-5 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="pb-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Metric</th>
                <th className="pb-3 text-center text-[10px] font-semibold text-blue-400 uppercase tracking-wider">📊 Reasonable</th>
                <th className="pb-3 text-center text-[10px] font-semibold text-violet-400 uppercase tracking-wider">⚡ Great Execution</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Growth Rate %', keyR: 'growthRatePct' as keyof Scenario, keyG: 'growthRatePct' as keyof Scenario, step: 0.5 },
                { label: 'Net Profit %', keyR: 'netProfitPct' as keyof Scenario, keyG: 'netProfitPct' as keyof Scenario, step: 0.5 },
                { label: 'P/E Multiple', keyR: 'peMultiple' as keyof Scenario, keyG: 'peMultiple' as keyof Scenario, step: 0.5 },
                { label: 'Dilution % / Year', keyR: 'dilutionPctPerYear' as keyof Scenario, keyG: 'dilutionPctPerYear' as keyof Scenario, step: 0.1 },
                { label: 'Projection Years', keyR: 'years' as keyof Scenario, keyG: 'years' as keyof Scenario, step: 1, min: 1 },
              ].map(row => (
                <tr key={row.label} className="border-b border-white/[0.04] last:border-0">
                  <td className="py-2.5 text-sm text-slate-400 font-medium pr-4">{row.label}</td>
                  <td className="py-2.5 px-2">{inp(r[row.keyR] as number, v => setR(prev => ({ ...prev, [row.keyR]: v })), row.step, row.min)}</td>
                  <td className="py-2.5 px-2">{inp(g[row.keyG] as number, v => setG(prev => ({ ...prev, [row.keyG]: v })), row.step, row.min)}</td>
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
    </>
  )
}
