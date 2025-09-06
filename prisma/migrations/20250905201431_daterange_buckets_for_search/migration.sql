-- CreateTable
CREATE TABLE "public"."yearbucket" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "range_start" TIMESTAMP(3) NOT NULL,
    "range_end" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yearbucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."monthbucket" (
    "id" SERIAL NOT NULL,
    "month" INTEGER NOT NULL,
    "range_start" TIMESTAMP(3) NOT NULL,
    "range_end" TIMESTAMP(3) NOT NULL,
    "yearbucketid" INTEGER NOT NULL,

    CONSTRAINT "monthbucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."weekbucket" (
    "id" SERIAL NOT NULL,
    "week" INTEGER NOT NULL,
    "range_start" TIMESTAMP(3) NOT NULL,
    "range_end" TIMESTAMP(3) NOT NULL,
    "monthbucketid" INTEGER NOT NULL,

    CONSTRAINT "weekbucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."artiststat" (
    "id" SERIAL NOT NULL,
    "artist_id" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "bucket_scope" TEXT NOT NULL,
    "yearbucketid" INTEGER,
    "monthbucketid" INTEGER,
    "weekbucketid" INTEGER,

    CONSTRAINT "artiststat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trackstat" (
    "id" SERIAL NOT NULL,
    "track_id" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "bucket_scope" TEXT NOT NULL,
    "yearbucketid" INTEGER,
    "monthbucketid" INTEGER,
    "weekbucketid" INTEGER,

    CONSTRAINT "trackstat_pkey" PRIMARY KEY ("id")
);
