/*
  Warnings:

  - Added the required column `artist_url` to the `spartist` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."spartist" ADD COLUMN     "artist_url" TEXT NOT NULL;
