import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import BasicAnalyzerClient from './BasicAnalyzerClient'

export const revalidate = 60

interface Props { params: { symbol: string } }

export default async function BasicAnalyzerPage({ params }: Props) {
  const symbol = params.symbol.toUpperCase()
  const data = await api.basicAnalyzer(symbol).catch(() => null)
  if (!data) notFound()

  return (
    <div className="min-h-screen relative z-10">
      <Navbar symbol={symbol} />

      <div className="max-w-4xl mx-auto px-5 py-8 space-y-4">

        {/* ── Hero ── */}
        <div
          className="relative overflow-hidden rounded-2xl text-center px-6 py-12 animate-fade-up"
          style={{
            background: 'linear-gradient(180deg, #0d1628 0%, #0a1221 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] opacity-15"
            style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.3) 0%, transparent 65%)' }}
          />
          <div className="relative z-10">
            <div
              className="inline-block font-mono text-[10px] font-bold tracking-[0.15em] uppercase mb-2 px-3 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {symbol} · Basic Analyzer
            </div>
            <h1 className="text-2xl font-display text-white mt-1">{data.companyName ?? symbol}</h1>
            <div className="font-mono text-4xl font-bold text-white mt-4 tabular-nums">{data.currentPriceFormatted ?? '—'}</div>
            <div className="flex justify-center gap-6 mt-3 text-sm text-fog">
              <span>Revenue (TTM): <span className="font-mono font-semibold text-mist">{data.ttmRevenueFormatted ?? '—'}</span></span>
              <span>Shares: <span className="font-mono font-semibold text-mist">{data.sharesFormatted ?? '—'}</span></span>
            </div>
          </div>
        </div>

        <BasicAnalyzerClient data={data} />

        {/* ── Disclaimer ── */}
        <div
          className="rounded-xl px-5 py-4 text-xs text-fog leading-relaxed"
          style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}
        >
          <span className="font-semibold text-amber-500">Disclaimer: </span>
          Educational purposes only. Stock price projections are based on simplified forward valuation. Not financial advice.
        </div>

        <Footer />
      </div>
    </div>
  )
}
