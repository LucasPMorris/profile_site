/*
  Warnings:

  - A unique constraint covering the columns `[artist_id,stat_date]` on the table `artiststat` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[track_id,stat_date]` on the table `trackstat` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `stat_date` to the `artiststat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stat_date` to the `trackstat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."artiststat" ADD COLUMN     "stat_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."trackstat" ADD COLUMN     "stat_date" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "artiststat_artist_id_stat_date_key" ON "public"."artiststat"("artist_id", "stat_date");

-- CreateIndex
CREATE UNIQUE INDEX "trackstat_track_id_stat_date_key" ON "public"."trackstat"("track_id", "stat_date");
