CREATE TABLE ticker_cache (
    id          BIGSERIAL    PRIMARY KEY,
    namespace   VARCHAR(32)  NOT NULL,
    ticker      VARCHAR(10)  NOT NULL,
    type_name   VARCHAR(255) NOT NULL DEFAULT '',
    payload     JSONB        NOT NULL,
    computed_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMP    NOT NULL,
    compute_ms  BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT uq_ticker_cache_ns_ticker UNIQUE (namespace, ticker)
);

CREATE INDEX idx_ticker_cache_ns_ticker ON ticker_cache (namespace, ticker);
CREATE INDEX idx_ticker_cache_expires   ON ticker_cache (expires_at);
