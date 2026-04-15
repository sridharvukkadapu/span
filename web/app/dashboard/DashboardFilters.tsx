'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { DashboardStock, Signal } from '@/lib/types'
import SignalBadge from '../components/SignalBadge'

const SECTOR_MAP: Record<string, string> = {
  MSFT:'Tech',GOOGL:'Tech',AMZN:'Tech',META:'Tech',NFLX:'Tech',CRM:'Tech',ADBE:'Tech',ORCL:'Tech',
  UBER:'Tech',ABNB:'Tech',SQ:'Tech',SHOP:'Tech',SNOW:'Tech',PLTR:'Tech',COIN:'Tech',HOOD:'Tech',
  SOFI:'Tech',CRWD:'Tech',PANW:'Tech',ZS:'Tech',NET:'Tech',DDOG:'Tech',RBLX:'Tech',ROKU:'Tech',
  SNAP:'Tech',RDDT:'Tech',DASH:'Tech',GRAB:'Tech',SE:'Tech',MELI:'Tech',NU:'Tech',
  NVDA:'Semis',AMD:'Semis',AVGO:'Semis',QCOM:'Semis',MU:'Semis',MRVL:'Semis',ARM:'Semis',SMCI:'Semis',INTC:'Semis',
  AAPL:'Consumer',TSLA:'Consumer',DIS:'Consumer',SBUX:'Consumer',NKE:'Consumer',MCD:'Consumer',
  KO:'Consumer',PEP:'Consumer',PG:'Consumer',COST:'Consumer',WMT:'Consumer',TGT:'Consumer',
  HD:'Consumer',LOW:'Consumer',PINS:'Consumer',GME:'Consumer',AMC:'Consumer',
  JPM:'Finance',GS:'Finance',MS:'Finance',BAC:'Finance',WFC:'Finance',V:'Finance',MA:'Finance',
  AXP:'Finance',PYPL:'Finance','BRK.B':'Finance',BX:'Finance',KKR:'Finance',SCHW:'Finance',
  JNJ:'Healthcare',UNH:'Healthcare',PFE:'Healthcare',ABBV:'Healthcare',LLY:'Healthcare',
  MRK:'Healthcare',BMY:'Healthcare',AMGN:'Healthcare',
  BA:'Industrials',CAT:'Industrials',GE:'Industrials',HON:'Industrials',LMT:'Industrials',RTX:'Industrials',
  XOM:'Energy',CVX:'Energy',COP:'Energy',
  T:'Telecom',VZ:'Telecom',TMUS:'Telecom',
  AMT:'Real Estate',PLD:'Real Estate',
  RIVN:'EV/Clean',LCID:'EV/Clean',
}

function sectorFor(sym: string) { return SECTOR_MAP[sym.toUpperCase()] ?? 'Other' }

