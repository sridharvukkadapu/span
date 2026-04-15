export type Signal = 'BUY' | 'SELL' | 'HOLD'
export type CheckLight = 'GREEN' | 'YELLOW' | 'RED'

export interface CheckResult {
  name: string
  light: CheckLight
  detail: string
}

export interface Overview {
  priceFormatted: string | null
  marketCapFormatted: string | null
  epsTtmFormatted: string | null
  peRatioFormatted: string | null
  priceToSalesFormatted: string | null
  sharesOutstandingFormatted: string | null
}

export interface Margins {
  grossMargin: number | null
  grossMarginFormatted: string | null
  operatingMarginFormatted: string | null
  profitMarginFormatted: string | null
  fcfMarginFormatted: string | null
}

export interface RevenueYear {
  fiscalYear: string
  revenueFormatted: string
}

export interface RevenueAnalysis {
  revenueTtm: number | null
  revenueTtmFormatted: string | null
  netIncomeTtmFormatted: string | null
  revenueGrowthFormatted: string | null
  revenueYears: RevenueYear[]
}

export interface BalanceSheet {
  cashFormatted: string | null
  longTermDebtFormatted: string | null
  totalDebtFormatted: string | null
  cashToDebtFormatted: string | null
}

export interface Technicals {
  sma50Formatted: string | null
  rsi14Formatted: string | null
  priceVsSma50: string | null
}

export interface ProjectionYear {
  year: string
  revenueFormatted: string
  netIncomeFormatted: string
  epsFormatted: string
  priceFormatted: string
}

export interface ProjectionAssumptions {
  baseGrowthFormatted: string
  decayFormatted: string
  marginFormatted: string
  peFormatted: string
  note: string
}

export interface Projection {
  years: ProjectionYear[]
  assumptions: ProjectionAssumptions
}

export interface ScreenerResult {
  symbol: string
  companyName: string | null
  signal: Signal
  confidence: string
  overview: Overview
  margins: Margins
  revenueAnalysis: RevenueAnalysis
  balanceSheet: BalanceSheet
  technicals: Technicals | null
  checks: CheckResult[]
  projection: Projection | null
}

// ---- Backtest ----

export interface EquityPoint {
  date: string
  strategyValue: number
  buyAndHoldValue: number
}

export interface SignalSnapshot {
  date: string
  priceFormatted: string
  priceChange: number | null
  priceChangePctFormatted: string | null
  signal: Signal
  checksSummary: string
  action: string
}

export interface BacktestTrade {
  type: 'BUY' | 'SELL'
  date: string
  priceFormatted: string
  checksSummary: string
  tradeReturn: number | null
  tradeReturnFormatted: string | null
}

export interface BacktestResult {
  symbol: string
  companyName: string | null
  periodStart: string
  periodEnd: string
  initialInvestment: number
  strategyFinalFormatted: string
  buyAndHoldFinalFormatted: string
  strategyReturnFormatted: string
  buyAndHoldReturnFormatted: string
  strategyReturn: number
  buyAndHoldReturn: number
  outperformance: number
  outperformanceFormatted: string
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRateFormatted: string | null
  signalHistory: SignalSnapshot[]
  trades: BacktestTrade[]
  equityCurve: EquityPoint[]
}

// ---- Analyzer ----

export interface ScenarioDefaults {
  revenueGrowthPct: number
  profitMarginPct: number
  fcfMarginPct: number
  peMultiple: number
  pfcfMultiple: number
  years: number
  desiredReturnPct: number
}

export interface AnalyzerData {
  symbol: string
  companyName: string | null
  currentPrice: number | null
  currentPriceFormatted: string | null
  marketCap: number | null
  marketCapFormatted: string | null
  sharesOutstanding: number | null
  sharesFormatted: string | null
  ttmRevenue: number | null
  ttmRevenueFormatted: string | null
  ttmNetIncomeFormatted: string | null
  ttmFcfFormatted: string | null
  revenueGrowthFormatted: string | null
  profitMarginFormatted: string | null
  fcfMarginFormatted: string | null
  roicFormatted: string | null
  currentPEFormatted: string | null
  currentPFCFFormatted: string | null
  scenarios: ScenarioDefaults[]
  turnaroundMode: boolean
}

// ---- Basic Analyzer ----

export interface BasicScenarioDefaults {
  growthRatePct: number
  netProfitPct: number
  peMultiple: number
  dilutionPctPerYear: number
  years: number
}

export interface BasicAnalyzerData {
  symbol: string
  companyName: string | null
  currentPrice: number | null
  currentPriceFormatted: string | null
  ttmRevenue: number | null
  ttmRevenueFormatted: string | null
  sharesOutstanding: number | null
  sharesFormatted: string | null
  reasonable: BasicScenarioDefaults
  greatExecution: BasicScenarioDefaults
}

// ---- Dashboard ----

export interface DashboardStock {
  rank: number
  symbol: string
  companyName: string | null
  signal: Signal
  confidence: string
  score: number
  greens: number
  reds: number
  totalChecks: number
  price: string | null
  marketCap: string | null
  peRatio: string | null
  grossMargin: string | null
  profitMargin: string | null
  revenueGrowth: string | null
  cashToDebt: string | null
  scannedAt: string
}

export interface DashboardStatus {
  universeSize: number
  scannedCount: number
  scansCompleted: number
  scansFailed: number
  nextTicker: string | null
}

export interface DashboardResponse {
  status: DashboardStatus
  stocks: DashboardStock[]
}
