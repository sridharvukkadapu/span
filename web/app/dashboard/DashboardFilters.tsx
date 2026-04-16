'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import type { DashboardStock, Signal } from '@/lib/types'
import ScoreGauge from '@/app/components/ScoreGauge'
import SignalBadge from '@/app/components/SignalBadge'

/* ── Sector map ─────────────────────────────────────────────── */
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

/* ── Sort types ─────────────────────────────────────────────── */
type SortKey = 'rank' | 'score' | 'signal' | 'ticker' | 'price' | 'marketCap' | 'pe'
type SortDir = 'asc' | 'desc'

function parseNum(s: string | null | undefined): number {
  if (!s) return -Infinity
  const cleaned = s.replace(/[$,%\s]/g, '').toUpperCase()
  const m = cleaned.match(/^([\d.]+)([BKMG]?)$/)
  if (!m) return -Infinity
  const n = parseFloat(m[1])
  const suffix = m[2]
  if (suffix === 'B') return n * 1e9
  if (suffix === 'M') return n * 1e6
  if (suffix === 'K') return n * 1e3
  return n
}

function sortStocks(stocks: DashboardStock[], key: SortKey, dir: SortDir): DashboardStock[] {
  const factor = dir === 'asc' ? 1 : -1
  return [...stocks].sort((a, b) => {
    switch (key) {
      case 'rank':      return factor * (a.rank - b.rank)
      case 'score':     return factor * (a.score - b.score)
      case 'signal': {
        const order = { BUY: 0, HOLD: 1, SELL: 2 }
        return factor * (order[a.signal] - order[b.signal])
      }
      case 'ticker':    return factor * a.symbol.localeCompare(b.symbol)
      case 'price':     return factor * (parseNum(a.price) - parseNum(b.price))
      case 'marketCap': return factor * (parseNum(a.marketCap) - parseNum(b.marketCap))
      case 'pe':        return factor * (parseNum(a.peRatio) - parseNum(b.peRatio))
      default:          return 0
    }
  })
}

/* ── SortIcon ───────────────────────────────────────────────── */
function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
      style={{ opacity: active ? 1 : 0.2, transition: 'opacity 0.15s' }}
    >
      {active && dir === 'asc'  && <path d="M5 2L8 7H2L5 2Z" fill="currentColor" />}
      {active && dir === 'desc' && <path d="M5 8L8 3H2L5 8Z" fill="currentColor" />}
      {!active && <>
        <path d="M5 2L8 5H2L5 2Z" fill="currentColor" opacity={0.35} />
        <path d="M5 8L8 5H2L5 8Z" fill="currentColor" opacity={0.35} />
      </>}
    </svg>
  )
}

