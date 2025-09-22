-- This migration was applied directly to the database
-- Indexes for bucket date ranges
CREATE INDEX IF NOT EXISTS "idx_yearbucket_date_range" ON "yearbucket"("range_start", "range_end");
CREATE INDEX IF NOT EXISTS "idx_monthbucket_date_range" ON "monthbucket"("range_start", "range_end");
CREATE INDEX IF NOT EXISTS "idx_weekbucket_date_range" ON "weekbucket"("range_start", "range_end");

-- Indexes for stats queries
CREATE INDEX IF NOT EXISTS "idx_artiststat_bucket_scope" ON "artiststat"("bucket_scope");
CREATE INDEX IF NOT EXISTS "idx_artiststat_yearbucketid" ON "artiststat"("yearbucketid");
CREATE INDEX IF NOT EXISTS "idx_trackstat_bucket_scope" ON "trackstat"("bucket_scope");
CREATE INDEX IF NOT EXISTS "idx_trackstat_yearbucketid" ON "trackstat"("yearbucketid");

-- Daily stats index
CREATE INDEX IF NOT EXISTS "idx_spdailyplaystats_date" ON "spdailyplaystats"("date");