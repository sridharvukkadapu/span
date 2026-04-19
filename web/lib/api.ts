import type {
  ScreenerResult,
  BacktestResult,
  AnalyzerData,
  BasicAnalyzerData,
  DashboardResponse,
} from './types'

// In the browser, Next.js rewrites /api/* → backend.
// On the server (SSR), we talk directly to the backend.
function base() {
  if (typeof window !== 'undefined') return ''
  return process.env.API_BASE_URL ?? 'http://localhost:8080'
}

async function get<T>(path: string): Promise<T> {
  const url = `${base()}${path}`
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  screener: (symbol: string) =>
    get<ScreenerResult>(`/api/v1/tickers/${symbol.toUpperCase()}/recommendation`),

  backtest: (symbol: string) =>
    get<BacktestResult>(`/api/v1/tickers/${symbol.toUpperCase()}/backtest`),

  analyzer: (symbol: string) =>
    get<AnalyzerData>(`/api/v1/tickers/${symbol.toUpperCase()}/analyzer`),

  basicAnalyzer: (symbol: string) =>
    get<BasicAnalyzerData>(`/api/v1/tickers/${symbol.toUpperCase()}/basic-analyzer`),

  dashboard: (limit = 50) =>
    get<DashboardResponse>(`/api/v1/dashboard?limit=${limit}`),

  cache: {
    evict: (ticker: string) =>
      fetch(`/api/v1/cache/${ticker.toUpperCase()}`, { method: 'DELETE' }).then(r => r.json()),
  },

  watchlist: {
    list: () => get<string[]>('/api/v1/watchlist'),
    add: (ticker: string) =>
      fetch(`/api/v1/watchlist/${ticker.toUpperCase()}`, { method: 'POST' }).then(r => r.json()),
    remove: (ticker: string) =>
      fetch(`/api/v1/watchlist/${ticker.toUpperCase()}`, { method: 'DELETE' }).then(r => r.json()),
    isSaved: (ticker: string) =>
      fetch(`/api/v1/watchlist/${ticker.toUpperCase()}/saved`).then(r => r.json()) as Promise<{ saved: boolean }>,
  },
}
