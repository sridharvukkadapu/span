import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="text-center max-w-md">
        <div className="text-6xl font-black text-gradient mb-4">404</div>
        <p className="text-slate-400 text-sm mb-8">
          Ticker not found or data unavailable. Try a different symbol.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
            Home
          </Link>
          <Link href="/dashboard" className="px-5 py-2.5 rounded-xl bg-surface border border-white/[0.1] hover:border-white/20 text-white text-sm font-semibold transition-all">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
