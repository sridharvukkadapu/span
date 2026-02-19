#!/usr/bin/env python3
"""Generate Span Screener Algorithm & API Documentation PDF."""

from fpdf import FPDF

class Doc(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, "Span Screener - Algorithm & API Documentation", align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(200, 200, 200)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def section(self, title):
        self.set_font("Helvetica", "B", 15)
        self.set_text_color(0, 51, 102)
        self.cell(0, 12, title, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(0, 51, 102)
        self.line(10, self.get_y(), 80, self.get_y())
        self.ln(5)

    def sub(self, title):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(30, 64, 120)
        self.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def body(self, text):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.5, text)
        self.ln(3)

    def code(self, text):
        self.set_font("Courier", "", 9)
        self.set_fill_color(245, 245, 245)
        self.set_text_color(50, 50, 50)
        self.multi_cell(0, 5, text, fill=True)
        self.ln(3)

    def bullet(self, text, indent=12):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        self.cell(indent, 5.5, "-", new_x="END")
        self.multi_cell(0, 5.5, text)
        self.ln(1)

    def row(self, cols, widths, bold=False):
        style = "B" if bold else ""
        self.set_font("Helvetica", style, 9)
        h = 7
        if bold:
            self.set_fill_color(0, 51, 102)
            self.set_text_color(255, 255, 255)
        else:
            self.set_fill_color(255, 255, 255)
            self.set_text_color(30, 30, 30)
        for col, w in zip(cols, widths):
            self.cell(w, h, col, border=1, fill=bold, new_x="END")
        self.ln(h)


pdf = Doc()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=20)

# ==================== TITLE PAGE ====================
pdf.add_page()
pdf.ln(40)
pdf.set_font("Helvetica", "B", 32)
pdf.set_text_color(0, 51, 102)
pdf.cell(0, 16, "Span Stock Screener", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(4)
pdf.set_font("Helvetica", "", 16)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 10, "Algorithm & Massive API Documentation", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(20)

# Divider
pdf.set_draw_color(0, 51, 102)
pdf.line(60, pdf.get_y(), 150, pdf.get_y())
pdf.ln(20)

pdf.set_font("Helvetica", "", 11)
pdf.set_text_color(80, 80, 80)
info = [
    ("Version", "1.0"),
    ("Date", "February 2026"),
    ("Stack", "Kotlin 2.2 / Spring Boot 4.0 / Massive.com API"),
    ("Repository", "github.com/sridharvukkadapu/span"),
    ("Live URL", "span-n9xs.onrender.com"),
]
for label, val_ in info:
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(40, 8, label + ":", new_x="END")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 8, val_, new_x="LMARGIN", new_y="NEXT")

# ==================== TABLE OF CONTENTS ====================
pdf.add_page()
pdf.section("Table of Contents")
toc = [
    "1. How It Works (High-Level Flow)",
    "2. Massive.com API Calls (5 Total)",
    "3. Data Extraction - What Fields Are Used",
    "4. Computed Metrics & Formulas",
    "5. The 5 Screening Checks (Algorithm)",
    "6. Signal Determination (BUY / SELL / HOLD)",
    "7. Confidence Level",
    "8. Complete Example: AAPL",
]
for item in toc:
    pdf.bullet(item)
pdf.ln(4)

# ==================== 1. HIGH LEVEL FLOW ====================
pdf.add_page()
pdf.section("1. How It Works")
pdf.body(
    "When a user requests a recommendation for a ticker symbol (e.g., AAPL), "
    "the system performs the following steps:"
)
steps = [
    "1. Make 5 API calls to Massive.com to fetch real-time market data",
    "2. Extract raw financial fields from the API responses",
    "3. Compute derived metrics (margins, P/E, P/S, revenue growth, etc.)",
    "4. Run 5 independent screening checks - each produces GREEN, YELLOW, or RED",
    "5. Count the greens and reds to determine BUY, SELL, or HOLD",
    "6. Assess confidence level based on how unanimous the checks are",
    "7. Return the full analysis as JSON (API) or a formatted HTML page (browser)",
]
for s in steps:
    pdf.bullet(s)

pdf.ln(4)
pdf.sub("Endpoints")
pdf.code(
    "JSON API:  GET /api/v1/tickers/{symbol}/recommendation\n"
    "HTML View: GET /view/{symbol}"
)

