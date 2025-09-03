/*
  Warnings:

  - You are about to drop the column `albums_id` on the `sptrack` table. All the data in the column will be lost.
  - Added the required column `album_id` to the `sptrack` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isrc` to the `sptrack` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."sptrack" DROP COLUMN "albums_id",
ADD COLUMN     "album_id" TEXT NOT NULL,
ADD COLUMN     "isrc" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "sptrack_isrc_idx" ON "public"."sptrack"("isrc");
