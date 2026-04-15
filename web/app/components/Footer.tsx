import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-20 pt-8 pb-10 border-t border-white/[0.05]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        {/* Brand */}
        <div className="space-y-1">
          <div className="text-gradient font-display font-bold text-xl tracking-[4px]">SPAN</div>
          <p className="text-[11px] text-smoke">Fundamental screening &amp; valuation</p>
        </div>

        {/* Links */}
        <div className="flex items-center gap-5 text-[11px] text-fog">
          <Link href="/dashboard" className="hover:text-mist transition-colors">Dashboard</Link>
          <Link href="/watchlist"  className="hover:text-mist transition-colors">Watchlist</Link>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-[10px] text-smoke">
          For educational purposes only. Not financial advice.
        </p>
        <p className="text-[10px] text-smoke/60">
          Data: Polygon.io &amp; Financial Modeling Prep
        </p>
      </div>
    </footer>
  )
}
