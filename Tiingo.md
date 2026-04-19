# Tiingo API — Integration Reference

> **Status:** Research complete. Not yet integrated. Current stack uses FMP + Massive (Polygon.io).
> **Decision context:** Evaluating Tiingo as a price-data source for extended backtest history (30+ years) and potential fundamentals consolidation.

---

## Current Data Architecture

```
Span Backend (Spring Boot / Kotlin)
  ├── FmpApiClient       → Financial Modeling Prep
  │   └── profile, income statements, balance sheets, cash flows, historical prices
  └── MassiveApiClient   → Massive.com (Polygon.io wrapper)
      └── ticker details, OHLCV bars, quarterly financials, SMA, RSI
```

Both providers are composed via `CompositeMarketDataProvider` with automatic fallback logic.

---

## Tiingo Overview

| Item | Value |
|------|-------|
| Base URL | `https://api.tiingo.com` |
| Auth | `Authorization: Token {YOUR_API_TOKEN}` header |
| Token location | https://api.tiingo.com/account/api/token |
| Coverage | 65,000+ US stocks, ETFs, mutual funds |
| History depth | 30+ years of price data |
| Fundamentals coverage | ~5,500 equities (paid only) |

---

## Free Tier Limits

| Limit | Value |
|-------|-------|
| Requests/minute | 5 |
| Requests/day | 500 |
| Symbols/hour | 50 |
| Price data | ✅ Included |
| Historical prices | ✅ Included (30+ years) |
| Fundamentals | ❌ **Paid only** |
| News | ❌ Paid only |

**Key constraint:** Fundamentals (revenue, net income, balance sheet, shares outstanding) require a paid plan. Free tier is price/technical only.

---

## Endpoints

### 1. Ticker Metadata

```
GET https://api.tiingo.com/tiingo/daily/{ticker}
Authorization: Token {TOKEN}
```

**Response fields:**

```json
{
  "ticker":       "AAPL",
  "name":         "Apple Inc",
  "description":  "Apple Inc. designs, manufactures...",
  "startDate":    "1980-12-12",
  "endDate":      "2025-04-17",
  "exchangeCode": "NASDAQ",
  "currency":     "USD"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `ticker` | string | Symbol |
| `name` | string | Company name |
| `description` | string | Company description text |
| `startDate` | string | First available trading date (YYYY-MM-DD) |
| `endDate` | string | Last available trading date |
| `exchangeCode` | string | Exchange (NASDAQ, NYSE, etc.) |
| `currency` | string | Usually "USD" |

---

### 2. Historical Daily Prices

```
GET https://api.tiingo.com/tiingo/daily/{ticker}/prices
    ?startDate=2015-01-01
    &endDate=2025-04-17
    &resampleFreq=daily
    &columns=date,adjClose,adjVolume,close,volume
Authorization: Token {TOKEN}
```

**Response fields (array):**

```json
[
  {
    "date":        "2025-04-17T00:00:00+00:00",
    "close":       172.35,
    "high":        174.20,
    "low":         171.50,
    "open":        172.00,
    "volume":      54321000,
    "adjClose":    172.35,
    "adjHigh":     174.20,
    "adjLow":      171.50,
    "adjOpen":     172.00,
    "adjVolume":   54321000,
    "divCash":     0.0,
    "splitFactor": 1.0
  }
]
```

| Field | Type | Notes |
|-------|------|-------|
| `date` | ISO 8601 string | Include timezone offset |
| `close` / `open` / `high` / `low` | float | Unadjusted prices |
| `adjClose` / `adjOpen` / `adjHigh` / `adjLow` | float | Split/dividend adjusted — use these for backtesting |
| `volume` / `adjVolume` | int | Daily volume |
| `divCash` | float | Dividend cash per share (on ex-div date) |
| `splitFactor` | float | Split multiplier (1.0 on non-split days) |

**Query parameters:**

| Param | Values | Notes |
|-------|--------|-------|
| `startDate` | YYYY-MM-DD | Inclusive |
| `endDate` | YYYY-MM-DD | Inclusive |
| `resampleFreq` | `daily`, `weekly`, `monthly`, `annually` | Default: daily |
| `columns` | comma-separated field names | Reduces response size |

---

### 3. Fundamentals — Statements (Paid Only)

```
GET https://api.tiingo.com/tiingo/fundamentals/{ticker}/statements
    ?startDate=2020-01-01
    &asReported=false
Authorization: Token {TOKEN}
```

**Response structure:**

```json
[
  {
    "date":    "2024-09-28",
    "year":    2024,
    "quarter": 4,
    "statementData": {
      "incomeStatement": [
        { "dataCode": "revenue",        "value": 94930000000 },
        { "dataCode": "grossProfit",    "value": 43354000000 },
        { "dataCode": "operatingIncome","value": 29590000000 },
        { "dataCode": "netIncome",      "value": 14736000000 },
        { "dataCode": "eps",            "value": 0.97 },
        { "dataCode": "epsDiluted",     "value": 0.97 }
      ],
      "balanceSheet": [
        { "dataCode": "cashAndEq",      "value": 29943000000 },
        { "dataCode": "totalAssets",    "value": 364980000000 },
        { "dataCode": "totalLiab",      "value": 308030000000 },
        { "dataCode": "totalDebt",      "value": 97341000000 },
        { "dataCode": "sharesBasic",    "value": 15204137000 }
      ],
      "cashFlowStatement": [
        { "dataCode": "freeCashFlow",   "value": 26808000000 },
        { "dataCode": "operatingCF",    "value": 26808000000 }
      ]
    }
  }
]
```

**Important fields:**

| dataCode | Statement | Span usage |
|----------|-----------|-----------|
| `revenue` | income | TTM revenue, growth calc |
| `netIncome` | income | Net profit margin |
| `grossProfit` | income | Gross margin |
| `eps` / `epsDiluted` | income | EPS checks |
| `cashAndEq` | balance | Cash-to-debt ratio |
| `totalDebt` | balance | Cash-to-debt ratio |
| `sharesBasic` | balance | Shares outstanding |
| `freeCashFlow` | cash flow | FCF margin |

**Quarter field meaning:**

| `quarter` value | Meaning |
|-----------------|---------|
| 0 | Annual / full-year report |
| 1–4 | Quarterly report |

**`asReported` parameter:**
- `false` (default) — normalized/revised values (recommended)
- `true` — original SEC filing values before restatements

---

### 4. Fundamentals — Daily Metrics (Paid Only)

```
GET https://api.tiingo.com/tiingo/fundamentals/{ticker}/daily
    ?startDate=2024-01-01