pdf.sub("Caching")
pdf.body(
    "All API responses are cached in-memory (ConcurrentHashMap) with a 5-minute TTL. "
    "The first request for a ticker takes 2-5 seconds. Subsequent requests within "
    "5 minutes return instantly from cache."
)

# ==================== 2. MASSIVE API CALLS ====================
pdf.add_page()
pdf.section("2. Massive.com API Calls (5 Total)")
pdf.body(
    "The application makes exactly 5 sequential HTTP GET requests to the Massive.com "
    "(Polygon.io) REST API. All requests use Bearer token authentication."
)

# Call 1
pdf.sub("Call 1: Ticker Details")
pdf.code("GET https://api.massive.com/v3/reference/tickers/{ticker}")
pdf.body(
    "Returns company metadata. We extract:\n"
    "  - name: Company name (e.g., 'Apple Inc.')\n"
    "  - market_cap: Current market capitalization in USD\n"
    "  - weighted_shares_outstanding: Total shares outstanding"
)

# Call 2
pdf.sub("Call 2: Previous Day Bar")
pdf.code("GET https://api.massive.com/v2/aggs/ticker/{ticker}/prev")
pdf.body(
    "Returns the most recent trading day's OHLCV data. We extract:\n"
    "  - c (close): The closing price - used as the current stock price\n"
    "  - Also available but not primary: o (open), h (high), l (low), v (volume)"
)

# Call 3
pdf.sub("Call 3: Quarterly Financials (8 Quarters)")
pdf.code("GET https://api.massive.com/vX/reference/financials\n"
         "    ?ticker={ticker}&timeframe=quarterly&limit=8")
pdf.body(
    "Returns 8 quarters of financial statements (income statement, balance sheet, "
    "and cash flow statement). This is the most data-rich call.\n\n"
    "Why 8 quarters? We split them into:\n"
    "  - Recent 4 quarters: Used for TTM (trailing 12 months) metrics and margins\n"
    "  - Prior 4 quarters: Used for Year-over-Year revenue growth comparison\n\n"
    "This eliminates the need for a separate annual financials API call."
)

pdf.body("Fields extracted from INCOME STATEMENT:")
w2 = [60, 120]
pdf.row(["API Field", "Used For"], w2, bold=True)
pdf.row(["revenues", "TTM revenue, gross margin denominator, P/S ratio"], w2)
pdf.row(["gross_profit", "Gross margin calculation"], w2)
pdf.row(["operating_income_loss", "Operating margin calculation"], w2)
pdf.row(["net_income_loss", "Profit margin, EPS calculation"], w2)

pdf.ln(3)
pdf.body("Fields extracted from BALANCE SHEET:")
pdf.row(["API Field", "Used For"], w2, bold=True)
pdf.row(["other_current_assets", "Cash & short-term investments proxy"], w2)
pdf.row(["long_term_debt", "Long-term debt for Cash/Debt ratio"], w2)
pdf.row(["current_liabilities", "Short-term debt component"], w2)

pdf.ln(3)
pdf.body("Fields extracted from CASH FLOW STATEMENT:")
pdf.row(["API Field", "Used For"], w2, bold=True)
pdf.row(["net_cash_flow_from_operating_activities", "Operating cash flow for FCF"], w2)
pdf.row(["net_cash_flow_from_investing_activities", "CapEx proxy for FCF"], w2)

# Call 4
pdf.add_page()
pdf.sub("Call 4: 50-Day Simple Moving Average (SMA)")
pdf.code("GET https://api.massive.com/v1/indicators/sma/{ticker}\n"
         "    ?timespan=day&window=50&limit=1")
pdf.body(
    "Returns the current 50-day Simple Moving Average. We extract:\n"
    "  - results.values[0].value: The SMA50 price level\n\n"
    "Used in the Technicals check to determine if the stock price is trending "
    "above or below its 50-day average."
)

# Call 5
pdf.sub("Call 5: 14-Day Relative Strength Index (RSI)")
pdf.code("GET https://api.massive.com/v1/indicators/rsi/{ticker}\n"
         "    ?timespan=day&window=14&limit=1")
pdf.body(
    "Returns the current 14-day RSI. We extract:\n"
    "  - results.values[0].value: The RSI value (0-100)\n\n"
    "Used in the Technicals check:\n"
    "  - RSI > 70: Overbought (bearish warning)\n"
    "  - RSI 30-70: Neutral zone (healthy)\n"
    "  - RSI < 30: Oversold (bearish or potential reversal)"
)