/* ── Segment check bar (for dashboard rows) ─────────────────── */
function CheckSegBar({ greens, yellows, reds, total }: { greens: number; yellows: number; reds: number; total: number }) {
  const segs: ('green' | 'yellow' | 'red' | 'empty')[] = []
  for (let i = 0; i < total; i++) {
    if (i < greens)               segs.push('green')
    else if (i < greens + yellows) segs.push('yellow')
    else if (i < greens + yellows + reds) segs.push('red')
    else                          segs.push('empty')
  }
  const colorMap = {
    green:  '#059669',
    yellow: '#D97706',
    red:    '#DC2626',
    empty:  'rgba(0,0,0,0.08)',
  }
  return (
    <div
      className="flex items-center gap-[2px]"
      aria-label={`${greens} pass, ${yellows} warn, ${reds} fail`}
      title={`${greens} green / ${yellows} yellow / ${reds} red out of ${total} checks`}
    >
      {segs.map((s, i) => (
        <span
          key={i}
          style={{
            display: 'block',
            width: 6,
            height: 6,
            borderRadius: 1,
            background: colorMap[s],
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────── */
export default function DashboardFilters({ stocks }: { stocks: DashboardStock[] }) {
  const [signal,     setSignal]     = useState<string>('all')
  const [sector,     setSector]     = useState<string>('all')
  const [query,      setQuery]      = useState<string>('')
  const [inputValue, setInputValue] = useState<string>('')
  const [sortKey,    setSortKey]    = useState<SortKey>('rank')
  const [sortDir,    setSortDir]    = useState<SortDir>('asc')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = useCallback((value: string) => {
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQuery(value), 200)
  }, [])

  const handleSort = useCallback((key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        return prev
      }
      setSortDir(key === 'rank' ? 'asc' : 'desc')
      return key
    })
  }, [])

  const sectors = useMemo(
    () => Array.from(new Set(stocks.map(s => sectorFor(s.symbol)))).sort(),
    [stocks],
  )

  const filtered = useMemo(() => {
    const f = stocks.filter(s => {
      if (signal !== 'all' && s.signal !== signal) return false
      if (sector !== 'all' && sectorFor(s.symbol) !== sector) return false
      if (query) {
        const q = query.toUpperCase()
        return s.symbol.includes(q) || (s.companyName ?? '').toUpperCase().includes(q)
      }
      return true
    })
    return sortStocks(f, sortKey, sortDir)
  }, [stocks, signal, sector, query, sortKey, sortDir])

  const columns: { key: SortKey | null; label: string; cls: string; sortable?: boolean }[] = [
    { key: 'rank',      label: '#',       cls: 'w-10 text-center',                      sortable: true  },
    { key: 'ticker',    label: 'Ticker',  cls: 'text-left',                             sortable: true  },
    { key: 'signal',    label: 'Signal',  cls: 'text-left',                             sortable: true  },
    { key: 'score',     label: 'Score',   cls: 'text-center',                           sortable: true  },
    { key: null,        label: 'Checks',  cls: 'text-left',                             sortable: false },
    { key: null,        label: 'Sector',  cls: 'text-left hidden sm:table-cell',        sortable: false },
    { key: 'price',     label: 'Price',   cls: 'text-right',                            sortable: true  },
    { key: 'marketCap', label: 'Mkt Cap', cls: 'text-right hidden lg:table-cell',       sortable: true  },
    { key: 'pe',        label: 'P/E',     cls: 'text-right hidden lg:table-cell',       sortable: true  },
  ]

  /* ── Signal button colors ── */
  const SIG_BTN: Record<Signal, { active: string; text: string; border: string }> = {
    BUY:  { active: '#D1FAE5', text: '#047857', border: 'rgba(4,120,87,0.35)'   },
    HOLD: { active: '#FEF3C7', text: '#92400E', border: 'rgba(146,64,14,0.35)' },
    SELL: { active: '#FEE2E2', text: '#991B1B', border: 'rgba(153,27,27,0.35)' },
  }

  return (
    <>
      {/* ── Filter bar ── */}
      <div
        className="rounded-xl mb-3 overflow-hidden"
        style={{
          background:  '#FFFFFF',
          border:      '1px solid rgba(0,0,0,0.07)',
          boxShadow:   '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        {/* Search */}
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="relative">
            <svg
              width="12" height="12"
              viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Filter by ticker or name…"
              aria-label="Search stocks by ticker or company name"
              value={inputValue}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-[12px] focus:outline-none transition-all"
              style={{
                background:  'rgba(0,0,0,0.03)',
                border:      '1px solid rgba(0,0,0,0.08)',
                color:       '#111827',
                fontFamily:  'var(--font-sans), Inter, sans-serif',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'rgba(4,120,87,0.45)'
                e.currentTarget.style.background  = 'rgba(4,120,87,0.03)'
                e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(4,120,87,0.08)'
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'
                e.currentTarget.style.background  = 'rgba(0,0,0,0.03)'
                e.currentTarget.style.boxShadow   = 'none'
              }}
            />
          </div>
        </div>

        {/* Pills row */}
        <div className="px-4 py-3 flex flex-wrap items-center gap-2">
          {/* Signal pills */}
          <div className="flex items-center gap-1.5">
            {(['BUY', 'HOLD', 'SELL'] as Signal[]).map(v => {
              const active = signal === v
              const cfg = SIG_BTN[v]
              return (
                <button
                  key={v}
                  onClick={() => setSignal(active ? 'all' : v)}
                  aria-pressed={active}
                  className="px-3 rounded-full transition-all"
                  style={{
                    background:    active ? cfg.active : 'transparent',
                    border:        `1px solid ${active ? cfg.border : 'rgba(0,0,0,0.09)'}`,
                    color:         active ? cfg.text : '#9CA3AF',
                    fontSize:      '10px',
                    fontWeight:    600,
                    letterSpacing: '0.08em',
                    fontFamily:    'var(--font-sans), Inter, sans-serif',
                    textTransform: 'uppercase',
                    minHeight:     '28px',
                  }}
                >
                  {v}
                </button>
              )
            })}
          </div>

          <div className="w-px h-3.5" style={{ background: 'rgba(0,0,0,0.08)' }} />

          {/* Sector pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {sectors.map(v => {
              const active = sector === v
              return (
                <button
                  key={v}
                  onClick={() => setSector(active ? 'all' : v)}
                  aria-pressed={active}
                  className="px-3 rounded-full transition-all"
                  style={{
                    background:    active ? '#111827' : 'transparent',
                    border:        `1px solid ${active ? '#111827' : 'rgba(0,0,0,0.09)'}`,
                    color:         active ? '#FFFFFF'  : '#9CA3AF',
                    fontSize:      '10px',
                    fontWeight:    500,
                    fontFamily:    'var(--font-sans), Inter, sans-serif',
                    minHeight:     '28px',
                  }}
                >
                  {v}
                </button>
              )
            })}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <span
              style={{
                fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
                fontSize:   '11px',
                color:      '#9CA3AF',
              }}
            >
              <span style={{ color: '#111827', fontWeight: 600 }}>{filtered.length}</span>
              /{stocks.length}
            </span>
          </div>
        </div>
      </div>

      {/* ── Data table ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: '#FFFFFF',
          border:     '1px solid rgba(0,0,0,0.07)',
          boxShadow:  '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', background: 'rgba(0,0,0,0.015)' }}>
                {columns.map(({ key, label, cls, sortable }) => {
                  const isActive = !!sortable && key !== null && sortKey === key
                  return (
                    <th
                      key={label}
                      className={`px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap select-none ${cls} ${sortable ? 'cursor-pointer' : ''}`}
                      style={{
                        color:      isActive ? '#111827' : '#9CA3AF',
                        fontFamily: 'var(--font-sans), Inter, sans-serif',
                        transition: 'color 0.15s',
                      }}
                      onClick={() => sortable && key !== null && handleSort(key)}
                      aria-sort={isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        {sortable && key !== null && (
                          <SortIcon active={isActive} dir={isActive ? sortDir : 'asc'} />
                        )}
                      </span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <StockRow key={s.symbol} stock={s} rank={i + 1} sector={sectorFor(s.symbol)} isAlt={i % 2 === 1} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-sm" style={{ color: '#9CA3AF', fontFamily: 'var(--font-sans), Inter, sans-serif' }}>
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

/* ── Stock row ──────────────────────────────────────────────── */
function StockRow({ stock: s, rank, sector, isAlt }: { stock: DashboardStock; rank: number; sector: string; isAlt: boolean }) {
  const yellows = Math.max(0, s.totalChecks - s.greens - s.reds)

  const rankStyle =
    rank === 1 ? { color: '#92400E', fontWeight: 700 } :
    rank === 2 ? { color: '#6B7280', fontWeight: 600 } :
    rank === 3 ? { color: '#9CA3AF', fontWeight: 600 } :
                 { color: '#D1D5DB', fontWeight: 500 }

  return (
    <Link href={`/view/${s.symbol}`} legacyBehavior>
      <tr
        className="cursor-pointer transition-all group"
        style={{
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          background:   isAlt ? '#F9F8F4' : '#FFFFFF',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.background  = '#FFFFFF'
          el.style.boxShadow   = 'inset 2px 0 0 #047857'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.background  = isAlt ? '#F9F8F4' : '#FFFFFF'
          el.style.boxShadow   = ''
        }}
      >
        {/* Rank */}
        <td className="px-3 py-3 text-center">
          <span style={{ fontFamily: 'var(--font-mono), "JetBrains Mono", monospace', fontSize: '11px', ...rankStyle }}>
            {rank}
          </span>
        </td>

        {/* Ticker + name */}
        <td className="px-3 py-3">
          <div
            style={{
              fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
              fontSize:   '12px',
              fontWeight: 600,
              color:      '#111827',
              letterSpacing: '0.04em',
            }}
          >
            {s.symbol}
          </div>
          <div
            className="truncate max-w-[130px] mt-0.5"
            style={{
              fontFamily: 'var(--font-sans), Inter, sans-serif',
              fontSize:   '10px',
              color:      '#9CA3AF',
            }}
          >
            {s.companyName}
          </div>
        </td>

        {/* Signal — editorial tinted badge */}
        <td className="px-3 py-3">
          <SignalBadge signal={s.signal} size="sm" />
          <div
            className="text-[9px] uppercase tracking-wide mt-1"
            style={{ color: '#D1D5DB', fontFamily: 'var(--font-sans), Inter, sans-serif' }}
          >
            {s.confidence}
          </div>
        </td>

        {/* Score — editorial serif number */}
        <td className="px-3 py-3 text-center">
          <ScoreGauge score={s.score} signal={s.signal} size="table" animate={false} />
        </td>

        {/* Checks — segment bars */}
        <td className="px-3 py-3">
          <CheckSegBar greens={s.greens} yellows={yellows} reds={s.reds} total={s.totalChecks} />
        </td>

        {/* Sector */}
        <td className="px-3 py-3 hidden sm:table-cell">
          <span
            style={{
              display:       'inline-block',
              fontFamily:    'var(--font-sans), Inter, sans-serif',
              fontSize:      '10px',
              color:         '#6B7280',
              background:    'rgba(0,0,0,0.04)',
              border:        '1px solid rgba(0,0,0,0.07)',
              borderRadius:  '4px',
              padding:       '1px 6px',
              letterSpacing: '0.02em',
            }}
          >
            {sector}
          </span>
        </td>

        {/* Price */}
        <td className="px-3 py-3 text-right">
          <span
            style={{
              fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
              fontSize:   '12px',
              fontWeight: 600,
              color:      '#111827',
            }}
          >
            {s.price ?? '—'}
          </span>
        </td>

        {/* Mkt Cap */}
        <td className="px-3 py-3 text-right hidden lg:table-cell">
          <span
            style={{
              fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
              fontSize:   '11px',
              color:      '#9CA3AF',
            }}
          >
            {s.marketCap ?? '—'}
          </span>
        </td>

        {/* P/E */}
        <td className="px-3 py-3 text-right hidden lg:table-cell">
          <span
            style={{
              fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
              fontSize:   '11px',
              color:      '#9CA3AF',
            }}
          >
            {s.peRatio ?? '—'}
          </span>
        </td>
      </tr>
    </Link>
  )
}
