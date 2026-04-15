'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import type { DashboardStock, Signal } from '@/lib/types'

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

const SIGNAL_CFG = {
  BUY:  { color: '#34d399', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.28)' },
  HOLD: { color: '#fbbf24', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.25)' },
  SELL: { color: '#f87171', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.25)' },
}

export default function DashboardFilters({ stocks }: { stocks: DashboardStock[] }) {
  const [signal,      setSignal]      = useState<string>('all')
  const [sector,      setSector]      = useState<string>('all')
  const [query,       setQuery]       = useState<string>('')
  const [inputValue,  setInputValue]  = useState<string>('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback((value: string) => {
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQuery(value), 200)
  }, [])

  const sectors = useMemo(
    () => Array.from(new Set(stocks.map(s => sectorFor(s.symbol)))).sort(),
    [stocks],
  )

  const filtered = useMemo(
    () => stocks.filter(s => {
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
        className="rounded-2xl mb-4 overflow-hidden"
        style={{ background: '#08111f', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Search row */}
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="relative">
            <svg
              width="14" height="14"
              viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search ticker or name…"
              aria-label="Search stocks by ticker or company name"
              value={inputValue}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                fontFamily: 'var(--font-body)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.35)'; e.currentTarget.style.background = 'rgba(16,185,129,0.03)' }}
              onBlur={e =>  { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
            />
          </div>
        </div>

        {/* Filter pills row */}
        <div className="px-4 py-3 flex flex-wrap items-center gap-3">
          {/* Signal */}
          <div className="flex items-center gap-1.5">
            {(['BUY', 'HOLD', 'SELL'] as Signal[]).map(v => {
              const active = signal === v
              const cfg = SIGNAL_CFG[v]
              return (
                <button
                  key={v}
                  onClick={() => setSignal(active ? 'all' : v)}
                  aria-label={`Filter by ${v} signal`}
                  aria-pressed={active}
                  className="px-3 py-2.5 rounded-md transition-all min-h-[44px]"
                  style={{
                    background: active ? cfg.bg : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? cfg.border : 'rgba(255,255,255,0.07)'}`,
                    color: active ? cfg.color : '#475569',
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {v}
                </button>
              )
            })}
          </div>

          <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.07)' }} />

          {/* Sector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {sectors.map(v => {
              const active = sector === v
              return (
                <button
                  key={v}
                  onClick={() => setSector(active ? 'all' : v)}
                  aria-label={`Filter by ${v} sector`}
                  aria-pressed={active}
                  className="px-3 py-2.5 rounded-md text-[10px] font-semibold transition-all min-h-[44px]"
                  style={{
                    background: active ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(59,130,246,0.28)' : 'rgba(255,255,255,0.07)'}`,
                    color: active ? '#93c5fd' : '#475569',
                    letterSpacing: '0.06em',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {v}
                </button>
              )
            })}
          </div>

          <div className="ml-auto">
            <span className="num text-xs text-slate-500">
              <span className="text-white font-bold">{filtered.length}</span>/{stocks.length}
            </span>
          </div>
        </div>
      </div>

      {/* ── Data table ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#08111f', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.015)' }}>
                {[
                  { h: '#',       cls: 'w-10 text-center' },
                  { h: 'Ticker',  cls: 'text-left' },
                  { h: 'Signal',  cls: 'text-left' },
                  { h: 'Score',   cls: 'text-center' },
                  { h: 'Checks',  cls: 'text-left' },
                  { h: 'Sector',  cls: 'text-left hidden sm:table-cell' },
                  { h: 'Price',   cls: 'text-right' },
                  { h: 'Mkt Cap', cls: 'text-right hidden lg:table-cell' },
                  { h: 'P/E',     cls: 'text-right hidden lg:table-cell' },
                ].map(({ h, cls }) => (
                  <th
                    key={h}
                    className={`px-3 py-3 text-[9px] font-semibold text-slate-600 uppercase tracking-[0.12em] whitespace-nowrap ${cls}`}
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
                  <td colSpan={9} className="text-center py-20 text-slate-600 text-sm">
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

  const rankColor = rank === 1 ? '#fbbf24' : rank === 2 ? '#94a3b8' : rank === 3 ? '#cd7c2f' : null

  const signalDot: Record<string, string> = {
    BUY: '#10b981', HOLD: '#f59e0b', SELL: '#ef4444',
  }

  return (
    <Link href={`/view/${s.symbol}`} legacyBehavior>
      <tr
        className="cursor-pointer transition-colors group"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
      >
        {/* Rank */}
        <td className="px-3 py-3 text-center">
          <span
            className="num text-[10px] font-bold"
            style={{ color: rankColor ?? '#334155' }}
          >
            {rank}
          </span>
        </td>

        {/* Ticker + name */}
        <td className="px-3 py-3">
          <div className="num font-bold text-white text-sm tracking-wide">{s.symbol}</div>
          <div className="text-[9px] text-slate-600 truncate max-w-[130px] mt-0.5">{s.companyName}</div>
        </td>

        {/* Signal */}
        <td className="px-3 py-3">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: signalDot[s.signal] ?? '#64748b' }}
            />
            <span
              className="num text-[10px] font-bold tracking-wide"
              style={{ color: signalDot[s.signal] ?? '#64748b' }}
            >
              {s.signal}
            </span>
          </div>
          <div className="text-[8px] text-slate-600 uppercase tracking-wide mt-0.5 pl-3">{s.confidence}</div>
        </td>

        {/* Score */}
        <td className="px-3 py-3 text-center">
          <span
            className="num text-base font-black"
            style={{ color: scoreColor, textShadow: `0 0 12px ${scoreColor}50` }}
          >
            {s.score}
          </span>
        </td>

        {/* Checks */}
        <td className="px-3 py-3">
          <div className="flex items-center gap-0.5 mb-1">
            {Array.from({ length: s.totalChecks }).map((_, i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-sm"
                style={{
                  background: i < s.greens
                    ? '#10b981'
                    : i < s.totalChecks - s.reds
                    ? 'rgba(245,158,11,0.5)'
                    : 'rgba(239,68,68,0.45)',
                }}
              />
            ))}
          </div>
          <div className="num text-[9px] text-slate-600">{s.greens}G {s.reds}R</div>
        </td>

        {/* Sector */}
        <td className="px-3 py-3 hidden sm:table-cell">
          <span
            className="tag"
            style={{ background: 'rgba(255,255,255,0.03)', color: '#475569', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {sector}
          </span>
        </td>

        {/* Price */}
        <td className="px-3 py-3 text-right">
          <span className="num text-sm font-bold text-white">{s.price ?? '—'}</span>
        </td>

        {/* Mkt Cap */}
        <td className="px-3 py-3 text-right hidden lg:table-cell">
          <span className="num text-xs text-slate-500">{s.marketCap ?? '—'}</span>
        </td>

        {/* P/E */}
        <td className="px-3 py-3 text-right hidden lg:table-cell">
          <span className="num text-xs text-slate-500">{s.peRatio ?? '—'}</span>
        </td>
      </tr>
    </Link>
  )
}
