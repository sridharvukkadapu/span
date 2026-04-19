-- Re-add unique constraint dropped during V3 ALTER COLUMN (Supabase/pgpool may have lost it)
ALTER TABLE ticker_cache DROP CONSTRAINT IF EXISTS uq_ticker_cache_ns_ticker;
ALTER TABLE ticker_cache ADD CONSTRAINT uq_ticker_cache_ns_ticker UNIQUE (namespace, ticker);
