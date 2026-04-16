import Link from 'next/link'

export default function Footer() {
  return (
    <footer
      className="mt-16 pt-8 pb-10"
      style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div
            style={{
              fontFamily:    'var(--font-serif), "Playfair Display", Georgia, serif',
              fontStyle:     'italic',
              fontWeight:    700,
              fontSize:      '20px',
              letterSpacing: '-0.5px',
              color:         '#111827',
            }}
          >
            <span style={{ color: '#047857' }}>S</span>PAN
          </div>
          <p
            style={{
              fontFamily: 'var(--font-sans), Inter, sans-serif',
              fontSize:   '11px',
              color:      '#9CA3AF',
            }}
          >
            Fundamental screening &amp; valuation
          </p>
        </div>

        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="transition-colors hover:text-[#111827]"
            style={{
              fontFamily:    'var(--font-sans), Inter, sans-serif',
              fontSize:      '10px',
              fontWeight:    600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color:         '#9CA3AF',
            }}
          >
            Screener
          </Link>
          <Link
            href="/watchlist"
            className="transition-colors hover:text-[#111827]"
            style={{
              fontFamily:    'var(--font-sans), Inter, sans-serif',
              fontSize:      '10px',
              fontWeight:    600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color:         '#9CA3AF',
            }}
          >
            Watchlist
          </Link>
        </div>
      </div>

      <div
        className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-2"
        style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px' }}
      >
        <p
          style={{
            fontFamily: 'var(--font-sans), Inter, sans-serif',
            fontSize:   '10px',
            color:      '#9CA3AF',
          }}
        >
          For educational purposes only. Not financial advice.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-sans), Inter, sans-serif',
            fontSize:   '10px',
            color:      '#D1D5DB',
          }}
        >
          Data: Polygon.io &amp; Financial Modeling Prep
        </p>
      </div>
    </footer>
  )
}