export default function DashboardFilters({ stocks }: { stocks: DashboardStock[] }) {
  const [signal, setSignal] = useState<string>('all')
  const [sector, setSector] = useState<string>('all')
  const [query,  setQuery]  = useState<string>('')

  const sectors = useMemo(
    () => Array.from(new Set(stocks.map(s => sectorFor(s.symbol)))).sort(),
    [stocks],
  )

  const filtered = useMemo(
    () =>
      stocks.filter(s => {
        if (signal !== 'all' && s.signal !== signal) return false
        if (sector !== 'all' && sectorFor(s.symbol) !== sector) return false
        if (query) {
          const q = query.toUpperCase()
          return s.symbol.includes(q) || (s.companyName ?? '').toUpperCase().includes(q)
        }
        return true
      }),
    [stocks, signal, sector, query],
  )

  return (
    <>
      {/* ── Filter bar ── */}
      <div
        className="rounded-xl px-5 py-4 mb-4"
        style={{ background: '#0a1221', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Search */}
        <input
          type="text"
          placeholder="Search ticker or company…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder:text-smoke font-body focus:outline-none transition-all mb-4"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.35)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
          onBlur={e =>  { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
        />

        {/* Signal filters */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-[9px] font-semibold text-smoke uppercase tracking-[0.1em] w-12 shrink-0">Signal</span>
          {(['all', 'BUY', 'HOLD', 'SELL'] as const).map(v => {
            const active = signal === (v as string)
            const colors: Record<string, { a: string; b: string; c: string }> = {
              all:  { a: 'rgba(255,255,255,0.1)', b: 'rgba(255,255,255,0.08)', c: '#e2e8f0' },
              BUY:  { a: 'rgba(16,185,129,0.15)', b: 'rgba(16,185,129,0.25)', c: '#34d399' },
              HOLD: { a: 'rgba(245,158,11,0.12)',  b: 'rgba(245,158,11,0.22)', c: '#fbbf24' },
              SELL: { a: 'rgba(239,68,68,0.12)',   b: 'rgba(239,68,68,0.22)',  c: '#f87171' },
            }
            const col = colors[v]
            return (
              <button
                key={v}
                onClick={() => setSignal(v)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: active ? col.a : 'transparent',
                  border: `1px solid ${active ? col.b : 'rgba(255,255,255,0.08)'}`,
                  color: active ? col.c : '#64748b',
                }}
              >
                {v === 'all' ? 'All' : v}
              </button>
            )
          })}
        </div>

        {/* Sector filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-semibold text-smoke uppercase tracking-[0.1em] w-12 shrink-0">Sector</span>
          {['all', ...sectors].map(v => {
            const active = sector === v
            return (
              <button
                key={v}
                onClick={() => setSector(v)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  color: active ? '#93c5fd' : '#64748b',
                }}
              >
                {v === 'all' ? 'All' : v}
              </button>
            )
          })}
        </div>

        <div className="mt-3 text-xs text-smoke font-mono">
          <span className="text-white font-bold">{filtered.length}</span> / {stocks.length} stocks
        </div>
      </div>

      {/* ── Table ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#0a1221', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { h: '#',       align: 'center' },
                  { h: 'Stock',   align: 'left'   },
                  { h: 'Signal',  align: 'left'   },
                  { h: 'Score',   align: 'center' },
                  { h: 'Checks',  align: 'left'   },
                  { h: 'Sector',  align: 'left'   },
                  { h: 'Price',   align: 'right'  },
                  { h: 'Mkt Cap', align: 'right'  },
                  { h: 'P/E',     align: 'right'  },
                ].map(({ h, align }) => (
                  <th
                    key={h}
                    className={`px-3 py-3 text-[9px] font-semibold text-smoke uppercase tracking-[0.1em] whitespace-nowrap text-${align}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <StockRow key={s.symbol} stock={s} rank={i + 1} sector={sectorFor(s.symbol)} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-smoke text-sm">
                    No stocks match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function StockRow({ stock: s, rank, sector }: { stock: DashboardStock; rank: number; sector: string }) {
  const scoreColor =
    s.score >= 15 ? '#34d399' :
    s.score >= 8  ? '#60a5fa' :
    s.score >= 0  ? '#fbbf24' :
    '#f87171'

  return (
    <Link href={`/view/${s.symbol}`} legacyBehavior>
      <tr
        className="cursor-pointer transition-colors"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.025)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
      >
        <td className="px-3 py-3 text-center font-mono text-[10px] text-smoke">
          {rank <= 3 ? (
            <span className="font-bold" style={{ color: ['#fbbf24','#94a3b8','#cd7c2f'][rank-1] }}>
              #{rank}
            </span>
          ) : (
            <span>#{rank}</span>
          )}
        </td>
        <td className="px-3 py-3">
          <div className="font-mono font-bold text-white text-sm tracking-wide">{s.symbol}</div>
          <div className="text-[10px] text-smoke truncate max-w-[130px] mt-0.5">{s.companyName}</div>
        </td>
        <td className="px-3 py-3">
          <SignalBadge signal={s.signal} size="sm" />
          <div className="text-[9px] text-smoke mt-0.5 uppercase tracking-wide">{s.confidence}</div>
        </td>
        <td className="px-3 py-3 text-center">
          <span className="font-mono text-base font-bold" style={{ color: scoreColor }}>{s.score}</span>
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: s.totalChecks }).map((_, i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: i < s.greens ? '#10b981' : 'rgba(239,68,68,0.45)' }}
              />
            ))}
          </div>
          <div className="text-[9px] text-smoke mt-1 font-mono">{s.greens}G {s.reds}R</div>
        </td>
        <td className="px-3 py-3">
          <span
            className="tag"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {sector}
          </span>
        </td>
        <td className="px-3 py-3 text-right font-mono text-sm font-semibold text-white">{s.price ?? '—'}</td>
        <td className="px-3 py-3 text-right font-mono text-xs text-fog">{s.marketCap ?? '—'}</td>
        <td className="px-3 py-3 text-right font-mono text-xs text-fog">{s.peRatio ?? '—'}</td>
      </tr>
    </Link>
  )
}
