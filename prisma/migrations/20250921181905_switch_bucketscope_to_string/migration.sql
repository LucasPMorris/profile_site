/*
  Warnings:

  - The `bucket_scope` column on the `artiststat` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `bucket_scope` column on the `daybucket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `bucket_scope` column on the `trackstat` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."artiststat" DROP COLUMN "bucket_scope",
ADD COLUMN     "bucket_scope" TEXT NOT NULL DEFAULT 'day';

-- AlterTable
ALTER TABLE "public"."daybucket" DROP COLUMN "bucket_scope",
ADD COLUMN     "bucket_scope" TEXT NOT NULL DEFAULT 'day';

-- AlterTable
ALTER TABLE "public"."trackstat" DROP COLUMN "bucket_scope",
ADD COLUMN     "bucket_scope" TEXT NOT NULL DEFAULT 'day';

-- DropEnum
DROP TYPE "public"."Bucketscope";
