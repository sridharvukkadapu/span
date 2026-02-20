package com.sv.span.controller

import com.sv.span.model.*
import com.sv.span.service.BacktestService
import com.sv.span.service.ScreenerService
import org.springframework.http.MediaType
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.ResponseBody

@Controller
class HtmlController(
    private val screenerService: ScreenerService,
    private val backtestService: BacktestService,
) {

    // ======================== SCREENER VIEW ========================

    @GetMapping("/view/{symbol}", produces = [MediaType.TEXT_HTML_VALUE])
    @ResponseBody
    fun viewRecommendation(@PathVariable symbol: String): String {
        return try {
            val r = screenerService.analyze(symbol)
            renderHtml(r)
        } catch (e: Exception) {
            errorHtml(symbol, e.message ?: "Unknown error")
        }
    }

    private fun renderHtml(r: ScreenerResult): String {
        val signalBg = when (r.signal) {
            Signal.BUY -> "linear-gradient(135deg, #065f46, #047857)"
            Signal.SELL -> "linear-gradient(135deg, #991b1b, #dc2626)"
            Signal.HOLD -> "linear-gradient(135deg, #92400e, #d97706)"
        }
        val signalGlow = when (r.signal) {
            Signal.BUY -> "0 4px 24px rgba(16,185,129,0.45)"
            Signal.SELL -> "0 4px 24px rgba(239,68,68,0.45)"
            Signal.HOLD -> "0 4px 24px rgba(245,158,11,0.45)"
        }

        val checksHtml = r.checks.joinToString("") { check ->
            val (icon, color, bg) = when (check.light) {
                CheckLight.GREEN -> Triple("&#10003;", "#10b981", "rgba(16,185,129,0.1)")
                CheckLight.YELLOW -> Triple("&#9679;", "#f59e0b", "rgba(245,158,11,0.1)")
                CheckLight.RED -> Triple("&#10007;", "#ef4444", "rgba(239,68,68,0.1)")
            }
            """
            <div class="check-card" style="border-left: 3px solid $color; background: $bg;">
                <div class="check-icon" style="color:$color">$icon</div>
                <div class="check-body">
                    <div class="check-name">${check.name}</div>
                    <div class="check-detail">${check.detail}</div>
                </div>
            </div>
            """
        }

        val pillsHtml = r.checks.joinToString("") { c ->
            val (cls, dot) = when (c.light) {
                CheckLight.GREEN -> "pill-pass" to "&#10003;"
                CheckLight.YELLOW -> "pill-warn" to "&#9679;"
                CheckLight.RED -> "pill-fail" to "&#10007;"
            }
            "<span class=\"check-pill $cls\">$dot ${c.name}</span>"
        }

        val revenueRows = r.revenueAnalysis.revenueYears.joinToString("") {
            "<tr><td>${it.fiscalYear}</td><td class='num'>${it.revenueFormatted}</td></tr>"
        }

        val projectionHtml = if (r.projection != null) {
            val projRows = r.projection.years.joinToString("") { y ->
                "<tr><td>${y.year}</td><td class='num'>${y.revenueFormatted}</td><td class='num'>${y.netIncomeFormatted}</td><td class='num'>${y.epsFormatted}</td><td class='num highlight'>${y.priceFormatted}</td></tr>"
            }
            val a = r.projection.assumptions
            """
            <div class="card">
                <div class="card-header">
                    <h2><span class="card-icon">&#127919;</span> 3-Year Price Projection</h2>
                </div>
                <div class="card-body">
                    <table>
                        <thead><tr><th>Year</th><th style="text-align:right">Revenue</th><th style="text-align:right">Net Income</th><th style="text-align:right">EPS</th><th style="text-align:right">Est. Price</th></tr></thead>
                        <tbody>$projRows</tbody>
                    </table>
                    <div class="assumptions">
                        <strong>Assumptions:</strong> Base growth ${a.baseGrowthFormatted}, decay ${a.decayFormatted}/yr,
                        profit margin ${a.marginFormatted}, P/E multiple ${a.peFormatted}<br>
                        <em>${a.note}</em>
                    </div>
                </div>
            </div>
            """
        } else ""

        return """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${r.symbol} &middot; Span Screener</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                :root {
                    --bg: #0f1117;
                    --surface: #1a1d27;
                    --surface-2: #242836;
                    --border: rgba(255,255,255,0.06);
                    --border-2: rgba(255,255,255,0.1);
                    --text: #e2e8f0;
                    --text-secondary: #94a3b8;
                    --text-muted: #64748b;
                    --accent: #6366f1;
                    --accent-2: #818cf8;
                    --green: #10b981;
                    --green-dim: rgba(16,185,129,0.12);
                    --red: #ef4444;
                    --red-dim: rgba(239,68,68,0.12);
                    --yellow: #f59e0b;
                    --yellow-dim: rgba(245,158,11,0.12);
                }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; -webkit-font-smoothing: antialiased; }
                .container { max-width: 880px; margin: 0 auto; padding: 32px 20px 64px; }

                /* ---- HERO ---- */
                .hero { text-align: center; padding: 52px 24px 44px; margin-bottom: 32px; background: linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%); border-radius: 24px; border: 1px solid var(--border); position: relative; overflow: hidden; }
                .hero::before { content: ''; position: absolute; top: -60%; left: -20%; width: 140%; height: 120%; background: radial-gradient(circle at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 60%); pointer-events: none; }
                .hero-ticker { font-size: 14px; font-weight: 600; letter-spacing: 3px; color: var(--accent-2); text-transform: uppercase; }
                .hero-company { font-size: 30px; font-weight: 800; color: #fff; margin-top: 4px; }
                .signal-badge { display: inline-block; padding: 14px 52px; border-radius: 12px; font-size: 30px; font-weight: 900; letter-spacing: 3px; margin-top: 20px; color: #fff; background: $signalBg; box-shadow: $signalGlow; }
                .confidence-label { font-size: 12px; color: var(--text-muted); margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; }

                /* ---- PILLS ---- */
                .pills-row { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-top: 24px; }
                .check-pill { display: inline-flex; align-items: center; gap: 5px; padding: 5px 14px; border-radius: 100px; font-size: 12px; font-weight: 600; letter-spacing: 0.3px; border: 1px solid transparent; }
                .pill-pass { background: var(--green-dim); color: var(--green); border-color: rgba(16,185,129,0.25); }
                .pill-fail { background: var(--red-dim); color: var(--red); border-color: rgba(239,68,68,0.25); }
                .pill-warn { background: var(--yellow-dim); color: var(--yellow); border-color: rgba(245,158,11,0.25); }

                /* ---- CTA ---- */
                .cta-row { margin-top: 24px; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
                .btn { display: inline-flex; align-items: center; gap: 8px; padding: 11px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; transition: all 0.2s ease; cursor: pointer; border: none; }
                .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; box-shadow: 0 2px 12px rgba(99,102,241,0.3); }
                .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.45); }

                /* ---- CARDS ---- */
                .card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; margin-bottom: 20px; overflow: hidden; transition: border-color 0.2s; }
                .card:hover { border-color: var(--border-2); }
                .card-header { padding: 18px 24px 0; }
                .card-header h2 { font-size: 15px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 8px; }
                .card-icon { font-size: 18px; }
                .card-body { padding: 16px 24px 20px; }

                /* ---- CHECKS ---- */
                .checks-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .check-card { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border-radius: 10px; }
                .check-icon { font-size: 16px; font-weight: 700; flex-shrink: 0; margin-top: 1px; width: 22px; text-align: center; }
                .check-body { flex: 1; min-width: 0; }
                .check-name { font-size: 13px; font-weight: 600; color: var(--text); }
                .check-detail { font-size: 12px; color: var(--text-muted); margin-top: 2px; line-height: 1.4; }

                /* ---- METRICS ---- */
                .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
                .metric-cell { padding: 16px 0; border-bottom: 1px solid var(--border); }
                .metric-cell:nth-child(3n+2) { text-align: center; }
                .metric-cell:nth-child(3n) { text-align: right; }
                .metric-label { font-size: 11px; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; }
                .metric-value { font-size: 20px; font-weight: 700; color: #fff; margin-top: 2px; font-variant-numeric: tabular-nums; }

                /* ---- TABLE ---- */
                table { width: 100%; border-collapse: collapse; }
                th { text-align: left; padding: 10px 0; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid var(--border-2); }
                td { padding: 12px 0; font-size: 14px; color: var(--text); border-bottom: 1px solid var(--border); }
                td.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
                td.highlight { color: #fff; font-weight: 700; }

                /* ---- ASSUMPTIONS ---- */
                .assumptions { margin-top: 16px; padding: 14px 18px; background: var(--surface-2); border-radius: 10px; font-size: 12px; color: var(--text-muted); line-height: 1.6; }
                .assumptions strong { color: var(--text-secondary); }

                /* ---- SEARCH ---- */
                .search-bar { display: flex; justify-content: center; margin: 32px 0 0; }
                .search-bar form { display: flex; gap: 8px; }
                .search-bar input { padding: 10px 18px; background: var(--surface); border: 1px solid var(--border-2); border-radius: 10px; color: var(--text); font-size: 14px; width: 140px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px; outline: none; transition: border-color 0.2s; font-family: 'Inter', sans-serif; }
                .search-bar input:focus { border-color: var(--accent); }
                .search-bar input::placeholder { color: var(--text-muted); }
                .search-bar button { padding: 10px 24px; background: var(--accent); color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; font-family: 'Inter', sans-serif; }
                .search-bar button:hover { background: #4f46e5; }

                /* ---- FOOTER ---- */
                .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--border); }
                .footer-brand { font-size: 18px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 1px; }
                .footer-sub { font-size: 11px; color: var(--text-muted); margin-top: 6px; }
                .footer-sub a { color: var(--text-muted); text-decoration: none; }
                .footer-sub a:hover { color: var(--accent-2); }

                @media (max-width: 640px) {
                    .hero-company { font-size: 22px; }
                    .signal-badge { font-size: 24px; padding: 12px 36px; }
                    .checks-grid { grid-template-columns: 1fr; }
                    .metrics-grid { grid-template-columns: repeat(2, 1fr); }
                    .metric-cell:nth-child(3n+2), .metric-cell:nth-child(3n) { text-align: left; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="hero">
                    <div class="hero-ticker">${r.symbol}</div>
                    <div class="hero-company">${r.companyName ?: r.symbol}</div>
                    <div class="signal-badge">${r.signal}</div>
                    <div class="confidence-label">${r.confidence} confidence</div>
                    <div class="pills-row">$pillsHtml</div>
                    <div class="cta-row">
                        <a class="btn btn-primary" href="/backtest/${r.symbol}">&#9654; View 5-Year Backtest</a>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h2><span class="card-icon">&#128269;</span> Screening Checks</h2></div>
                    <div class="card-body">
                        <div class="checks-grid">$checksHtml</div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h2><span class="card-icon">&#128200;</span> Overview</h2></div>
                    <div class="card-body">
                        <div class="metrics-grid">
                            <div class="metric-cell"><div class="metric-label">Price</div><div class="metric-value">${r.overview.priceFormatted ?: "N/A"}</div></div>
                            <div class="metric-cell"><div class="metric-label">Market Cap</div><div class="metric-value">${r.overview.marketCapFormatted ?: "N/A"}</div></div>
                            <div class="metric-cell"><div class="metric-label">EPS (TTM)</div><div class="metric-value">${r.overview.epsTtmFormatted ?: "N/A"}</div></div>
                            <div class="metric-cell"><div class="metric-label">P/E Ratio</div><div class="metric-value">${r.overview.peRatioFormatted ?: "N/A"}</div></div>
                            <div class="metric-cell"><div class="metric-label">P/S Ratio</div><div class="metric-value">${r.overview.priceToSalesFormatted ?: "N/A"}</div></div>
                            <div class="metric-cell"><div class="metric-label">Shares Out</div><div class="metric-value">${r.overview.sharesOutstandingFormatted ?: "N/A"}</div></div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h2><span class="card-icon">&#128176;</span> Margins (TTM)</h2></div>
                    <div class="card-body">
                        <div class="metrics-grid">
                            <div class="metric-cell"><div class="metric-label">Gross Margin</div><div class="metric-value">${r.margins.grossMarginFormatted ?: "N/A"}</div></div>
                            <div class="metric-cell"><div class="metric-label">Operating Margin</div><div class="metric-value">${r.margins.operatingMarginFormatted ?: "N/A"}</div></div>
                            <div class="metric-cell"><div class="metric-label">Profit Margin</div><div class="metric-value">${r.margins.profitMarginFormatted ?: "N/A"}</div></div>
                            <div class="metric-cell"><div class="metric-label">FCF Margin</div><div class="metric-value">${r.margins.fcfMarginFormatted ?: "N/A"}</div></div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h2><span class="card-icon">&#128202;</span> Revenue</h2></div>
                    <div class="card-body">
                        <div class="metrics-grid">
                            <div class="metric-cell"><div class="metric-label">Revenue (TTM)</div><div class="metric-value">${r.revenueAnalysis.revenueTtmFormatted ?: "N/A"}</div></div>
                            <div class="metric-cell"><div class="metric-label">Net Income (TTM)</div><div class="metric-value">${r.revenueAnalysis.netIncomeTtmFormatted ?: "N/A"}</div></div>
                            <div class="metric-cell"><div class="metric-label">YoY Growth</div><div class="metric-value">${r.revenueAnalysis.revenueGrowthFormatted ?: "N/A"}</div></div>
                        </div>
                        ${if (revenueRows.isNotEmpty()) """
                        <table style="margin-top: 16px;">
                            <thead><tr><th>Fiscal Year</th><th style="text-align:right">Revenue</th></tr></thead>
                            <tbody>$revenueRows</tbody>
                        </table>
                        """ else ""}
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h2><span class="card-icon">&#127974;</span> Balance Sheet</h2></div>
                    <div class="card-body">
                        <div class="metrics-grid">
                            <div class="metric-cell"><div class="metric-label">Cash</div><div class="metric-value">${r.balanceSheet.cashFormatted ?: "N/A"}</div></div>
                            <div class="metric-cell"><div class="metric-label">Long-term Debt</div><div class="metric-value">${r.balanceSheet.longTermDebtFormatted ?: "N/A"}</div></div>
                            <div class="metric-cell"><div class="metric-label">Total Debt</div><div class="metric-value">${r.balanceSheet.totalDebtFormatted ?: "N/A"}</div></div>
                            <div class="metric-cell"><div class="metric-label">Cash/Debt</div><div class="metric-value">${r.balanceSheet.cashToDebtFormatted ?: "N/A"}</div></div>
                        </div>
                    </div>
                </div>

                $projectionHtml

                <div class="card">
                    <div class="card-header"><h2><span class="card-icon">&#128640;</span> Technicals</h2></div>
                    <div class="card-body">
                        <div class="metrics-grid">
                            <div class="metric-cell"><div class="metric-label">SMA (50)</div><div class="metric-value">${r.technicals?.sma50Formatted ?: "N/A"}</div></div>
                            <div class="metric-cell"><div class="metric-label">RSI (14)</div><div class="metric-value">${r.technicals?.rsi14Formatted ?: "N/A"}</div></div>
                            <div class="metric-cell"><div class="metric-label">Trend</div><div class="metric-value">${r.technicals?.priceVsSma50 ?: "N/A"}</div></div>
                        </div>
                    </div>
                </div>

                <div class="search-bar">
                    <form onsubmit="window.location='/view/'+document.getElementById('t').value.toUpperCase();return false;">
                        <input id="t" type="text" placeholder="TICKER" maxlength="5">
                        <button type="submit">Analyze</button>
                    </form>
                </div>

                <div class="footer">
                    <div class="footer-brand">SPAN</div>
                    <div class="footer-sub">Powered by <a href="https://github.com/sridharvukkadapu/span">Span Screener</a> &middot; Data from Massive.com</div>
                </div>
            </div>
        </body>
        </html>
        """.trimIndent()
    }

    private fun errorHtml(symbol: String, error: String): String = """
        <!DOCTYPE html>
        <html><head><title>Error - Span</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
            body{font-family:'Inter',sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;background:#0f1117;color:#e2e8f0;}
            .err{text-align:center;max-width:480px;padding:40px;}
            .err h1{font-size:48px;font-weight:800;background:linear-gradient(135deg,#ef4444,#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
            .err .msg{color:#94a3b8;margin-top:12px;font-size:14px;}
            .err a{display:inline-block;margin-top:24px;padding:10px 28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;}
        </style>
        </head><body><div class="err">
            <h1>Error</h1>
            <p class="msg">Could not analyze <strong>$symbol</strong></p>
            <p class="msg" style="font-size:12px;color:#64748b;margin-top:8px;">$error</p>
            <a href="/view/AAPL">Try AAPL</a>
        </div></body></html>
    """.trimIndent()

    // ======================== BACKTEST VIEW ========================

    @GetMapping("/backtest/{symbol}", produces = [MediaType.TEXT_HTML_VALUE])
    @ResponseBody
    fun viewBacktest(@PathVariable symbol: String): String {
        return try {
            val r = backtestService.backtest(symbol)
            renderBacktestHtml(r)
        } catch (e: Exception) {
            errorHtml(symbol, e.message ?: "Unknown error")
        }
    }

    private fun renderBacktestHtml(r: BacktestResult): String {
        val noTrades = r.totalTrades == 0
        val badgeText = if (noTrades) "NO TRADES EXECUTED"
                        else if (r.outperformance >= 0) "OUTPERFORMED by ${r.outperformanceFormatted}"
                        else "UNDERPERFORMED by ${r.outperformanceFormatted}"
        val badgeGradient = if (noTrades) "linear-gradient(135deg, #475569, #64748b)"
                            else if (r.outperformance >= 0) "linear-gradient(135deg, #065f46, #047857)"
                            else "linear-gradient(135deg, #991b1b, #dc2626)"
        val badgeGlow = if (noTrades) "0 4px 20px rgba(100,116,139,0.3)"
                        else if (r.outperformance >= 0) "0 4px 20px rgba(16,185,129,0.4)"
                        else "0 4px 20px rgba(239,68,68,0.4)"
        val badgeSub = if (noTrades) "All signals were HOLD &mdash; capital stayed in cash"
                       else "${r.totalTrades} trade${if (r.totalTrades > 1) "s" else ""} executed over ${r.periodStart} to ${r.periodEnd}"

        val tradesHtml = if (r.trades.isEmpty()) "" else r.trades.joinToString("") { t ->
            val typeClass = if (t.type == "BUY") "tag-buy" else "tag-sell"
            val retHtml = t.tradeReturnFormatted?.let {
                val positive = (t.tradeReturn ?: 0.0) >= 0
                val color = if (positive) "var(--green)" else "var(--red)"
                val bgColor = if (positive) "var(--green-dim)" else "var(--red-dim)"
                val arrow = if (positive) "&#9650;" else "&#9660;"
                """<span class="price-change" style="color:$color;background:$bgColor">$arrow $it</span>"""
            } ?: "<span class=\"price-change\" style=\"color:var(--text-muted);background:var(--surface-2)\">Entry</span>"
            """
            <tr>
                <td><span class="tag $typeClass">${t.type}</span></td>
                <td>${t.date}</td>
                <td class="num">${t.priceFormatted}</td>
                <td class="checks-col">${formatChecksRich(t.checksSummary)}</td>
                <td class="num">$retHtml</td>
            </tr>
            """
        }

        val signalRows = r.signalHistory.joinToString("") { s ->
            val sigClass = when (s.signal) {
                Signal.BUY -> "tag-buy"
                Signal.SELL -> "tag-sell"
                Signal.HOLD -> "tag-hold"
            }
            val actionClass = when {
                s.action.startsWith("BUY") -> "action-buy"
                s.action.startsWith("SELL") -> "action-sell"
                else -> "action-hold"
            }
            val changeHtml = if (s.priceChange != null && s.priceChangePercent != null) {
                val positive = s.priceChange >= 0
                val color = if (positive) "var(--green)" else "var(--red)"
                val bgColor = if (positive) "var(--green-dim)" else "var(--red-dim)"
                val arrow = if (positive) "&#9650;" else "&#9660;"
                """<span class="price-change" style="color:$color;background:$bgColor">$arrow ${s.priceChangePctFormatted}</span>"""
            } else {
                "<span class=\"price-change\" style=\"color:var(--text-muted);background:var(--surface-2)\">&mdash;</span>"
            }
            """
            <tr>
                <td>${s.date}</td>
                <td class="num">${s.priceFormatted}</td>
                <td class="num">$changeHtml</td>
                <td><span class="tag $sigClass">${s.signal}</span></td>
                <td class="checks-col">${formatChecksRich(s.checksSummary)}</td>
                <td class="$actionClass">${s.action}</td>
            </tr>
            """
        }

        // Chart
        val labels = r.equityCurve.map { "\"${it.date}\"" }.joinToString(",")
        val stratData = r.equityCurve.map { it.strategyValue.toString() }.joinToString(",")
        val bAndHData = r.equityCurve.map { it.buyAndHoldValue.toString() }.joinToString(",")
        val dollar = "$"

        val stratReturnClass = if (r.strategyReturn >= 0) "kpi-positive" else "kpi-negative"
        val bAndHReturnClass = if (r.buyAndHoldReturn >= 0) "kpi-positive" else "kpi-negative"

        return """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${r.symbol} Backtest &middot; Span</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
            <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0"></script>
            <style>
                :root {
                    --bg: #0f1117;
                    --surface: #1a1d27;
                    --surface-2: #242836;
                    --border: rgba(255,255,255,0.06);
                    --border-2: rgba(255,255,255,0.1);
                    --text: #e2e8f0;
                    --text-secondary: #94a3b8;
                    --text-muted: #64748b;
                    --accent: #6366f1;
                    --accent-2: #818cf8;
                    --green: #10b981;
                    --green-dim: rgba(16,185,129,0.12);
                    --red: #ef4444;
                    --red-dim: rgba(239,68,68,0.12);
                    --yellow: #f59e0b;
                    --yellow-dim: rgba(245,158,11,0.12);
                }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; -webkit-font-smoothing: antialiased; }
                .container { max-width: 960px; margin: 0 auto; padding: 24px 20px 64px; }

                /* Nav */
                .nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 0 4px; }
                .nav a { color: var(--accent-2); text-decoration: none; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: color 0.2s; }
                .nav a:hover { color: #a78bfa; }
                .nav-brand { font-size: 16px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 1px; }

                /* Hero */
                .hero { text-align: center; padding: 48px 24px 44px; margin-bottom: 28px; background: linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%); border-radius: 24px; border: 1px solid var(--border); position: relative; overflow: hidden; }
                .hero::before { content: ''; position: absolute; top: -60%; left: -20%; width: 140%; height: 120%; background: radial-gradient(circle at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 60%); pointer-events: none; }
                .hero-ticker { font-size: 14px; font-weight: 700; letter-spacing: 3px; color: var(--accent-2); }
                .hero-title { font-size: 32px; font-weight: 900; color: #fff; margin-top: 4px; }
                .hero-period { font-size: 13px; color: var(--text-muted); margin-top: 6px; }
                .result-badge { display: inline-block; padding: 14px 40px; border-radius: 12px; font-size: 20px; font-weight: 900; letter-spacing: 1.5px; margin-top: 20px; color: #fff; background: $badgeGradient; box-shadow: $badgeGlow; }
                .hero-sub { font-size: 12px; color: var(--text-muted); margin-top: 10px; }

                /* KPI */
                .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
                .kpi-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 20px; text-align: center; transition: border-color 0.2s; }
                .kpi-card:hover { border-color: var(--border-2); }
                .kpi-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; }
                .kpi-value { font-size: 24px; font-weight: 800; color: #fff; margin-top: 6px; font-variant-numeric: tabular-nums; }
                .kpi-positive { color: var(--green) !important; }
                .kpi-negative { color: var(--red) !important; }

                /* Stats */
                .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
                .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px 20px; text-align: center; }
                .stat-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.6px; }
                .stat-value { font-size: 18px; font-weight: 700; color: var(--text); margin-top: 4px; }

                /* Card */
                .card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; margin-bottom: 20px; overflow: hidden; transition: border-color 0.2s; }
                .card:hover { border-color: var(--border-2); }
                .card-header { padding: 18px 24px 0; display: flex; justify-content: space-between; align-items: center; }
                .card-header h2 { font-size: 15px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 8px; }
                .card-icon { font-size: 17px; }
                .card-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 100px; background: var(--surface-2); color: var(--text-secondary); }
                .card-body { padding: 16px 24px 20px; }

                /* Chart */
                .chart-wrap { position: relative; height: 360px; margin-top: 8px; }

                /* Table */
                table { width: 100%; border-collapse: collapse; }
                th { text-align: left; padding: 10px 8px; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 1px solid var(--border-2); }
                td { padding: 14px 8px; font-size: 13px; color: var(--text); border-bottom: 1px solid var(--border); vertical-align: middle; }
                td.num { font-variant-numeric: tabular-nums; font-weight: 500; }
                tr:hover td { background: rgba(99,102,241,0.04); }
                .checks-col { font-size: 11px; line-height: 1.7; }

                /* Tags */
                .tag { display: inline-block; padding: 2px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
                .tag-buy { background: var(--green-dim); color: var(--green); }
                .tag-sell { background: var(--red-dim); color: var(--red); }
                .tag-hold { background: var(--yellow-dim); color: var(--yellow); }

                /* Check mini tags */
                .ck { display: inline-block; padding: 1px 7px; border-radius: 4px; font-size: 10px; font-weight: 600; margin: 1px 2px; }
                .ck-g { background: var(--green-dim); color: var(--green); }
                .ck-r { background: var(--red-dim); color: var(--red); }
                .ck-y { background: var(--yellow-dim); color: var(--yellow); }

                /* Price change pill */
                .price-change { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: -0.2px; white-space: nowrap; }

                /* Action */
                .action-buy { color: var(--green); font-weight: 700; }
                .action-sell { color: var(--red); font-weight: 700; }
                .action-hold { color: var(--text-muted); font-size: 12px; }

                /* Empty */
                .empty { text-align: center; padding: 32px 16px; color: var(--text-muted); font-size: 14px; }

                /* Disclaimer */
                .disclaimer { margin-top: 20px; padding: 16px 20px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 12px; font-size: 11px; color: var(--text-muted); line-height: 1.6; }
                .disclaimer strong { color: var(--yellow); }

                /* Footer */
                .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--border); }
                .footer-brand { font-size: 18px; font-weight: 800; background: linear-gradient(135deg, #6366f1, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 1px; }
                .footer-sub { font-size: 11px; color: var(--text-muted); margin-top: 6px; }
                .footer-sub a { color: var(--text-muted); text-decoration: none; }

                @media (max-width: 700px) {
                    .kpi-row { grid-template-columns: repeat(2, 1fr); }
                    .stats-row { grid-template-columns: repeat(2, 1fr); }
                    .hero-title { font-size: 24px; }
                    .result-badge { font-size: 16px; padding: 12px 24px; }
                    .chart-wrap { height: 260px; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="nav">
                    <a href="/view/${r.symbol}">&larr; Back to Screener</a>
                    <span class="nav-brand">SPAN</span>
                </div>

                <div class="hero">
                    <div class="hero-ticker">${r.symbol} BACKTEST</div>
                    <div class="hero-title">${r.companyName ?: r.symbol}</div>
                    <div class="hero-period">${r.periodStart} &nbsp;&#8594;&nbsp; ${r.periodEnd}</div>
                    <div class="result-badge">$badgeText</div>
                    <div class="hero-sub">$badgeSub</div>
                </div>

                <div class="kpi-row">
                    <div class="kpi-card">
                        <div class="kpi-label">Strategy Return</div>
                        <div class="kpi-value $stratReturnClass">${r.strategyReturnFormatted}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Buy &amp; Hold</div>
                        <div class="kpi-value $bAndHReturnClass">${r.buyAndHoldReturnFormatted}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Strategy Final</div>
                        <div class="kpi-value $stratReturnClass">${r.strategyFinalFormatted}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Buy &amp; Hold Final</div>
                        <div class="kpi-value" style="color:var(--text);">${r.buyAndHoldFinalFormatted}</div>
                    </div>
                </div>

                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-label">Initial</div>
                        <div class="stat-value">${dollar}${String.format("%,.0f", r.initialInvestment)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Trades</div>
                        <div class="stat-value">${r.totalTrades}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Win / Loss</div>
                        <div class="stat-value">${r.winningTrades}W / ${r.losingTrades}L</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Win Rate</div>
                        <div class="stat-value">${r.winRateFormatted ?: "N/A"}</div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2><span class="card-icon">&#128200;</span> Equity Curve</h2>
                        <span class="card-badge">${dollar}${String.format("%,.0f", r.initialInvestment)} invested</span>
                    </div>
                    <div class="card-body">
                        <div class="chart-wrap">
                            <canvas id="equityChart"></canvas>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2><span class="card-icon">&#128161;</span> Signal History</h2>
                        <span class="card-badge">${r.signalHistory.size} evaluations</span>
                    </div>
                    <div class="card-body">
                        ${if (r.signalHistory.isEmpty()) "<div class='empty'>No signal evaluations during this period.</div>" else """
                        <div style="overflow-x:auto;">
                        <table>
                            <thead><tr><th>Date</th><th>Price</th><th>Change</th><th>Signal</th><th>Checks</th><th>Action</th></tr></thead>
                            <tbody>$signalRows</tbody>
                        </table>
                        </div>
                        """}
                    </div>
                </div>

                ${if (r.trades.isNotEmpty()) """
                <div class="card">
                    <div class="card-header">
                        <h2><span class="card-icon">&#128184;</span> Trade Log</h2>
                        <span class="card-badge">${r.trades.size} trade${if (r.trades.size > 1) "s" else ""}</span>
                    </div>
                    <div class="card-body">
                        <div style="overflow-x:auto;">
                        <table>
                            <thead><tr><th>Action</th><th>Date</th><th>Price</th><th>Checks</th><th>Return</th></tr></thead>
                            <tbody>$tradesHtml</tbody>
                        </table>
                        </div>
                    </div>
                </div>
                """ else ""}

                <div class="disclaimer">
                    <strong>&#9888; Disclaimer:</strong> This backtest is for educational purposes only. It applies the 5-check screening algorithm retroactively to historical data.
                    Past performance does not guarantee future results. The simulation assumes instant execution at closing prices with no slippage, commissions, or market impact.
                </div>

                <div class="footer">
                    <div class="footer-brand">SPAN</div>
                    <div class="footer-sub">Powered by <a href="https://github.com/sridharvukkadapu/span">Span Screener</a> &middot; Data from Massive.com</div>
                </div>
            </div>

            <script>
                var ctx = document.getElementById('equityChart').getContext('2d');
                var gradient = ctx.createLinearGradient(0, 0, 0, 360);
                gradient.addColorStop(0, 'rgba(99,102,241,0.2)');
                gradient.addColorStop(1, 'rgba(99,102,241,0)');
                var gradientBH = ctx.createLinearGradient(0, 0, 0, 360);
                gradientBH.addColorStop(0, 'rgba(148,163,184,0.08)');
                gradientBH.addColorStop(1, 'rgba(148,163,184,0)');

                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: [$labels],
                        datasets: [
                            {
                                label: 'Span Strategy',
                                data: [$stratData],
                                borderColor: '#818cf8',
                                backgroundColor: gradient,
                                fill: true,
                                tension: 0.35,
                                pointRadius: 0,
                                pointHoverRadius: 5,
                                pointHoverBackgroundColor: '#818cf8',
                                borderWidth: 2.5
                            },
                            {
                                label: 'Buy & Hold',
                                data: [$bAndHData],
                                borderColor: '#475569',
                                backgroundColor: gradientBH,
                                fill: true,
                                borderDash: [4, 4],
                                tension: 0.35,
                                pointRadius: 0,
                                pointHoverRadius: 4,
                                pointHoverBackgroundColor: '#475569',
                                borderWidth: 1.5
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: {
                                    color: '#94a3b8',
                                    font: { family: 'Inter', size: 11, weight: '600' },
                                    boxWidth: 12,
                                    boxHeight: 2,
                                    padding: 20,
                                    usePointStyle: false
                                }
                            },
                            tooltip: {
                                backgroundColor: '#1e293b',
                                titleColor: '#e2e8f0',
                                bodyColor: '#94a3b8',
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderWidth: 1,
                                cornerRadius: 8,
                                padding: 12,
                                titleFont: { family: 'Inter', weight: '700', size: 12 },
                                bodyFont: { family: 'Inter', size: 12 },
                                callbacks: {
                                    label: function(c) {
                                        return c.dataset.label + ': ${dollar}' + c.parsed.y.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                display: true,
                                grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
                                ticks: { maxTicksLimit: 10, color: '#475569', font: { family: 'Inter', size: 10, weight: '500' } }
                            },
                            y: {
                                display: true,
                                grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
                                ticks: {
                                    callback: function(v) { return '${dollar}' + v.toLocaleString(); },
                                    color: '#475569',
                                    font: { family: 'Inter', size: 10, weight: '500' }
                                }
                            }
                        }
                    }
                });
            </script>
        </body>
        </html>
        """.trimIndent()
    }

    /** Convert "Margins:GREEN, P/S:RED, Growth:YELLOW" into rich colored mini-tags */
    private fun formatChecksRich(summary: String): String {
        if (summary.isBlank()) return ""
        return summary.split(",").joinToString(" ") { part ->
            val trimmed = part.trim()
            val colonIdx = trimmed.lastIndexOf(':')
            if (colonIdx < 0) return@joinToString "<span class=\"ck ck-y\">$trimmed</span>"
            val name = trimmed.substring(0, colonIdx).trim()
            val color = trimmed.substring(colonIdx + 1).trim().uppercase()
            val cls = when (color) {
                "GREEN" -> "ck-g"
                "RED" -> "ck-r"
                else -> "ck-y"
            }
            "<span class=\"ck $cls\">$name</span>"
        }
    }
}
