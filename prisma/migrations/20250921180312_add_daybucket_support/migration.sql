/*
  Warnings:

  - The `bucket_scope` column on the `artiststat` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `bucket_scope` column on the `trackstat` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `stat_date` on table `artiststat` required. This step will fail if there are existing NULL values in that column.
  - Made the column `stat_date` on table `trackstat` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."Bucketscope" AS ENUM ('day', 'week', 'month', 'year');

-- AlterTable
ALTER TABLE "public"."artiststat" ADD COLUMN     "daybucketid" INTEGER,
DROP COLUMN "bucket_scope",
ADD COLUMN     "bucket_scope" "public"."Bucketscope" NOT NULL DEFAULT 'day',
ALTER COLUMN "stat_date" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."trackstat" ADD COLUMN     "daybucketid" INTEGER,
DROP COLUMN "bucket_scope",
ADD COLUMN     "bucket_scope" "public"."Bucketscope" NOT NULL DEFAULT 'day',
ALTER COLUMN "stat_date" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."daybucket" (
    "id" SERIAL NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "bucket_scope" "public"."Bucketscope" NOT NULL DEFAULT 'day',

    CONSTRAINT "daybucket_pkey" PRIMARY KEY ("id")
);
