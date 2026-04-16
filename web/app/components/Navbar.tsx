'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SearchBar from './SearchBar'

interface NavbarProps {
  symbol?: string
}

export default function Navbar({ symbol }: NavbarProps) {
  const pathname = usePathname()

  const symbolLinks = symbol
    ? [
        { href: `/view/${symbol}`,          label: 'Analysis'  },
        { href: `/backtest/${symbol}`,       label: 'Backtest'  },
        { href: `/basic-analyzer/${symbol}`, label: 'Valuation' },
        { href: `/analyzer/${symbol}`,       label: 'DCF'       },
      ]
    : []

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background:           'rgba(255,255,255,0.95)',
        backdropFilter:       'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom:         '1px solid rgba(0,0,0,0.07)',
      }}
    >
      <div
        className="max-w-[1280px] mx-auto px-6 sm:px-8 flex items-center gap-5"
        style={{ height: '60px' }}
      >
        {/* Brand — editorial serif italic */}
        <Link href="/" className="shrink-0 flex items-center group">
          <span
            style={{
              fontFamily: 'var(--font-serif), "Playfair Display", Georgia, serif',
              fontStyle:  'italic',
              fontWeight: 700,
              fontSize:   '22px',
              color:      '#111827',
              letterSpacing: '-0.5px',
            }}
          >
            <span style={{ color: '#047857' }}>S</span>PAN
          </span>
        </Link>

        {/* Rule */}
        <div className="w-px h-4 shrink-0" style={{ background: 'rgba(0,0,0,0.1)' }} />

        {/* Symbol-scoped links */}
        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none">
          {symbol && symbolLinks.length > 0 && (
            <>
              <span
                style={{
                  fontFamily:    'var(--font-mono), "JetBrains Mono", monospace',
                  fontSize:      '12px',
                  fontWeight:    500,
                  color:         '#047857',
                  letterSpacing: '0.06em',
                  marginRight:   '8px',
                }}
              >
                {symbol}
              </span>
              <div className="w-px h-3 shrink-0 mr-1" style={{ background: 'rgba(0,0,0,0.1)' }} />

              {symbolLinks.map(({ href, label }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all"
                    style={{
                      background:  active ? '#D1FAE5' : 'transparent',
                      color:       active ? '#047857' : '#6B7280',
                      borderBottom: active ? '2px solid #047857' : '2px solid transparent',
                      fontFamily: 'var(--font-sans), Inter, sans-serif',
                    }}
                  >
                    {label}
                  </Link>
                )
              })}
            </>
          )}
        </div>

        {/* Right: Search + Watchlist */}
        <div className="flex items-center gap-2 shrink-0">
          <SearchBar />
          <Link
            href="/watchlist"
            className="flex items-center gap-1.5 text-[13px] font-medium px-3.5 py-1.5 rounded-lg transition-all"
            style={{
              color:      '#047857',
              background: '#D1FAE5',
              border:     '1px solid rgba(4,120,87,0.25)',
              fontFamily: 'var(--font-sans), Inter, sans-serif',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = '#A7F3D0'
              ;(e.currentTarget as HTMLElement).style.borderColor = '#047857'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = '#D1FAE5'
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(4,120,87,0.25)'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            Watchlist
          </Link>
        </div>
      </div>
    </nav>
  )
}
