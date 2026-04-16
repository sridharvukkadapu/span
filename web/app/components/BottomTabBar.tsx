'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  {
    href:  '/',
    label: 'Home',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    exact: true,
  },
  {
    href:  '/watchlist',
    label: 'Watchlist',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    exact: false,
  },
  {
    href:   null as string | null,
    label:  'Search',
    search: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    exact: false,
  },
]

export default function BottomTabBar() {
  const pathname = usePathname()

  function isActive(href: string | null, exact: boolean): boolean {
    if (!href) return false
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  function handleSearch() {
    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
    window.dispatchEvent(event)
    const input = document.querySelector<HTMLInputElement>('input[name="q"]')
    if (input) { input.focus(); input.select() }
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 sm:hidden"
      aria-label="Bottom navigation"
      style={{
        background:           'rgba(255,255,255,0.97)',
        backdropFilter:       'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop:            '1px solid rgba(0,0,0,0.07)',
        paddingBottom:        'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-stretch h-[52px]">
        {TABS.map(tab => {
          const active = isActive(tab.href, tab.exact)

          if (tab.search) {
            return (
              <button
                key="search"
                onClick={handleSearch}
                className="flex-1 flex flex-col items-center justify-center gap-0.5"
                aria-label="Search"
                style={{ color: '#9CA3AF', background: 'none', border: 'none' }}
              >
                <span style={{ color: '#9CA3AF' }}>{tab.icon}</span>
                <span
                  style={{
                    fontFamily:    'var(--font-sans), Inter, sans-serif',
                    fontSize:      '9px',
                    fontWeight:    500,
                    letterSpacing: '0.04em',
                    color:         '#9CA3AF',
                  }}
                >
                  {tab.label}
                </span>
              </button>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href!}
              className="flex-1 flex flex-col items-center justify-center gap-0.5"
              aria-current={active ? 'page' : undefined}
            >
              <span style={{ color: active ? '#047857' : '#9CA3AF' }}>{tab.icon}</span>
              <span
                style={{
                  fontFamily:    'var(--font-sans), Inter, sans-serif',
                  fontSize:      '9px',
                  fontWeight:    active ? 600 : 500,
                  letterSpacing: '0.04em',
                  color:         active ? '#047857' : '#9CA3AF',
                }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
