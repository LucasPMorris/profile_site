-- AlterTable
ALTER TABLE "public"."artiststat" ADD COLUMN     "hourly_plays" JSONB;

-- AlterTable
ALTER TABLE "public"."trackstat" ADD COLUMN     "hourly_plays" JSONB;