Authorization: Token {TOKEN}
```

Returns daily-refreshed derived metrics (P/E, P/S, market cap, etc.).

---

## Quirks & Gotchas

1. **Fundamentals are paid-only** — The free tier returns a 403 or empty array for `/fundamentals/`. Requires a paid Power plan (~$10/mo).

2. **Date format in price responses** — Dates come back as full ISO 8601 with timezone offset (`2025-04-17T00:00:00+00:00`), not plain `YYYY-MM-DD`. Parse accordingly.

3. **Use `adjClose` for backtesting** — Raw `close` is not split/dividend adjusted. Always use `adjClose` for any historical return calculations.

4. **Fundamentals are in list-column format** — Each financial metric is a `{ dataCode, value }` object in an array, not a flat JSON object. Requires lookup by `dataCode`.

5. **Rate limiting on free tier** — 5 req/min and 500 req/day means a full dashboard scan of 100 stocks would exhaust the daily budget with ~6 API calls per stock. Need 1.2s+ delay between requests.

6. **Symbol format** — Standard uppercase symbols (AAPL, GOOGL). No BRK.A-style dots; use GOOGL not GOOG. Test class-share symbols before assuming availability.

7. **`quarter == 0` is annual data** — Not an error; it represents the full fiscal year report.

8. **History starts 1980** — Useful for long-window backtests (10+ years). Massive/Polygon typically only has ~10–15 years for most tickers.

---

## Integration Plan

### Option A — Price source only (free)

Replace or back up Massive for historical OHLCV data. Useful for extending backtest history to 10+ years.

```
Span Backend
  ├── TiingoApiClient    → adjClose historical prices (30yr depth)
  ├── FmpApiClient       → fundamentals (income, balance sheet, cash flow)
  └── MassiveApiClient   → technicals (SMA, RSI), real-time price
```

**New files needed:**
- `src/.../client/TiingoApiClient.kt`
- `src/.../client/dto/TiingoDtos.kt`
- `src/.../config/TiingoApiProperties.kt`
- `src/.../provider/TiingoMarketDataProvider.kt`
- Add `TIINGO_API_KEY` to `application.properties` and Vercel env vars

**Mapping Tiingo → Span's `HistoricalBar`:**

```kotlin
TiingoPricePoint(adjClose, adjOpen, adjHigh, adjLow, adjVolume, date)
  → HistoricalBar(date, open=adjOpen, high=adjHigh, low=adjLow, close=adjClose, volume=adjVolume)
```

### Option B — Consolidate to Tiingo paid (replaces FMP)

Tiingo Power plan (~$10/mo) provides both prices and fundamentals from a single source.

**Fundamentals mapping Tiingo → Span domain:**

| Span field | Tiingo `dataCode` | Statement |
|-----------|-------------------|-----------|
| `revenue` | `revenue` | incomeStatement |
| `netIncome` | `netIncome` | incomeStatement |
| `grossProfit` | `grossProfit` | incomeStatement |
| `eps` | `epsDiluted` | incomeStatement |
| `cashAndCashEquivalents` | `cashAndEq` | balanceSheet |
| `totalDebt` | `totalDebt` | balanceSheet |
| `sharesOutstanding` | `sharesBasic` | balanceSheet |
| `freeCashFlow` | `freeCashFlow` | cashFlowStatement |
| `operatingCashFlow` | `operatingCF` | cashFlowStatement |

---

## Environment Variables

```properties
# application.properties
tiingo.api.key=${TIINGO_API_KEY:}
tiingo.api.base-url=https://api.tiingo.com
```

Vercel env vars (add via `vercel env add`):
- `TIINGO_API_KEY` — from https://api.tiingo.com/account/api/token

---

## Comparison: Tiingo vs Current Stack

| Capability | FMP (current) | Massive/Polygon (current) | Tiingo (proposed) |
|-----------|--------------|--------------------------|-------------------|
| Price history depth | ~20 years | ~10–15 years | **30+ years** |
| Real-time price | ✅ | ✅ | End-of-day only |
| Income statement | ✅ | ✅ (limited) | ✅ (paid) |
| Balance sheet | ✅ | ✅ (limited) | ✅ (paid) |
| Cash flow | ✅ | ✅ (limited) | ✅ (paid) |
| Technicals (SMA/RSI) | ❌ | ✅ | ❌ |
| Free tier fundamentals | ✅ (limited) | ❌ | ❌ |
| Rate limit (free) | Varies | 5/61s | 5/min, 500/day |
| Cost | Free–$29/mo | Paid (via Massive) | Free–$10/mo |

**Recommendation:** Integrate Tiingo as an additional historical price provider (Option A) to support 10-year backtests without replacing the current fundamentals stack.
