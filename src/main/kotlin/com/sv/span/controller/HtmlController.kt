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
        val signalColor = when (r.signal) {
            Signal.BUY -> "#22c55e"
            Signal.SELL -> "#ef4444"
            Signal.HOLD -> "#f59e0b"
        }
        val signalBg = when (r.signal) {
            Signal.BUY -> "#dcfce7"
            Signal.SELL -> "#fee2e2"
            Signal.HOLD -> "#fef3c7"
        }

        val checksHtml = r.checks.joinToString("") { check ->
            val (emoji, color) = when (check.light) {
                CheckLight.GREEN -> "\uD83D\uDFE2" to "#22c55e"
                CheckLight.YELLOW -> "\uD83D\uDFE1" to "#f59e0b"
                CheckLight.RED -> "\uD83D\uDD34" to "#ef4444"
            }
            """
            <div class="check-card" style="border-left: 4px solid $color">
                <div class="check-header">$emoji ${check.name}</div>
                <div class="check-detail">${check.detail}</div>
            </div>
            """
        }

        val revenueRows = r.revenueAnalysis.revenueYears.joinToString("") {
            "<tr><td>${it.fiscalYear}</td><td>${it.revenueFormatted}</td></tr>"
        }

        val projectionHtml = if (r.projection != null) {
            val projRows = r.projection.years.joinToString("") { y ->
                "<tr><td>${y.year}</td><td>${y.revenueFormatted}</td><td>${y.netIncomeFormatted}</td><td>${y.epsFormatted}</td><td style=\"font-weight:600\">${y.priceFormatted}</td></tr>"
            }
            val a = r.projection.assumptions
            """
            <div class="section">
                <h2>3-Year Price Projection</h2>
                <table>
                    <thead><tr><th>Year</th><th>Revenue</th><th>Net Income</th><th>EPS</th><th>Est. Price</th></tr></thead>
                    <tbody>$projRows</tbody>
                </table>
                <div style="margin-top: 12px; padding: 12px; background: #f1f5f9; border-radius: 8px; font-size: 12px; color: #64748b;">
                    <strong>Assumptions:</strong> Base growth ${a.baseGrowthFormatted}, decay ${a.decayFormatted}/yr, 
                    profit margin ${a.marginFormatted}, P/E multiple ${a.peFormatted}<br>
                    ${a.note}
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
            <title>${r.symbol} - Span Screener</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
                .container { max-width: 800px; margin: 0 auto; padding: 24px 16px; }
                .header { text-align: center; margin-bottom: 32px; }
                .header h1 { font-size: 28px; font-weight: 700; }
                .header .company { color: #64748b; font-size: 16px; margin-top: 4px; }
                .signal-badge { display: inline-block; padding: 8px 32px; border-radius: 8px; font-size: 24px; font-weight: 800; letter-spacing: 2px; margin-top: 12px; background: $signalBg; color: $signalColor; }
                .confidence { font-size: 13px; color: #64748b; margin-top: 6px; }
                .section { background: #fff; border-radius: 12px; padding: 20px 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
                .section h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
                .metric { padding: 8px 0; }
                .metric .label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
                .metric .value { font-size: 18px; font-weight: 600; color: #0f172a; }
                .check-card { background: #f8fafc; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; }
                .check-header { font-weight: 600; font-size: 14px; }
                .check-detail { font-size: 13px; color: #64748b; margin-top: 2px; }
                table { width: 100%; border-collapse: collapse; }
                table th, table td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
                table th { color: #64748b; font-weight: 500; font-size: 12px; text-transform: uppercase; }
                .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #94a3b8; }
                .footer a { color: #3b82f6; text-decoration: none; }
                .try-other { text-align: center; margin-top: 20px; }
                .try-other input { padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; width: 120px; text-transform: uppercase; }
                .try-other button { padding: 8px 20px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; margin-left: 8px; }
                .try-other button:hover { background: #2563eb; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${r.symbol}</h1>
                    <div class="company">${r.companyName ?: ""}</div>
                    <div class="signal-badge">${r.signal}</div>
                    <div class="confidence">${r.confidence} confidence</div>
                </div>

                <div class="section">
                    <h2>Screening Checks</h2>
                    $checksHtml
                </div>

                <div class="section">
                    <h2>Overview</h2>
                    <div class="grid">
                        <div class="metric"><div class="label">Price</div><div class="value">${r.overview.priceFormatted ?: "N/A"}</div></div>
                        <div class="metric"><div class="label">Market Cap</div><div class="value">${r.overview.marketCapFormatted ?: "N/A"}</div></div>
                        <div class="metric"><div class="label">EPS (TTM)</div><div class="value">${r.overview.epsTtmFormatted ?: "N/A"}</div></div>
                        <div class="metric"><div class="label">P/E Ratio</div><div class="value">${r.overview.peRatioFormatted ?: "N/A"}</div></div>
                        <div class="metric"><div class="label">P/S Ratio</div><div class="value">${r.overview.priceToSalesFormatted ?: "N/A"}</div></div>
                        <div class="metric"><div class="label">Shares Out</div><div class="value">${r.overview.sharesOutstandingFormatted ?: "N/A"}</div></div>
                    </div>
                </div>

                <div class="section">
                    <h2>Margins (TTM)</h2>
                    <div class="grid">
                        <div class="metric"><div class="label">Gross Margin</div><div class="value">${r.margins.grossMarginFormatted ?: "N/A"}</div></div>
                        <div class="metric"><div class="label">Operating Margin</div><div class="value">${r.margins.operatingMarginFormatted ?: "N/A"}</div></div>
                        <div class="metric"><div class="label">Profit Margin</div><div class="value">${r.margins.profitMarginFormatted ?: "N/A"}</div></div>
                        <div class="metric"><div class="label">FCF Margin</div><div class="value">${r.margins.fcfMarginFormatted ?: "N/A"}</div></div>
                    </div>
                </div>

                <div class="section">
                    <h2>Revenue</h2>
                    <div class="grid">
                        <div class="metric"><div class="label">Revenue (TTM)</div><div class="value">${r.revenueAnalysis.revenueTtmFormatted ?: "N/A"}</div></div>
                        <div class="metric"><div class="label">Net Income (TTM)</div><div class="value">${r.revenueAnalysis.netIncomeTtmFormatted ?: "N/A"}</div></div>
                        <div class="metric"><div class="label">YoY Growth</div><div class="value">${r.revenueAnalysis.revenueGrowthFormatted ?: "N/A"}</div></div>
                    </div>
                    ${if (revenueRows.isNotEmpty()) """
                    <table style="margin-top: 12px;">
                        <thead><tr><th>Fiscal Year</th><th>Revenue</th></tr></thead>
                        <tbody>$revenueRows</tbody>
                    </table>
                    """ else ""}
                </div>

                <div class="section">
                    <h2>Balance Sheet</h2>
                    <div class="grid">
                        <div class="metric"><div class="label">Cash</div><div class="value">${r.balanceSheet.cashFormatted ?: "N/A"}</div></div>
                        <div class="metric"><div class="label">Long-term Debt</div><div class="value">${r.balanceSheet.longTermDebtFormatted ?: "N/A"}</div></div>
                        <div class="metric"><div class="label">Total Debt</div><div class="value">${r.balanceSheet.totalDebtFormatted ?: "N/A"}</div></div>
                        <div class="metric"><div class="label">Cash/Debt</div><div class="value">${r.balanceSheet.cashToDebtFormatted ?: "N/A"}</div></div>
                    </div>
                </div>

                $projectionHtml

                <div class="section">
                    <h2>Technicals</h2>
                    <div class="grid">
                        <div class="metric"><div class="label">SMA (50)</div><div class="value">${r.technicals?.sma50Formatted ?: "N/A"}</div></div>
                        <div class="metric"><div class="label">RSI (14)</div><div class="value">${r.technicals?.rsi14Formatted ?: "N/A"}</div></div>
                        <div class="metric"><div class="label">Trend</div><div class="value">${r.technicals?.priceVsSma50 ?: "N/A"}</div></div>
                    </div>
                </div>

                <div class="try-other">
                    <form onsubmit="window.location='/view/'+document.getElementById('t').value.toUpperCase();return false;">
                        <input id="t" type="text" placeholder="TICKER" maxlength="5">
                        <button type="submit">Analyze</button>
                    </form>
                </div>

                <div class="footer">
                    <a href="/backtest/${r.symbol}" style="color:#3b82f6;text-decoration:none;font-size:14px;font-weight:600;">View 2-Year Backtest &rarr;</a><br><br>
                    Powered by <a href="https://github.com/sridharvukkadapu/span">Span Screener</a> &middot; Data from Massive.com
                </div>
            </div>
        </body>
        </html>
        """.trimIndent()
    }

    private fun errorHtml(symbol: String, error: String): String = """
        <!DOCTYPE html>
        <html><head><title>Error - Span</title>
        <style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;background:#f8fafc;}
        .err{text-align:center;}.err h1{color:#ef4444;} .err p{color:#64748b;margin-top:8px;}</style>
        </head><body><div class="err"><h1>Error analyzing $symbol</h1><p>$error</p>
        <p style="margin-top:20px"><a href="/view/AAPL">Try AAPL instead</a></p></div></body></html>
    """.trimIndent()

    // ==================== BACKTEST HTML ====================

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
        val outColor = if (r.outperformance >= 0) "#22c55e" else "#ef4444"
        val outBg = if (r.outperformance >= 0) "#dcfce7" else "#fee2e2"

        val tradesHtml = r.trades.joinToString("") { t ->
            val emoji = if (t.type == "BUY") "&#x1F7E2;" else "&#x1F534;"
            val retHtml = t.tradeReturnFormatted?.let {
                val c = if ((t.tradeReturn ?: 0.0) >= 0) "#22c55e" else "#ef4444"
                "<span style=\"color:$c;font-weight:600\">$it</span>"
            } ?: ""
            """
            <tr>
                <td>$emoji ${t.type}</td>
                <td>${t.date}</td>
                <td>${t.priceFormatted}</td>
                <td style="font-size:12px">${t.checksSummary}</td>
                <td>$retHtml</td>
            </tr>
            """
        }

        val signalHistoryHtml = r.signalHistory.joinToString("") { s ->
            val (emoji, color) = when (s.signal) {
                Signal.BUY -> "&#x1F7E2;" to "#22c55e"
                Signal.SELL -> "&#x1F534;" to "#ef4444"
                Signal.HOLD -> "&#x1F7E1;" to "#f59e0b"
            }
            val actionStyle = when {
                s.action.startsWith("BUY") -> "color:#22c55e;font-weight:600"
                s.action.startsWith("SELL") -> "color:#ef4444;font-weight:600"
                else -> "color:#94a3b8"
            }
            """
            <tr>
                <td>${s.date}</td>
                <td>${s.priceFormatted}</td>
                <td style="color:$color;font-weight:600">$emoji ${s.signal}</td>
                <td style="font-size:12px">${s.checksSummary}</td>
                <td style="$actionStyle">${s.action}</td>
            </tr>
            """
        }

        // Chart data
        val labels = r.equityCurve.map { "\"${it.date}\"" }.joinToString(",")
        val stratData = r.equityCurve.map { it.strategyValue.toString() }.joinToString(",")
        val bAndHData = r.equityCurve.map { it.buyAndHoldValue.toString() }.joinToString(",")
        val dollar = "$"

        val chartScript = """
            <script>
                var ctx2 = document.getElementById('equityChart').getContext('2d');
                new Chart(ctx2, {
                    type: 'line',
                    data: {
                        labels: [$labels],
                        datasets: [
                            {
                                label: 'Span Strategy',
                                data: [$stratData],
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59,130,246,0.1)',
                                fill: true,
                                tension: 0.3,
                                pointRadius: 0,
                                borderWidth: 2
                            },
                            {
                                label: 'Buy & Hold',
                                data: [$bAndHData],
                                borderColor: '#94a3b8',
                                backgroundColor: 'transparent',
                                borderDash: [5, 5],
                                tension: 0.3,
                                pointRadius: 0,
                                borderWidth: 2
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'top' },
                            tooltip: {
                                callbacks: {
                                    label: function(c) {
                                        return c.dataset.label + ': ${dollar}' + c.parsed.y.toFixed(2);
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                display: true,
                                ticks: { maxTicksLimit: 12, font: { size: 10 } }
                            },
                            y: {
                                display: true,
                                ticks: {
                                    callback: function(v) { return '${dollar}' + v.toLocaleString(); },
                                    font: { size: 10 }
                                }
                            }
                        }
                    }
                });
            </script>
        """

        return """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${r.symbol} Backtest - Span</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0"></script>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
                .container { max-width: 900px; margin: 0 auto; padding: 24px 16px; }
                .header { text-align: center; margin-bottom: 32px; }
                .header h1 { font-size: 28px; font-weight: 700; }
                .header .sub { color: #64748b; font-size: 14px; margin-top: 4px; }
                .result-badge { display: inline-block; padding: 8px 32px; border-radius: 8px; font-size: 20px; font-weight: 800; letter-spacing: 1px; margin-top: 12px; background: $outBg; color: $outColor; }
                .section { background: #fff; border-radius: 12px; padding: 20px 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
                .section h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
                .metric { padding: 8px 0; }
                .metric .label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
                .metric .value { font-size: 18px; font-weight: 600; color: #0f172a; }
                .metric .value.green { color: #22c55e; }
                .metric .value.red { color: #ef4444; }
                table { width: 100%; border-collapse: collapse; }
                table th, table td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
                table th { color: #64748b; font-weight: 500; font-size: 11px; text-transform: uppercase; }
                .chart-container { position: relative; height: 320px; margin-top: 8px; }
                .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #94a3b8; }
                .footer a { color: #3b82f6; text-decoration: none; }
                .nav { text-align: center; margin-bottom: 16px; }
                .nav a { color: #3b82f6; text-decoration: none; margin: 0 12px; font-size: 14px; }
                .disclaimer { margin-top: 16px; padding: 12px; background: #fef3c7; border-radius: 8px; font-size: 11px; color: #92400e; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="nav">
                    <a href="/view/${r.symbol}">&larr; Back to Screener</a>
                </div>

                <div class="header">
                    <h1>${r.symbol} Backtest</h1>
                    <div class="sub">${r.companyName ?: ""} &middot; ${r.periodStart} to ${r.periodEnd}</div>
                    <div class="result-badge">
                        ${if (r.outperformance >= 0) "OUTPERFORMED" else "UNDERPERFORMED"} by ${r.outperformanceFormatted}
                    </div>
                </div>

                <div class="section">
                    <h2>Performance Summary</h2>
                    <div class="grid">
                        <div class="metric"><div class="label">Initial Investment</div><div class="value">${"$"}${String.format("%,.2f", r.initialInvestment)}</div></div>
                        <div class="metric"><div class="label">Strategy Final</div><div class="value ${if (r.strategyReturn >= 0) "green" else "red"}">${r.strategyFinalFormatted}</div></div>
                        <div class="metric"><div class="label">Buy & Hold Final</div><div class="value">${r.buyAndHoldFinalFormatted}</div></div>
                        <div class="metric"><div class="label">Strategy Return</div><div class="value ${if (r.strategyReturn >= 0) "green" else "red"}">${r.strategyReturnFormatted}</div></div>
                        <div class="metric"><div class="label">Buy & Hold Return</div><div class="value">${r.buyAndHoldReturnFormatted}</div></div>
                        <div class="metric"><div class="label">Total Trades</div><div class="value">${r.totalTrades}</div></div>
                        <div class="metric"><div class="label">Win / Loss</div><div class="value">${r.winningTrades}W / ${r.losingTrades}L</div></div>
                        <div class="metric"><div class="label">Win Rate</div><div class="value">${r.winRateFormatted ?: "N/A"}</div></div>
                    </div>
                </div>

                <div class="section">
                    <h2>Equity Curve (${'$'}10,000 invested)</h2>
                    <div class="chart-container">
                        <canvas id="equityChart"></canvas>
                    </div>
                </div>

                <div class="section">
                    <h2>Signal History (${r.signalHistory.size} evaluations)</h2>
                    <table>
                        <thead><tr><th>Date</th><th>Price</th><th>Signal</th><th>Checks</th><th>Action Taken</th></tr></thead>
                        <tbody>$signalHistoryHtml</tbody>
                    </table>
                    ${if (r.signalHistory.isEmpty()) "<p style='color:#94a3b8;text-align:center;padding:16px;'>No signal evaluations during this period.</p>" else ""}
                </div>

                <div class="section">
                    <h2>Trade Log</h2>
                    <table>
                        <thead><tr><th>Action</th><th>Date</th><th>Price</th><th>Checks</th><th>Return</th></tr></thead>
                        <tbody>$tradesHtml</tbody>
                    </table>
                    ${if (r.trades.isEmpty()) "<p style='color:#94a3b8;text-align:center;padding:16px;'>No trades triggered during this period.</p>" else ""}
                </div>

                <div class="disclaimer">
                    <strong>Disclaimer:</strong> This backtest is for educational purposes only. It uses the same 5-check screening algorithm applied retroactively to historical data. 
                    Past performance does not guarantee future results. Trading involves risk. The simulation assumes instant execution at closing prices with no slippage or fees.
                </div>

                <div class="footer">
                    Powered by <a href="https://github.com/sridharvukkadapu/span">Span Screener</a> &middot; Data from Massive.com
                </div>
            </div>

            $chartScript
        </body>
        </html>
        """.trimIndent()
    }
}