# ==================== 3. DATA EXTRACTION ====================
pdf.add_page()
pdf.section("3. Data Extraction Summary")
pdf.body(
    "Below is a complete mapping of every Massive.com API field used by the screener "
    "and what it feeds into:"
)

w3 = [45, 55, 90]
pdf.row(["API Call", "Field", "Feeds Into"], w3, bold=True)
pdf.row(["Ticker Details", "name", "Company name display"], w3)
pdf.row(["Ticker Details", "market_cap", "P/S ratio, overview"], w3)
pdf.row(["Ticker Details", "weighted_shares_out", "EPS calculation"], w3)
pdf.row(["Prev Day Bar", "c (close)", "Price, P/E, technicals"], w3)
pdf.row(["Financials", "revenues", "TTM revenue, margins, P/S, growth"], w3)
pdf.row(["Financials", "gross_profit", "Gross margin"], w3)
pdf.row(["Financials", "operating_income_loss", "Operating margin"], w3)
pdf.row(["Financials", "net_income_loss", "Profit margin, EPS"], w3)
pdf.row(["Financials", "other_current_assets", "Cash (balance sheet check)"], w3)
pdf.row(["Financials", "long_term_debt", "Cash/Debt ratio"], w3)
pdf.row(["Financials", "current_liabilities", "Total debt calculation"], w3)
pdf.row(["Financials", "operating CF", "FCF margin"], w3)
pdf.row(["Financials", "investing CF", "FCF margin (CapEx proxy)"], w3)
pdf.row(["SMA Indicator", "value", "SMA50 for trend check"], w3)
pdf.row(["RSI Indicator", "value", "RSI14 for momentum check"], w3)

# ==================== 4. COMPUTED METRICS ====================
pdf.add_page()
pdf.section("4. Computed Metrics & Formulas")

pdf.sub("4.1 Overview Metrics")
w4 = [50, 140]
pdf.row(["Metric", "Formula"], w4, bold=True)
pdf.row(["TTM Revenue", "Sum of 'revenues' from latest 4 quarters"], w4)
pdf.row(["TTM Net Income", "Sum of 'net_income_loss' from latest 4 quarters"], w4)
pdf.row(["TTM EPS", "TTM Net Income / Shares Outstanding"], w4)
pdf.row(["P/E Ratio", "Closing Price / TTM EPS (only if EPS > 0)"], w4)
pdf.row(["P/S Ratio", "Market Cap / TTM Revenue"], w4)
pdf.ln(4)

pdf.sub("4.2 Margin Metrics (all TTM from latest 4 quarters)")
pdf.row(["Metric", "Formula"], w4, bold=True)
pdf.row(["Gross Margin %", "(Sum of gross_profit / Sum of revenues) x 100"], w4)
pdf.row(["Operating Margin %", "(Sum of operating_income_loss / Sum of revenues) x 100"], w4)
pdf.row(["Profit Margin %", "(Sum of net_income_loss / Sum of revenues) x 100"], w4)
pdf.row(["FCF Margin %", "((Operating CF + Investing CF) / Sum of revenues) x 100"], w4)
pdf.ln(4)

pdf.sub("4.3 Revenue Growth (Year-over-Year)")
pdf.body(
    "YoY growth is computed by comparing the sum of the recent 4 quarters vs. "
    "the sum of the prior 4 quarters:"
)
pdf.code("Growth % = ((Recent 4Q Revenue - Prior 4Q Revenue) / Prior 4Q Revenue) x 100")
pdf.body(
    "Additionally, all 8 quarters are grouped by fiscal year to show annual revenue "
    "breakdowns in the response."
)

pdf.sub("4.4 Balance Sheet Metrics")
pdf.row(["Metric", "Formula"], w4, bold=True)
pdf.row(["Cash", "other_current_assets from most recent quarter"], w4)
pdf.row(["Total Debt", "long_term_debt + current_liabilities"], w4)
pdf.row(["Cash/Debt Ratio", "Cash / Total Debt"], w4)

# ==================== 5. SCREENING CHECKS ====================
pdf.add_page()
pdf.section("5. The 5 Screening Checks")
pdf.body(
    "Each check independently evaluates one dimension of the stock and produces "
    "a traffic light signal: GREEN (bullish), YELLOW (neutral/caution), or RED (bearish). "
    "If the data for a check is unavailable, the check is skipped entirely."
)

