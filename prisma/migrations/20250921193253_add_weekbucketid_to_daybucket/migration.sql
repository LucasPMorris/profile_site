-- AlterTable
ALTER TABLE "public"."daybucket" ADD COLUMN "weekbucketid" INTEGER;

CREATE INDEX IF NOT EXISTS "idx_spplayhistory_track_id" ON "spplayhistory"("track_id");

-- Index for spplayhistory.played_at (used for ordering recent plays)
CREATE INDEX IF NOT EXISTS "idx_spplayhistory_played_at" ON "spplayhistory"("played_at");

-- Compound index for spplayhistory queries that filter by track_id and order by played_at
CREATE INDEX IF NOT EXISTS "idx_spplayhistory_track_played" ON "spplayhistory"("track_id", "played_at");

-- Index for sptrack.isrc (used heavily in top tracks queries)
CREATE INDEX IF NOT EXISTS "idx_sptrack_isrc" ON "sptrack"("isrc");

-- Index for sptrack.track_id (primary key should already be indexed, but ensuring)
CREATE INDEX IF NOT EXISTS "idx_sptrack_track_id" ON "sptrack"("track_id");

-- Index for sptrackartist.track_id (used in joins)
CREATE INDEX IF NOT EXISTS "idx_sptrackartist_track_id" ON "sptrackartist"("track_id");

-- Index for sptrackartist.artist_id (used in joins)  
CREATE INDEX IF NOT EXISTS "idx_sptrackartist_artist_id" ON "sptrackartist"("artist_id");

-- Index for spartist.artist_id (primary key should already be indexed)
CREATE INDEX IF NOT EXISTS "idx_spartist_artist_id" ON "spartist"("artist_id");

-- Index for spalbum.album_id (primary key should already be indexed)
CREATE INDEX IF NOT EXISTS "idx_spalbum_album_id" ON "spalbum"("album_id");