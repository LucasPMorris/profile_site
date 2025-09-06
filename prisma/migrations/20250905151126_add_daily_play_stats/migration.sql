-- CreateTable
CREATE TABLE "public"."spdailyplaystats" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weekday" TEXT NOT NULL,
    "hourly_plays" JSONB NOT NULL,

    CONSTRAINT "spdailyplaystats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."spdailytrackstat" (
    "id" SERIAL NOT NULL,
    "stats_id" INTEGER NOT NULL,
    "track_id" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "spdailytrackstat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."spdailyartiststat" (
    "id" SERIAL NOT NULL,
    "stats_id" INTEGER NOT NULL,
    "artist_id" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "spdailyartiststat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "spdailyplaystats_date_key" ON "public"."spdailyplaystats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "spdailytrackstat_stats_id_track_id_key" ON "public"."spdailytrackstat"("stats_id", "track_id");

-- CreateIndex
CREATE UNIQUE INDEX "spdailyartiststat_stats_id_artist_id_key" ON "public"."spdailyartiststat"("stats_id", "artist_id");