# Check 1
pdf.ln(2)
pdf.sub("Check 1: Margins")
pdf.body("Evaluates whether the company has strong pricing power and profitability.")
cw = [25, 75, 90]
pdf.row(["Light", "Condition", "Reasoning"], cw, bold=True)
pdf.row(["GREEN", "Gross Margin >= 50%", "High-margin business, strong pricing power"], cw)
pdf.row(["YELLOW", "GM 30-50% AND Profit Margin > 10%", "Moderate margins but still profitable"], cw)
pdf.row(["RED", "Gross Margin <= 30%", "Low margin, commodity business risk"], cw)
pdf.ln(2)
pdf.body("Primary data: gross_profit and revenues from income statement.")

# Check 2
pdf.sub("Check 2: Price/Sales Ratio")
pdf.body("Evaluates valuation relative to revenue. High P/S can be justified by growth + cash flow.")
pdf.row(["Light", "Condition", "Reasoning"], cw, bold=True)
pdf.row(["GREEN", "P/S <= 10", "Reasonably valued relative to revenue"], cw)
pdf.row(["GREEN", "P/S 10-20, Growth+FCF% > 30%", "High P/S justified by strong fundamentals"], cw)
pdf.row(["YELLOW", "P/S 10-20, Growth+FCF% <= 30%", "Elevated valuation, not enough growth"], cw)
pdf.row(["RED", "P/S >= 20", "Very expensive - needs exceptional growth"], cw)
pdf.ln(2)
pdf.body(
    "This check combines valuation (P/S) with a 'Rule of 40'-style test: "
    "Revenue Growth % + FCF Margin % should exceed 30% to justify a higher P/S."
)

# Check 3
pdf.add_page()
pdf.sub("Check 3: Revenue Growth (Year-over-Year)")
pdf.body("Evaluates whether the company is growing revenue fast enough.")
pdf.row(["Light", "Condition", "Reasoning"], cw, bold=True)
pdf.row(["GREEN", "YoY Growth >= 20%", "Strong growth company"], cw)
pdf.row(["YELLOW", "Growth 10-20%", "Moderate growth, may be maturing"], cw)
pdf.row(["RED", "Growth < 10%", "Slow or no growth"], cw)
pdf.ln(2)
pdf.body(
    "Growth is computed from 8 quarters: sum of recent 4Q vs. sum of prior 4Q. "
    "This gives a true trailing comparison without waiting for annual filings."
)

# Check 4
pdf.sub("Check 4: Cash/Debt Ratio")
pdf.body("Evaluates balance sheet strength - can the company cover its debts?")
pdf.row(["Light", "Condition", "Reasoning"], cw, bold=True)
pdf.row(["GREEN", "Cash/Debt >= 1.0", "More cash than debt, strong position"], cw)
pdf.row(["YELLOW", "Cash/Debt 0.5-1.0", "Manageable debt levels"], cw)
pdf.row(["RED", "Cash/Debt <= 0.5", "High leverage, financial risk"], cw)
pdf.ln(2)
pdf.body("Cash = other_current_assets. Debt = long_term_debt + current_liabilities.")

# Check 5
pdf.sub("Check 5: Technicals (SMA50 + RSI14)")
pdf.body(
    "Combines trend analysis (price vs. 50-day moving average) with momentum "
    "(14-day RSI) to assess short-term technical health."
)
pdf.row(["Light", "Condition", "Reasoning"], cw, bold=True)
pdf.row(["GREEN", "Price > SMA50, RSI 30-70", "Uptrend, not overbought"], cw)
pdf.row(["YELLOW", "Price > SMA50, RSI > 70", "Uptrend but overbought warning"], cw)
pdf.row(["YELLOW", "Price < SMA50, RSI >= 30", "Below trend but not oversold"], cw)
pdf.row(["RED", "Price < SMA50, RSI < 30", "Downtrend and oversold"], cw)

