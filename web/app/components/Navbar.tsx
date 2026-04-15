'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavbarProps {
  symbol?: string
}

export default function Navbar({ symbol }: NavbarProps) {
  const pathname = usePathname()

  const primaryLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/watchlist',  label: 'Watchlist' },
  ]

  const symbolLinks = symbol
    ? [
        { href: `/view/${symbol}`,           label: 'Screener' },
        { href: `/backtest/${symbol}`,        label: 'Backtest' },
        { href: `/basic-analyzer/${symbol}`,  label: 'Basic' },
        { href: `/analyzer/${symbol}`,        label: 'Advanced' },
      ]
    : []

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#03070f]/90 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-5">

        {/* Brand */}
        <Link href="/" className="shrink-0 flex items-center gap-2 group">
          <span className="text-gradient font-display font-bold text-lg tracking-[3px]">SPAN</span>
        </Link>

        {/* Divider */}
        <div className="w-px h-4 bg-white/[0.08] shrink-0" />

        {/* Links */}
        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none">
          {primaryLinks.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-fog hover:text-mist hover:bg-white/[0.04]'
                }`}
              >
                {label}
              </Link>
            )
          })}

          {symbol && symbolLinks.length > 0 && (
            <>
              {/* Symbol separator */}
              <div className="flex items-center gap-1 mx-2">
                <div className="w-px h-3 bg-white/[0.08]" />
                <span className="font-mono text-[10px] font-bold text-emerald-500/70 tracking-widest">{symbol}</span>
                <div className="w-px h-3 bg-white/[0.08]" />
              </div>

              {symbolLinks.map(({ href, label }) => {
                const active = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                      active
                        ? 'bg-sapphire-dim text-blue-400 border border-sapphire/20'
                        : 'text-fog hover:text-mist hover:bg-white/[0.04]'
                    }`}
                    style={active ? {
                      background: 'rgba(59,130,246,0.10)',
                      borderColor: 'rgba(59,130,246,0.20)',
                    } : {}}
                  >
                    {label}
                  </Link>
                )
              })}
            </>
          )}
        </div>

        {/* Search */}
        <SearchInput />
      </div>
    </nav>
  )
}

function SearchInput() {
  return (
    <form
      className="flex items-center gap-2 shrink-0"
      onSubmit={e => {
        e.preventDefault()
        const input = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value.trim().toUpperCase()
        if (input) window.location.href = `/view/${input}`
      }}
    >
      <div className="relative">
        <input
          name="q"
          type="text"
          placeholder="TICKER"
          maxLength={6}
          className="w-24 pl-3 pr-3 py-1.5 rounded-md bg-surface border border-white/[0.08] text-white text-xs font-mono font-bold tracking-widest uppercase placeholder:text-smoke placeholder:normal-case placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:border-emerald-500/40 focus:bg-surface-2 transition-all"
        />
      </div>
      <button
        type="submit"
        className="px-3 py-1.5 rounded-md bg-emerald-500/12 border border-emerald-500/22 text-emerald-400 text-xs font-semibold transition-all hover:bg-emerald-500/20 hover:border-emerald-500/35 active:scale-95"
        style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.22)' }}
      >
        Go
      </button>
    </form>
  )
}
