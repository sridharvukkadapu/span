# Span Stock Screener

A stock screening API built with Kotlin and Spring Boot that fetches real-time financial data from the Massive.com API, runs 5 screening checks, and returns a BUY/SELL/HOLD recommendation.

## Run Locally

```bash
./gradlew bootRun
```

## Test

```bash
curl http://localhost:8080/api/v1/tickers/AAPL/recommendation | python3 -m json.tool
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MASSIVE_API_KEY` | Massive.com API key | (built-in dev key) |

## Deploy to Render

1. Push to GitHub
2. Connect repo on [render.com](https://render.com)
3. Set `MASSIVE_API_KEY` environment variable
4. Deploy using the included `render.yaml`
