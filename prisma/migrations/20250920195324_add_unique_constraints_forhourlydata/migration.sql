/*
  Warnings:

  - A unique constraint covering the columns `[artist_id,weekbucketid]` on the table `artiststat` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[artist_id,monthbucketid]` on the table `artiststat` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[artist_id,yearbucketid]` on the table `artiststat` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[track_id,weekbucketid]` on the table `trackstat` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[track_id,monthbucketid]` on the table `trackstat` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[track_id,yearbucketid]` on the table `trackstat` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "artiststat_artist_id_weekbucketid_key" ON "public"."artiststat"("artist_id", "weekbucketid");

-- CreateIndex
CREATE UNIQUE INDEX "artiststat_artist_id_monthbucketid_key" ON "public"."artiststat"("artist_id", "monthbucketid");

-- CreateIndex
CREATE UNIQUE INDEX "artiststat_artist_id_yearbucketid_key" ON "public"."artiststat"("artist_id", "yearbucketid");

-- CreateIndex
CREATE UNIQUE INDEX "trackstat_track_id_weekbucketid_key" ON "public"."trackstat"("track_id", "weekbucketid");

-- CreateIndex
CREATE UNIQUE INDEX "trackstat_track_id_monthbucketid_key" ON "public"."trackstat"("track_id", "monthbucketid");

-- CreateIndex
CREATE UNIQUE INDEX "trackstat_track_id_yearbucketid_key" ON "public"."trackstat"("track_id", "yearbucketid");
