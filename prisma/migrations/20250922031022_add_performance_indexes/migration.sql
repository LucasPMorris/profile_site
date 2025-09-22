/*
  Warnings:

  - The primary key for the `spplayhistory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[track_id,played_at]` on the table `spplayhistory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."sptrack_track_id_idx";

-- AlterTable
ALTER TABLE "public"."spalbum" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."spartist" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "artist_url" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."spplayhistory" DROP CONSTRAINT "spplayhistory_pkey",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "spplayhistory_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."sptrack" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "duration" DROP NOT NULL,
ALTER COLUMN "explicit" SET DEFAULT false,
ALTER COLUMN "isrc" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "idx_spalbum_name" ON "public"."spalbum"("name");

-- CreateIndex
CREATE INDEX "idx_spalbum_release_date" ON "public"."spalbum"("release_date");

-- CreateIndex
CREATE INDEX "idx_spalbumartist_album_artist" ON "public"."spalbumartist"("album_id", "artist_id");

-- CreateIndex
CREATE INDEX "idx_spalbumartist_artist_id" ON "public"."spalbumartist"("artist_id");

-- CreateIndex
CREATE INDEX "idx_spartist_name" ON "public"."spartist"("name");

-- CreateIndex
CREATE INDEX "idx_spplayhistory_played_at_track_id" ON "public"."spplayhistory"("played_at" DESC, "track_id");

-- CreateIndex
CREATE INDEX "idx_spplayhistory_track_id" ON "public"."spplayhistory"("track_id");

-- CreateIndex
CREATE UNIQUE INDEX "spplayhistory_track_id_played_at_key" ON "public"."spplayhistory"("track_id", "played_at");

-- CreateIndex
CREATE INDEX "idx_sptrack_common_album_id" ON "public"."sptrack"("common_album_id");

-- CreateIndex
CREATE INDEX "idx_sptrack_explicit" ON "public"."sptrack"("explicit");

-- CreateIndex
CREATE INDEX "idx_sptrack_album_id" ON "public"."sptrack"("album_id");

-- CreateIndex
CREATE INDEX "idx_sptrackartist_track_artist" ON "public"."sptrackartist"("track_id", "artist_id");

-- RenameIndex
ALTER INDEX "public"."spplayhistory_played_at_idx" RENAME TO "idx_spplayhistory_played_at";

-- RenameIndex
ALTER INDEX "public"."sptrack_isrc_idx" RENAME TO "idx_sptrack_isrc";

-- RenameIndex
ALTER INDEX "public"."sptrackartist_artist_id_idx" RENAME TO "idx_sptrackartist_artist_id";