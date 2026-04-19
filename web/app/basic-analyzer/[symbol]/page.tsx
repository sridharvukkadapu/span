import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { api } from '@/lib/api'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import BasicAnalyzerClient from './BasicAnalyzerClient'
import RefreshButton from '../../components/RefreshButton'

export const revalidate = 60

interface Props { params: { symbol: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const symbol = params.symbol.toUpperCase()
  const data = await api.basicAnalyzer(symbol).catch(() => null)
  const name = data?.companyName ?? symbol
  return {
    title: `${symbol} Quick Valuation`,
    description: `${name} simplified forward valuation. Adjust revenue growth, profit margin, and P/E to estimate target price.`,
  }
}

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
          className="relative overflow-hidden rounded-xl animate-fade-up"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(13,13,11,0.09)',
            boxShadow: '0 1px 4px rgba(13,13,11,0.04)',
          }}
        >
          <div className="h-[3px]" style={{ background: '#0D0D0B' }} />
          <div className="px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="label-xs mb-1.5" style={{ color: '#9A9A98' }}>{symbol} · Quick Valuation</div>
              <h1
                className="font-display font-bold text-2xl leading-tight"
                style={{ color: '#0D0D0B', letterSpacing: '-0.02em' }}
              >
                {data.companyName ?? symbol}
              </h1>
            </div>
            <div className="flex items-center gap-8">
              <div>
                <div className="label-xs mb-1" style={{ color: '#9A9A98' }}>Current Price</div>
                <div className="num text-3xl font-bold" style={{ color: '#0D0D0B' }}>{data.currentPriceFormatted ?? '—'}</div>
              </div>
              <div className="text-sm" style={{ color: '#6A6A68' }}>
                <div>Revenue (TTM): <span className="num font-semibold" style={{ color: '#0D0D0B' }}>{data.ttmRevenueFormatted ?? '—'}</span></div>
                <div>Shares: <span className="num font-semibold" style={{ color: '#0D0D0B' }}>{data.sharesFormatted ?? '—'}</span></div>
              </div>
              <RefreshButton symbol={symbol} />
            </div>
          </div>
        </div>

        <BasicAnalyzerClient data={data} />

        {/* ── Disclaimer ── */}
        <div
          className="rounded-lg px-5 py-4 text-xs leading-relaxed"
          style={{ background: 'rgba(13,13,11,0.03)', border: '1px solid rgba(13,13,11,0.08)' }}
        >
          <span className="font-bold" style={{ color: '#6A6A68' }}>Disclaimer: </span>
          <span style={{ color: '#9A9A98' }}>Educational purposes only. Stock price projections are based on simplified forward valuation. Not financial advice.</span>
        </div>

        <Footer />
      </div>
    </div>
  )
}