# ==================== 6. SIGNAL DETERMINATION ====================
pdf.add_page()
pdf.section("6. Signal Determination")
pdf.body(
    "After all 5 checks run, the system counts the GREEN and RED results to produce "
    "a final recommendation. SELL is evaluated first (defensive bias)."
)
pdf.ln(2)
pdf.sub("Decision Logic")
pdf.code(
    "total = number of checks that ran (max 5, fewer if data missing)\n"
    "reds  = count of RED checks\n"
    "greens = count of GREEN checks\n"
    "\n"
    "if reds >= total / 2    --> SELL\n"
    "if greens >= total / 2  --> BUY\n"
    "otherwise               --> HOLD"
)
pdf.ln(2)
pdf.body(
    "Examples with 5 checks:\n"
    "  - 4 GREEN, 1 RED    --> BUY  (4 >= 2.5)\n"
    "  - 3 GREEN, 2 YELLOW --> BUY  (3 >= 2.5)\n"
    "  - 1 GREEN, 4 YELLOW --> HOLD (neither threshold met)\n"
    "  - 0 GREEN, 3 RED    --> SELL (3 >= 2.5)\n"
    "  - 2 GREEN, 2 YELLOW, 1 RED --> HOLD"
)

# ==================== 7. CONFIDENCE ====================
pdf.section("7. Confidence Level")
pdf.body(
    "Confidence reflects how unanimous the screening checks are:"
)
sw = [30, 160]
pdf.row(["Level", "Condition"], sw, bold=True)
pdf.row(["HIGH", "All checks are the same color (all GREEN or all RED)"], sw)
pdf.row(["MEDIUM", "At most 1 check differs from the majority"], sw)
pdf.row(["LOW", "Mixed results (2+ checks differ) - default"], sw)

pdf.ln(4)
pdf.body(
    "Examples:\n"
    "  - 5 GREEN, 0 RED  --> HIGH confidence BUY\n"
    "  - 4 GREEN, 1 other --> MEDIUM confidence BUY\n"
    "  - 3 GREEN, 1 YELLOW, 1 RED --> LOW confidence BUY\n"
    "  - 5 RED, 0 GREEN --> HIGH confidence SELL"
)

# ==================== 8. EXAMPLE ====================
pdf.add_page()
pdf.section("8. Complete Example: AAPL")
pdf.body("Here is a real analysis of Apple Inc. (AAPL) showing each step:")

pdf.sub("API Data Retrieved")
pdf.code(
    "Ticker Details:  name=Apple Inc., market_cap=$3.88T, shares=14.68B\n"
    "Previous Bar:    close=$264.35\n"
    "Financials:      8 quarterly filings (Q3'24 through Q2'26)\n"
    "SMA(50):         $266.74\n"
    "RSI(14):         48.90"
)

pdf.sub("Computed Metrics")
pdf.code(
    "TTM Revenue:     $435.6B\n"
    "TTM Net Income:  $117.8B\n"
    "EPS (TTM):       $8.02\n"
    "P/E Ratio:       32.96x\n"
    "P/S Ratio:       8.91x\n"
    "Gross Margin:    47.33%\n"
    "Operating Margin:32.38%\n"
    "Profit Margin:   27.04%\n"
    "FCF Margin:      31.22%\n"
    "YoY Rev Growth:  10.07%\n"
    "Cash/Debt:       0.61x"
)

pdf.sub("Check Results")
cw2 = [20, 50, 40, 80]
pdf.row(["#", "Check", "Light", "Detail"], cw2, bold=True)
pdf.row(["1", "Margins", "YELLOW", "Gross margin 47.33% (30-50%), PM 27.04%"], cw2)
pdf.row(["2", "Price/Sales", "GREEN", "P/S 8.91 <= 10"], cw2)
pdf.row(["3", "Revenue Growth", "YELLOW", "Revenue growth 10.07% (10-20%)"], cw2)
pdf.row(["4", "Cash/Debt Ratio", "YELLOW", "Cash/Debt ratio 0.61 (0.5-1.0)"], cw2)
pdf.row(["5", "Technicals", "YELLOW", "Price below SMA50, RSI 48.9"], cw2)

pdf.ln(4)
pdf.sub("Final Result")
pdf.code(
    "Signal:     HOLD\n"
    "Confidence: LOW\n"
    "Reasoning:  1/5 checks GREEN, 4/5 YELLOW, 0 RED\n"
    "            Neither greens (1) nor reds (0) reach threshold (2.5)\n"
    "            --> HOLD with LOW confidence (mixed results)"
)

out = "/Users/sridharvukkadapu/git/span/Span_Algorithm_Documentation.pdf"
pdf.output(out)
print(f"PDF saved to: {out}")
