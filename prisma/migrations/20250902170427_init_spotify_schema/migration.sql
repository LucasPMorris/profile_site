-- CreateTable
CREATE TABLE "public"."spartist" (
    "artist_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT,

    CONSTRAINT "spartist_pkey" PRIMARY KEY ("artist_id")
);

-- CreateTable
CREATE TABLE "public"."spalbum" (
    "album_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "release_date" TIMESTAMP(3),
    "image_url" TEXT,

    CONSTRAINT "spalbum_pkey" PRIMARY KEY ("album_id")
);

-- CreateTable
CREATE TABLE "public"."spalbumartist" (
    "album_id" INTEGER NOT NULL,
    "artist_id" INTEGER NOT NULL,

    CONSTRAINT "spalbumartist_pkey" PRIMARY KEY ("album_id","artist_id")
);

-- CreateTable
CREATE TABLE "public"."sptrack" (
    "track_id" SERIAL NOT NULL,
    "albums_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "song_url" TEXT,
    "explicit" BOOLEAN NOT NULL,

    CONSTRAINT "sptrack_pkey" PRIMARY KEY ("track_id")
);

-- CreateTable
CREATE TABLE "public"."sptrackartist" (
    "track_id" INTEGER NOT NULL,
    "artist_id" INTEGER NOT NULL,

    CONSTRAINT "sptrackartist_pkey" PRIMARY KEY ("track_id","artist_id")
);

-- CreateTable
CREATE TABLE "public"."spplayhistory" (
    "track_id" INTEGER NOT NULL,
    "played_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spplayhistory_pkey" PRIMARY KEY ("track_id","played_at")
);

-- CreateIndex
CREATE INDEX "sptrack_track_id_idx" ON "public"."sptrack"("track_id");

-- CreateIndex
CREATE INDEX "sptrackartist_artist_id_idx" ON "public"."sptrackartist"("artist_id");

-- CreateIndex
CREATE INDEX "spplayhistory_played_at_idx" ON "public"."spplayhistory"("played_at");
