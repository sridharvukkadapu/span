-- Watchlist: stores tickers saved by a browser session (no auth required)
-- session_id is a UUID stored in a cookie on the client
CREATE TABLE watchlist (
    id         BIGSERIAL    PRIMARY KEY,
    session_id VARCHAR(36)  NOT NULL,
    ticker     VARCHAR(10)  NOT NULL,
    added_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_watchlist_session_ticker UNIQUE (session_id, ticker)
);

CREATE INDEX idx_watchlist_session ON watchlist (session_id);
