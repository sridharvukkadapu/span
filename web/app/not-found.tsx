import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: '#F5F4F0' }}>
      <div className="text-center max-w-md">
        <div
          className="font-display font-extrabold text-6xl mb-4"
          style={{ color: '#0D0D0B', letterSpacing: '-0.04em' }}
        >
          404
        </div>
        <p className="text-sm mb-8" style={{ color: '#6A6A68' }}>
          Ticker not found or data unavailable. Try a different symbol.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/"
            className="btn btn-primary text-[11px]"
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="btn btn-ghost text-[11px]"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
