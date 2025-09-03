/*
  Warnings:

  - The primary key for the `spalbum` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `spalbumartist` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `spartist` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `spplayhistory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `sptrack` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `sptrackartist` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "public"."spalbum" DROP CONSTRAINT "spalbum_pkey",
ALTER COLUMN "album_id" DROP DEFAULT,
ALTER COLUMN "album_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "spalbum_pkey" PRIMARY KEY ("album_id");
DROP SEQUENCE "spalbum_album_id_seq";

-- AlterTable
ALTER TABLE "public"."spalbumartist" DROP CONSTRAINT "spalbumartist_pkey",
ALTER COLUMN "album_id" SET DATA TYPE TEXT,
ALTER COLUMN "artist_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "spalbumartist_pkey" PRIMARY KEY ("album_id", "artist_id");

-- AlterTable
ALTER TABLE "public"."spartist" DROP CONSTRAINT "spartist_pkey",
ALTER COLUMN "artist_id" DROP DEFAULT,
ALTER COLUMN "artist_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "spartist_pkey" PRIMARY KEY ("artist_id");
DROP SEQUENCE "spartist_artist_id_seq";

-- AlterTable
ALTER TABLE "public"."spplayhistory" DROP CONSTRAINT "spplayhistory_pkey",
ALTER COLUMN "track_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "spplayhistory_pkey" PRIMARY KEY ("track_id", "played_at");

-- AlterTable
ALTER TABLE "public"."sptrack" DROP CONSTRAINT "sptrack_pkey",
ALTER COLUMN "track_id" DROP DEFAULT,
ALTER COLUMN "track_id" SET DATA TYPE TEXT,
ALTER COLUMN "albums_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "sptrack_pkey" PRIMARY KEY ("track_id");
DROP SEQUENCE "sptrack_track_id_seq";

-- AlterTable
ALTER TABLE "public"."sptrackartist" DROP CONSTRAINT "sptrackartist_pkey",
ALTER COLUMN "track_id" SET DATA TYPE TEXT,
ALTER COLUMN "artist_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "sptrackartist_pkey" PRIMARY KEY ("track_id", "artist_id");
