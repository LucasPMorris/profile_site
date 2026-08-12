--
-- PostgreSQL database dump
--

\restrict 3T6xVvLTqpTg8dsND2psNSXO6e9F6rqG7XUoc1grhYOnCThhhqAMBZLJdloFfWt

-- Dumped from database version 17.9 (Debian 17.9-1.pgdg12+1)
-- Dumped by pg_dump version 17.9 (Ubuntu 17.9-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: template_2
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO template_2;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: template_2
--

COMMENT ON SCHEMA public IS '';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _PostCategories; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public."_PostCategories" (
    "A" integer NOT NULL,
    "B" integer NOT NULL
);


ALTER TABLE public."_PostCategories" OWNER TO template_2;

--
-- Name: _PostTags; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public."_PostTags" (
    "A" integer NOT NULL,
    "B" integer NOT NULL
);


ALTER TABLE public."_PostTags" OWNER TO template_2;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO template_2;

--
-- Name: artiststat; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public.artiststat (
    id integer NOT NULL,
    artist_id text NOT NULL,
    count integer NOT NULL,
    yearbucketid integer,
    monthbucketid integer,
    hourly_plays jsonb,
    stat_date timestamp(3) without time zone NOT NULL,
    daybucketid integer,
    bucket_scope text DEFAULT 'day'::text NOT NULL
);


ALTER TABLE public.artiststat OWNER TO template_2;

--
-- Name: artiststat_id_seq; Type: SEQUENCE; Schema: public; Owner: template_2
--

CREATE SEQUENCE public.artiststat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.artiststat_id_seq OWNER TO template_2;

--
-- Name: artiststat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: template_2
--

ALTER SEQUENCE public.artiststat_id_seq OWNED BY public.artiststat.id;


--
-- Name: attachment; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public.attachment (
    id integer NOT NULL,
    href text NOT NULL,
    "postId" integer NOT NULL
);


ALTER TABLE public.attachment OWNER TO template_2;

--
-- Name: attachment_id_seq; Type: SEQUENCE; Schema: public; Owner: template_2
--

CREATE SEQUENCE public.attachment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attachment_id_seq OWNER TO template_2;

--
-- Name: attachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: template_2
--

ALTER SEQUENCE public.attachment_id_seq OWNED BY public.attachment.id;


--
-- Name: blogPost; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public."blogPost" (
    id integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    modified timestamp(3) without time zone NOT NULL,
    slug text NOT NULL,
    status text NOT NULL,
    link text NOT NULL,
    title text NOT NULL,
    "contentHtml" text NOT NULL,
    "contentMarkdown" text NOT NULL,
    "contentProtected" boolean DEFAULT false NOT NULL,
    "excerptHtml" text NOT NULL,
    "excerptProtected" boolean DEFAULT false NOT NULL,
    "authorId" integer NOT NULL,
    "featuredMediaId" integer,
    sticky boolean DEFAULT false NOT NULL,
    template text NOT NULL,
    format text NOT NULL,
    footnotes text NOT NULL,
    "featuredImageUrl" text,
    "totalViewsCount" integer DEFAULT 0 NOT NULL,
    "rawMD" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."blogPost" OWNER TO template_2;

--
-- Name: blogPost_id_seq; Type: SEQUENCE; Schema: public; Owner: template_2
--

CREATE SEQUENCE public."blogPost_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."blogPost_id_seq" OWNER TO template_2;

--
-- Name: blogPost_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: template_2
--

ALTER SEQUENCE public."blogPost_id_seq" OWNED BY public."blogPost".id;


--
-- Name: category; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public.category (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL
);


ALTER TABLE public.category OWNER TO template_2;

--
-- Name: category_id_seq; Type: SEQUENCE; Schema: public; Owner: template_2
--

CREATE SEQUENCE public.category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.category_id_seq OWNER TO template_2;

--
-- Name: category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: template_2
--

ALTER SEQUENCE public.category_id_seq OWNED BY public.category.id;


--
-- Name: contentmeta; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public.contentmeta (
    id integer NOT NULL,
    slug text NOT NULL,
    type text NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.contentmeta OWNER TO template_2;

--
-- Name: contentmeta_id_seq; Type: SEQUENCE; Schema: public; Owner: template_2
--

CREATE SEQUENCE public.contentmeta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contentmeta_id_seq OWNER TO template_2;

--
-- Name: contentmeta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: template_2
--

ALTER SEQUENCE public.contentmeta_id_seq OWNED BY public.contentmeta.id;


--
-- Name: daybucket; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public.daybucket (
    id integer NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    bucket_scope text DEFAULT 'day'::text NOT NULL,
    monthbucketid integer NOT NULL
);


ALTER TABLE public.daybucket OWNER TO template_2;

--
-- Name: daybucket_id_seq; Type: SEQUENCE; Schema: public; Owner: template_2
--

CREATE SEQUENCE public.daybucket_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daybucket_id_seq OWNER TO template_2;

--
-- Name: daybucket_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: template_2
--

ALTER SEQUENCE public.daybucket_id_seq OWNED BY public.daybucket.id;


--
-- Name: media; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public.media (
    id integer NOT NULL,
    url text NOT NULL,
    description text
);


ALTER TABLE public.media OWNER TO template_2;

--
-- Name: media_id_seq; Type: SEQUENCE; Schema: public; Owner: template_2
--

CREATE SEQUENCE public.media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.media_id_seq OWNER TO template_2;

--
-- Name: media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: template_2
--

ALTER SEQUENCE public.media_id_seq OWNED BY public.media.id;


--
-- Name: monthbucket; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public.monthbucket (
    id integer NOT NULL,
    month integer NOT NULL,
    range_start timestamp(3) without time zone NOT NULL,
    range_end timestamp(3) without time zone NOT NULL,
    yearbucketid integer NOT NULL
);


ALTER TABLE public.monthbucket OWNER TO template_2;

--
-- Name: monthbucket_id_seq; Type: SEQUENCE; Schema: public; Owner: template_2
--

CREATE SEQUENCE public.monthbucket_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.monthbucket_id_seq OWNER TO template_2;

--
-- Name: monthbucket_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: template_2
--

ALTER SEQUENCE public.monthbucket_id_seq OWNED BY public.monthbucket.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    image text NOT NULL,
    link_demo text,
    link_github text,
    stacks text NOT NULL,
    is_show boolean DEFAULT true NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    content text,
    is_featured boolean DEFAULT false NOT NULL,
    "rawMD" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.projects OWNER TO template_2;

--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: template_2
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projects_id_seq OWNER TO template_2;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: template_2
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: spalbum; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public.spalbum (
    album_id text NOT NULL,
    name text NOT NULL,
    release_date timestamp(3) without time zone,
    image_url text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.spalbum OWNER TO template_2;

--
-- Name: spalbumartist; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public.spalbumartist (
    album_id text NOT NULL,
    artist_id text NOT NULL
);


ALTER TABLE public.spalbumartist OWNER TO template_2;

--
-- Name: spartist; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public.spartist (
    artist_id text NOT NULL,
    name text NOT NULL,
    image_url text,
    artist_url text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.spartist OWNER TO template_2;

--
-- Name: spdailyplaystats; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public.spdailyplaystats (
    id integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    weekday text NOT NULL,
    hourly_plays jsonb NOT NULL
);


ALTER TABLE public.spdailyplaystats OWNER TO template_2;

--
-- Name: spdailyplaystats_id_seq; Type: SEQUENCE; Schema: public; Owner: template_2
--

CREATE SEQUENCE public.spdailyplaystats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.spdailyplaystats_id_seq OWNER TO template_2;

--
-- Name: spdailyplaystats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: template_2
--

ALTER SEQUENCE public.spdailyplaystats_id_seq OWNED BY public.spdailyplaystats.id;


--
-- Name: spplayhistory; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public.spplayhistory (
    track_id text NOT NULL,
    played_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public.spplayhistory OWNER TO template_2;

--
-- Name: spplayhistory_id_seq; Type: SEQUENCE; Schema: public; Owner: template_2
--

CREATE SEQUENCE public.spplayhistory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.spplayhistory_id_seq OWNER TO template_2;

--
-- Name: spplayhistory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: template_2
--

ALTER SEQUENCE public.spplayhistory_id_seq OWNED BY public.spplayhistory.id;


--
-- Name: sptrack; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public.sptrack (
    track_id text NOT NULL,
    title text NOT NULL,
    duration integer,
    song_url text,
    explicit boolean DEFAULT false NOT NULL,
    release_date timestamp(3) without time zone,
    album_id text NOT NULL,
    isrc text,
    common_album_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sptrack OWNER TO template_2;

--
-- Name: sptrackartist; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public.sptrackartist (
    track_id text NOT NULL,
    artist_id text NOT NULL
);


ALTER TABLE public.sptrackartist OWNER TO template_2;

--
-- Name: tag; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public.tag (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL
);


ALTER TABLE public.tag OWNER TO template_2;

--
-- Name: tag_id_seq; Type: SEQUENCE; Schema: public; Owner: template_2
--

CREATE SEQUENCE public.tag_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tag_id_seq OWNER TO template_2;

--
-- Name: tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: template_2
--

ALTER SEQUENCE public.tag_id_seq OWNED BY public.tag.id;


--
-- Name: term; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public.term (
    id integer NOT NULL,
    taxonomy text NOT NULL,
    embeddable boolean DEFAULT true NOT NULL,
    href text NOT NULL,
    "postId" integer NOT NULL
);


ALTER TABLE public.term OWNER TO template_2;

--
-- Name: term_id_seq; Type: SEQUENCE; Schema: public; Owner: template_2
--

CREATE SEQUENCE public.term_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.term_id_seq OWNER TO template_2;

--
-- Name: term_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: template_2
--

ALTER SEQUENCE public.term_id_seq OWNED BY public.term.id;


--
-- Name: trackstat; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public.trackstat (
    id integer NOT NULL,
    track_id text NOT NULL,
    count integer NOT NULL,
    yearbucketid integer,
    monthbucketid integer,
    hourly_plays jsonb,
    stat_date timestamp(3) without time zone NOT NULL,
    daybucketid integer,
    bucket_scope text DEFAULT 'day'::text NOT NULL
);


ALTER TABLE public.trackstat OWNER TO template_2;

--
-- Name: trackstat_id_seq; Type: SEQUENCE; Schema: public; Owner: template_2
--

CREATE SEQUENCE public.trackstat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trackstat_id_seq OWNER TO template_2;

--
-- Name: trackstat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: template_2
--

ALTER SEQUENCE public.trackstat_id_seq OWNED BY public.trackstat.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public."user" (
    user_id integer NOT NULL,
    name text NOT NULL,
    username text NOT NULL,
    "twitterUsername" text,
    "githubUsername" text,
    "websiteUrl" text,
    "profileImage" text
);


ALTER TABLE public."user" OWNER TO template_2;

--
-- Name: user_user_id_seq; Type: SEQUENCE; Schema: public; Owner: template_2
--

CREATE SEQUENCE public.user_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_user_id_seq OWNER TO template_2;

--
-- Name: user_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: template_2
--

ALTER SEQUENCE public.user_user_id_seq OWNED BY public."user".user_id;


--
-- Name: yearbucket; Type: TABLE; Schema: public; Owner: template_2
--

CREATE TABLE public.yearbucket (
    id integer NOT NULL,
    year integer NOT NULL,
    range_start timestamp(3) without time zone NOT NULL,
    range_end timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.yearbucket OWNER TO template_2;

--
-- Name: yearbucket_id_seq; Type: SEQUENCE; Schema: public; Owner: template_2
--

CREATE SEQUENCE public.yearbucket_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.yearbucket_id_seq OWNER TO template_2;

--
-- Name: yearbucket_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: template_2
--

ALTER SEQUENCE public.yearbucket_id_seq OWNED BY public.yearbucket.id;


--
-- Name: artiststat id; Type: DEFAULT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.artiststat ALTER COLUMN id SET DEFAULT nextval('public.artiststat_id_seq'::regclass);


--
-- Name: attachment id; Type: DEFAULT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.attachment ALTER COLUMN id SET DEFAULT nextval('public.attachment_id_seq'::regclass);


--
-- Name: blogPost id; Type: DEFAULT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public."blogPost" ALTER COLUMN id SET DEFAULT nextval('public."blogPost_id_seq"'::regclass);


--
-- Name: category id; Type: DEFAULT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.category ALTER COLUMN id SET DEFAULT nextval('public.category_id_seq'::regclass);


--
-- Name: contentmeta id; Type: DEFAULT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.contentmeta ALTER COLUMN id SET DEFAULT nextval('public.contentmeta_id_seq'::regclass);


--
-- Name: daybucket id; Type: DEFAULT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.daybucket ALTER COLUMN id SET DEFAULT nextval('public.daybucket_id_seq'::regclass);


--
-- Name: media id; Type: DEFAULT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.media ALTER COLUMN id SET DEFAULT nextval('public.media_id_seq'::regclass);


--
-- Name: monthbucket id; Type: DEFAULT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.monthbucket ALTER COLUMN id SET DEFAULT nextval('public.monthbucket_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: spdailyplaystats id; Type: DEFAULT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.spdailyplaystats ALTER COLUMN id SET DEFAULT nextval('public.spdailyplaystats_id_seq'::regclass);


--
-- Name: spplayhistory id; Type: DEFAULT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.spplayhistory ALTER COLUMN id SET DEFAULT nextval('public.spplayhistory_id_seq'::regclass);


--
-- Name: tag id; Type: DEFAULT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.tag ALTER COLUMN id SET DEFAULT nextval('public.tag_id_seq'::regclass);


--
-- Name: term id; Type: DEFAULT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.term ALTER COLUMN id SET DEFAULT nextval('public.term_id_seq'::regclass);


--
-- Name: trackstat id; Type: DEFAULT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.trackstat ALTER COLUMN id SET DEFAULT nextval('public.trackstat_id_seq'::regclass);


--
-- Name: user user_id; Type: DEFAULT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public."user" ALTER COLUMN user_id SET DEFAULT nextval('public.user_user_id_seq'::regclass);


--
-- Name: yearbucket id; Type: DEFAULT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.yearbucket ALTER COLUMN id SET DEFAULT nextval('public.yearbucket_id_seq'::regclass);


--
-- Name: _PostCategories _PostCategories_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public."_PostCategories"
    ADD CONSTRAINT "_PostCategories_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _PostTags _PostTags_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public."_PostTags"
    ADD CONSTRAINT "_PostTags_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: artiststat artiststat_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.artiststat
    ADD CONSTRAINT artiststat_pkey PRIMARY KEY (id);


--
-- Name: attachment attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.attachment
    ADD CONSTRAINT attachment_pkey PRIMARY KEY (id);


--
-- Name: blogPost blogPost_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public."blogPost"
    ADD CONSTRAINT "blogPost_pkey" PRIMARY KEY (id);


--
-- Name: category category_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_pkey PRIMARY KEY (id);


--
-- Name: contentmeta contentmeta_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.contentmeta
    ADD CONSTRAINT contentmeta_pkey PRIMARY KEY (id);


--
-- Name: daybucket daybucket_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.daybucket
    ADD CONSTRAINT daybucket_pkey PRIMARY KEY (id);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: monthbucket monthbucket_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.monthbucket
    ADD CONSTRAINT monthbucket_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: spalbum spalbum_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.spalbum
    ADD CONSTRAINT spalbum_pkey PRIMARY KEY (album_id);


--
-- Name: spalbumartist spalbumartist_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.spalbumartist
    ADD CONSTRAINT spalbumartist_pkey PRIMARY KEY (album_id, artist_id);


--
-- Name: spartist spartist_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.spartist
    ADD CONSTRAINT spartist_pkey PRIMARY KEY (artist_id);


--
-- Name: spdailyplaystats spdailyplaystats_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.spdailyplaystats
    ADD CONSTRAINT spdailyplaystats_pkey PRIMARY KEY (id);


--
-- Name: spplayhistory spplayhistory_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.spplayhistory
    ADD CONSTRAINT spplayhistory_pkey PRIMARY KEY (id);


--
-- Name: sptrack sptrack_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.sptrack
    ADD CONSTRAINT sptrack_pkey PRIMARY KEY (track_id);


--
-- Name: sptrackartist sptrackartist_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.sptrackartist
    ADD CONSTRAINT sptrackartist_pkey PRIMARY KEY (track_id, artist_id);


--
-- Name: tag tag_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.tag
    ADD CONSTRAINT tag_pkey PRIMARY KEY (id);


--
-- Name: term term_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.term
    ADD CONSTRAINT term_pkey PRIMARY KEY (id);


--
-- Name: trackstat trackstat_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.trackstat
    ADD CONSTRAINT trackstat_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (user_id);


--
-- Name: yearbucket yearbucket_pkey; Type: CONSTRAINT; Schema: public; Owner: template_2
--

ALTER TABLE ONLY public.yearbucket
    ADD CONSTRAINT yearbucket_pkey PRIMARY KEY (id);


--
-- Name: _PostCategories_B_index; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX "_PostCategories_B_index" ON public."_PostCategories" USING btree ("B");


--
-- Name: _PostTags_B_index; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX "_PostTags_B_index" ON public."_PostTags" USING btree ("B");


--
-- Name: artiststat_artist_id_monthbucketid_key; Type: INDEX; Schema: public; Owner: template_2
--

CREATE UNIQUE INDEX artiststat_artist_id_monthbucketid_key ON public.artiststat USING btree (artist_id, monthbucketid);


--
-- Name: artiststat_artist_id_stat_date_idx; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX artiststat_artist_id_stat_date_idx ON public.artiststat USING btree (artist_id, stat_date);


--
-- Name: artiststat_artist_id_stat_date_key; Type: INDEX; Schema: public; Owner: template_2
--

CREATE UNIQUE INDEX artiststat_artist_id_stat_date_key ON public.artiststat USING btree (artist_id, stat_date);


--
-- Name: artiststat_artist_id_yearbucketid_key; Type: INDEX; Schema: public; Owner: template_2
--

CREATE UNIQUE INDEX artiststat_artist_id_yearbucketid_key ON public.artiststat USING btree (artist_id, yearbucketid);


--
-- Name: artiststat_daybucketid_idx; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX artiststat_daybucketid_idx ON public.artiststat USING btree (daybucketid);


--
-- Name: artiststat_monthbucketid_idx; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX artiststat_monthbucketid_idx ON public.artiststat USING btree (monthbucketid);


--
-- Name: artiststat_yearbucketid_idx; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX artiststat_yearbucketid_idx ON public.artiststat USING btree (yearbucketid);


--
-- Name: blogPost_slug_key; Type: INDEX; Schema: public; Owner: template_2
--

CREATE UNIQUE INDEX "blogPost_slug_key" ON public."blogPost" USING btree (slug);


--
-- Name: contentmeta_slug_key; Type: INDEX; Schema: public; Owner: template_2
--

CREATE UNIQUE INDEX contentmeta_slug_key ON public.contentmeta USING btree (slug);


--
-- Name: daybucket_monthbucketid_idx; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX daybucket_monthbucketid_idx ON public.daybucket USING btree (monthbucketid);


--
-- Name: daybucket_start_date_idx; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX daybucket_start_date_idx ON public.daybucket USING btree (start_date);


--
-- Name: idx_artiststat_artist_id_stat_date; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_artiststat_artist_id_stat_date ON public.artiststat USING btree (artist_id, stat_date);


--
-- Name: idx_artiststat_daybucketid; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_artiststat_daybucketid ON public.artiststat USING btree (daybucketid);


--
-- Name: idx_artiststat_monthbucketid; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_artiststat_monthbucketid ON public.artiststat USING btree (monthbucketid);


--
-- Name: idx_artiststat_yearbucketid; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_artiststat_yearbucketid ON public.artiststat USING btree (yearbucketid);


--
-- Name: idx_daybucket_monthbucketid; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_daybucket_monthbucketid ON public.daybucket USING btree (monthbucketid);


--
-- Name: idx_daybucket_start_date; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_daybucket_start_date ON public.daybucket USING btree (start_date);


--
-- Name: idx_monthbucket_range_end; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_monthbucket_range_end ON public.monthbucket USING btree (range_end);


--
-- Name: idx_monthbucket_range_start; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_monthbucket_range_start ON public.monthbucket USING btree (range_start);


--
-- Name: idx_monthbucket_yearbucketid; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_monthbucket_yearbucketid ON public.monthbucket USING btree (yearbucketid);


--
-- Name: idx_spalbum_name; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_spalbum_name ON public.spalbum USING btree (name);


--
-- Name: idx_spalbum_release_date; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_spalbum_release_date ON public.spalbum USING btree (release_date);


--
-- Name: idx_spalbumartist_album_artist; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_spalbumartist_album_artist ON public.spalbumartist USING btree (album_id, artist_id);


--
-- Name: idx_spalbumartist_artist_id; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_spalbumartist_artist_id ON public.spalbumartist USING btree (artist_id);


--
-- Name: idx_spartist_name; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_spartist_name ON public.spartist USING btree (name);


--
-- Name: idx_spplayhistory_played_at; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_spplayhistory_played_at ON public.spplayhistory USING btree (played_at);


--
-- Name: idx_spplayhistory_played_at_track_id; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_spplayhistory_played_at_track_id ON public.spplayhistory USING btree (played_at DESC, track_id);


--
-- Name: idx_sptrack_album_id; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_sptrack_album_id ON public.sptrack USING btree (album_id);


--
-- Name: idx_sptrack_common_album_id; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_sptrack_common_album_id ON public.sptrack USING btree (common_album_id);


--
-- Name: idx_sptrack_explicit; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_sptrack_explicit ON public.sptrack USING btree (explicit);


--
-- Name: idx_sptrack_isrc; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_sptrack_isrc ON public.sptrack USING btree (isrc);


--
-- Name: idx_sptrackartist_artist_id; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_sptrackartist_artist_id ON public.sptrackartist USING btree (artist_id);


--
-- Name: idx_sptrackartist_track_artist; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_sptrackartist_track_artist ON public.sptrackartist USING btree (track_id, artist_id);


--
-- Name: idx_trackstat_daybucketid; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_trackstat_daybucketid ON public.trackstat USING btree (daybucketid);


--
-- Name: idx_trackstat_monthbucketid; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_trackstat_monthbucketid ON public.trackstat USING btree (monthbucketid);


--
-- Name: idx_trackstat_track_id_stat_date; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_trackstat_track_id_stat_date ON public.trackstat USING btree (track_id, stat_date);


--
-- Name: idx_trackstat_yearbucketid; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_trackstat_yearbucketid ON public.trackstat USING btree (yearbucketid);


--
-- Name: idx_yearbucket_year; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX idx_yearbucket_year ON public.yearbucket USING btree (year);


--
-- Name: projects_slug_key; Type: INDEX; Schema: public; Owner: template_2
--

CREATE UNIQUE INDEX projects_slug_key ON public.projects USING btree (slug);


--
-- Name: spdailyplaystats_date_key; Type: INDEX; Schema: public; Owner: template_2
--

CREATE UNIQUE INDEX spdailyplaystats_date_key ON public.spdailyplaystats USING btree (date);


--
-- Name: spplayhistory_track_id_played_at_key; Type: INDEX; Schema: public; Owner: template_2
--

CREATE UNIQUE INDEX spplayhistory_track_id_played_at_key ON public.spplayhistory USING btree (track_id, played_at);


--
-- Name: trackstat_daybucketid_idx; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX trackstat_daybucketid_idx ON public.trackstat USING btree (daybucketid);


--
-- Name: trackstat_monthbucketid_idx; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX trackstat_monthbucketid_idx ON public.trackstat USING btree (monthbucketid);


--
-- Name: trackstat_track_id_monthbucketid_key; Type: INDEX; Schema: public; Owner: template_2
--

CREATE UNIQUE INDEX trackstat_track_id_monthbucketid_key ON public.trackstat USING btree (track_id, monthbucketid);


--
-- Name: trackstat_track_id_stat_date_idx; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX trackstat_track_id_stat_date_idx ON public.trackstat USING btree (track_id, stat_date);


--
-- Name: trackstat_track_id_stat_date_key; Type: INDEX; Schema: public; Owner: template_2
--

CREATE UNIQUE INDEX trackstat_track_id_stat_date_key ON public.trackstat USING btree (track_id, stat_date);


--
-- Name: trackstat_track_id_yearbucketid_key; Type: INDEX; Schema: public; Owner: template_2
--

CREATE UNIQUE INDEX trackstat_track_id_yearbucketid_key ON public.trackstat USING btree (track_id, yearbucketid);


--
-- Name: trackstat_yearbucketid_idx; Type: INDEX; Schema: public; Owner: template_2
--

CREATE INDEX trackstat_yearbucketid_idx ON public.trackstat USING btree (yearbucketid);


--
-- Name: user_username_key; Type: INDEX; Schema: public; Owner: template_2
--

CREATE UNIQUE INDEX user_username_key ON public."user" USING btree (username);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: template_2
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO template_2;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO template_2;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO template_2;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO template_2;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO template_2;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO template_2;


--
-- PostgreSQL database dump complete
--

\unrestrict 3T6xVvLTqpTg8dsND2psNSXO6e9F6rqG7XUoc1grhYOnCThhhqAMBZLJdloFfWt

