/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { Prisma } from '@prisma/client';
import querystring, { stringify } from 'querystring';

import { PAIR_DEVICES } from '../../src/common/constant/devices';
import { HeatmapFrequencies, SpotifyDataResponseProps, AccessTokenResponseProps, DeviceDataProps, DeviceResponseProps, NowPlayingResponseProps, SongProps, RawRecentlyPlayedResponse } from '../../src/common/types/spotify';
import prisma from '../../src/common/libs/prisma';
import { format } from 'date-fns';
import { write } from 'fs';
import { writeOutJSONToFile } from 'tools/localHelperFiles';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;
const TOKEN = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

const BASE_URL = 'https://api.spotify.com/v1';
const AVAILABLE_DEVICES_ENDPOINT = `${BASE_URL}/me/player/devices`;
const NOW_PLAYING_ENDPOINT = `${BASE_URL}/me/player/currently-playing`;
const RECENTLY_PLAYED_ENDPOINT = `${BASE_URL}/me/player/recently-played?limit=50`;

const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

const getAccessToken = async (): Promise<AccessTokenResponseProps> => {
  const response = await axios.post(
    TOKEN_ENDPOINT,
    querystring.stringify({ grant_type: 'refresh_token', refresh_token: REFRESH_TOKEN }),
    { headers: { Authorization: `Basic ${TOKEN}`, 'Content-Type': 'application/x-www-form-urlencoded' } },
  );
  return response.data;
};

export const getAvailableDevices = async (): Promise<DeviceResponseProps> => {
  const { access_token } = await getAccessToken();
  const response = await axios.get(AVAILABLE_DEVICES_ENDPOINT, { headers: { Authorization: `Bearer ${access_token}` } });
  const status = response.status;

  if (status === 204 || status > 400) { return { status, data: [] }; }

  const responseData: DeviceDataProps = response.data;
  const devices = responseData?.devices?.map((device) => ({
    name: device.name, is_active: device.is_active, type: device.type,
    model: PAIR_DEVICES[device?.type]?.model || 'Unknown Device',
    id: PAIR_DEVICES[device?.type]?.id || 'LucasPMorris-device',
  }));

  return { status, data: devices };
};

export const getNowPlaying = async (): Promise<NowPlayingResponseProps> => {
  const { access_token } = await getAccessToken();

  const response = await axios.get(NOW_PLAYING_ENDPOINT, { headers: { Authorization: `Bearer ${access_token}` } });
  const status = response.status;

  if (status === 204 || status > 400) { return { status, isPlaying: false, data: null }; }

  const responseData: SongProps = response.data;

  if (!responseData.item) { return { status, isPlaying: false, data: null }; }

  const isPlaying: boolean = responseData?.is_playing;
  const album: string = responseData?.item?.album.name ?? '';
  const albumImageUrl: string | undefined = responseData?.item?.album?.images?.find((image) => image?.width === 640) ?.url ?? undefined;
  const artist: string = responseData?.item?.artists?.map((artist) => artist?.name).join(', ') ?? '';
  const songUrl: string = responseData?.item?.external_urls?.spotify ?? '';
  const title: string = responseData?.item?.name ?? '';

  return { status, isPlaying, data: { album, albumImageUrl, artist, songUrl, title } };
};

export const getArtistsByIds = async (artistIds: string[]): Promise<any[]> => {
  if (artistIds.length === 0) { return []; }
  
  const { access_token } = await getAccessToken();
  const chunks = [];
  for (let i = 0; i < artistIds.length; i += 50) { chunks.push(artistIds.slice(i, i + 50)); }
  
  const artistResponses = await Promise.allSettled( chunks.map(chunk => axios.get(`https://api.spotify.com/v1/artists?ids=${chunk.join(',')}`, { headers: { Authorization: `Bearer ${access_token}` } }) ) );

  const artists = artistResponses.filter((r: any) => r.status === 'fulfilled').flatMap((r: any) => r.value.data.artists);
  const failed = artistResponses.filter(r => r.status === 'rejected');
  if (failed.length) console.warn('Some artist fetches failed:', failed);
  return artists;
}

export const getRecentlyPlayedFromSpotify = async (): Promise<RawRecentlyPlayedResponse> => {
  try {
    const { access_token } = await getAccessToken();  
    const lastSync = await prisma.spplayhistory.findFirst({ orderBy: { played_at: 'desc' }, select: { played_at: true } });
    const afterTimestamp = lastSync?.played_at instanceof Date ? lastSync.played_at.getTime() : 0;

    let url = `${RECENTLY_PLAYED_ENDPOINT}&after=${afterTimestamp}`;
    
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${access_token}` } });
  
    if (response.status === 204 || response.status > 400 || Array.isArray(response.data) || !response.data.items) {
      console.warn('Recently played tracks empty or missing, error status:', response.status);
      return { status: response.status, data: [] };
    }

    return { status: 200, data: response.data.items }; // raw Spotify items
  } catch (error) {
    console.error('Error fetching recently played tracks:', error);
    return { status: 500, data: [] };
  }
};

type Bucket = { id: number; range_start: Date; range_end: Date };
type BucketSelection = { year: number[]; month: number[]; week: number[]; day: Date[]; };

/**
 * Returns the minimal set of bucket IDs to cover the date range.
 */
function selectMinimalBuckets(
  startDate: Date,
  endDate: Date,
  yearBuckets: Bucket[],
  monthBuckets: Bucket[],
  weekBuckets: Bucket[],
  dayBuckets: { id: number; start_date: Date }[]
) {
  const selected: { year: number[]; month: number[]; week: number[]; day: (number | Date)[] } = { year: [], month: [], week: [], day: [] };

  // 1. Build set of all dates to cover
  const dateSet = new Set<string>();
  let d = new Date(startDate);
  while (d <= endDate) {
    dateSet.add(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }

  // Helper to get all dates in a bucket
  function getDatesInRange(start: Date, end: Date) {
    const dates = [];
    let d = new Date(start);
    while (d <= end) {
      dates.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
    }
    return dates;
  }

  // 2. Try year buckets
  for (const b of yearBuckets) {
    const dates = getDatesInRange(b.range_start, b.range_end);
    if (dates.every(date => dateSet.has(date))) {
      selected.year.push(b.id);
      dates.forEach(date => dateSet.delete(date));
    }
  }
  // 3. Try month buckets
  for (const b of monthBuckets) {
    const dates = getDatesInRange(b.range_start, b.range_end);
    if (dates.every(date => dateSet.has(date))) {
      selected.month.push(b.id);
      dates.forEach(date => dateSet.delete(date));
    }
  }
  // 4. Try week buckets
  for (const b of weekBuckets) {
    const dates = getDatesInRange(b.range_start, b.range_end);
    if (dates.every(date => dateSet.has(date))) {
      selected.week.push(b.id);
      dates.forEach(date => dateSet.delete(date));
    }
  }
  // 5. Remaining days
  for (const b of dayBuckets) {
    const date = b.start_date.toISOString().slice(0, 10);
    if (dateSet.has(date)) {
      selected.day.push(b.id); // or b.start_date
      dateSet.delete(date);
    }
  }

  return selected;
}    

export const getSpotifyStatsByDateRange = async (startDate: Date, endDate: Date): Promise<SpotifyDataResponseProps> => {
  try {
    ////// ------------ PERFROMANCE NOTES ------------ //////
    let startTime = new Date().toISOString();
    console.log(`${new Date().toISOString()}: getSpotifyStatsByDateRange ||||| START |||| Dates: `, startDate, endDate);


    // Fetch all required data in parallel to reduce latency
    const [dailyStats, yearBuckets, monthBuckets, weekBuckets] = await Promise.all([
      prisma.spdailyplaystats.findMany({ where: { date: { gte: startDate, lte: endDate } } }),
      prisma.yearbucket.findMany({ where: { range_start: { lte: endDate }, range_end: { gte: startDate } } }),
      prisma.monthbucket.findMany({ where: { range_start: { lte: endDate }, range_end: { gte: startDate } } }),
      prisma.weekbucket.findMany({ where: { range_start: { lte: endDate }, range_end: { gte: startDate } } })
    ]);

    console.log(`${new Date().toISOString()}: getSpotifyStatsByDateRange ||||| DATA FETCHED |||| Dates: `, startDate, endDate, ' Time Ellapsed:', new Date().getTime() - new Date(startTime).getTime(), 'ms');
    ////// ------------ PERFROMANCE NOTES ------------ //////
    //
    //   First Run - 646ms
    //  Second Run - 777ms
    //   Third Run - 680ms
    //
    ////// ------------ PERFROMANCE NOTES ------------ //////
 
    const playFrequency = dailyStats.map((stat) => ({
      date: stat.date.toISOString().substring(0, 10),
      weekday: stat.weekday,
      hourly_plays: Array.isArray(stat.hourly_plays) ? stat.hourly_plays : Array(24).fill(0)
    }));

    const bucketLookup = {
      year: Object.fromEntries(yearBuckets.map(b => [b.id, b.range_start])),
      month: Object.fromEntries(monthBuckets.map(b => [b.id, b.range_start])),
      week: Object.fromEntries(weekBuckets.map(b => [b.id, b.range_start]))
    };

    const coveredDates = new Set<string>();
    const addCoveredDates = (buckets: { range_start: Date; range_end: Date }[]) => {
      for (const b of buckets) {
        let d = new Date(Math.max(b.range_start.getTime(), startDate.getTime()));
        const end = new Date(Math.min(b.range_end.getTime(), endDate.getTime()));
        while (d <= end) {
          coveredDates.add(d.toISOString().split('T')[0]);
          d.setUTCDate(d.getUTCDate() + 1);
        }
      }
    };
    addCoveredDates(yearBuckets);
    addCoveredDates(monthBuckets);
    addCoveredDates(weekBuckets);

    const edgeDays: Date[] = [];
    let d = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
    while (d <= endDate) {
      const key = d.toISOString().split('T')[0];
      if (!coveredDates.has(key)) edgeDays.push(new Date(d));
      d.setUTCDate(d.getUTCDate() + 1);
    }

    console.log(`${new Date().toISOString()}: getSpotifyStatsByDateRange ||||| HAVE BUCKETS |||| Dates: `, startDate, endDate, ' Time Ellapsed:', new Date().getTime() - new Date(startTime).getTime(), 'ms');
    ////// ------------ PERFROMANCE NOTES ------------ //////
    //
    //   First Run - 647ms
    //  Second Run - 778ms
    //   Third Run - 681ms
    //
    ////// ------------ PERFROMANCE NOTES ------------ //////

    const bucketsToFetch = selectMinimalBuckets( startDate, endDate, yearBuckets, monthBuckets, weekBuckets, edgeDays.map((date, index) => ({ id: index, start_date: date })) );

    const bucketQueries = [
      ...bucketsToFetch.year.map((id) => ({ bucket_scope: 'year', yearbucketid: id })),
      ...bucketsToFetch.month.map((id) => ({ bucket_scope: 'month', monthbucketid: id })),
      ...bucketsToFetch.week.map((id) => ({ bucket_scope: 'week', weekbucketid: id })),
      ...bucketsToFetch.day.map((date) => ({ bucket_scope: 'day', stat_date: date instanceof Date ? date.toISOString() : new Date(date).toISOString() }))
    ];

    const [artistStats, trackStats] = await Promise.all([
      prisma.artiststat.findMany({ where: { OR: bucketQueries }, include: { artist: true } }), 
      prisma.trackstat.findMany({ where: { OR: bucketQueries }, include: { track: { include: { album: true, common_album: true, track_artists: { include: { artist: true } } } } } })
    ]);
    console.log('artistStats:', artistStats.length, artistStats[0]);
    writeOutJSONToFile(artistStats, 'artistStats.json');
    writeOutJSONToFile(trackStats, 'trackStats.json');
    writeOutJSONToFile(bucketQueries, 'bucketQueries.json');
    // const [artistStats, trackStats] = await Promise.all([
    //   prisma.artiststat.findMany({
    //     where: { OR: [
    //       { bucket_scope: 'year', yearbucketid: { in: yearBuckets.map(b => b.id) } },
    //       { bucket_scope: 'month', monthbucketid: { in: monthBuckets.map(b => b.id) } },
    //       { bucket_scope: 'week', weekbucketid: { in: weekBuckets.map(b => b.id) } },
    //       { bucket_scope: 'day' }
    //     ] },
    //     include: { artist: true }
    //   }),
    //   prisma.trackstat.findMany({
    //     where: { OR: [
    //       { bucket_scope: 'year', yearbucketid: { in: yearBuckets.map(b => b.id) } },
    //       { bucket_scope: 'month', monthbucketid: { in: monthBuckets.map(b => b.id) } },
    //       { bucket_scope: 'week', weekbucketid: { in: weekBuckets.map(b => b.id) } },
    //       { bucket_scope: 'day' }
    //     ] },
    //     include: { track: { include: { album: true, common_album: true, track_artists: { include: { artist: true } } } } }
    //   })
    // ]);

    console.log(`${new Date().toISOString()}: getSpotifyStatsByDateRange ||||| artiststat / trackstat ||||| Dates: `, startDate, endDate, ' Time Ellapsed:', new Date().getTime() - new Date(startTime).getTime(), 'ms');
    ////// ------------ PERFROMANCE NOTES ------------ //////
    //
    //    First Run - N/A
    // Second Run - 8662ms
    //   Third Run - 813ms
    //
    ////// ------------ PERFROMANCE NOTES ------------ //////


    const resolveBucketDate = (stat: any): Date | null => {
      if (stat.bucket_scope === 'year') return bucketLookup.year[stat.yearbucketid ?? -1];
      if (stat.bucket_scope === 'month') return bucketLookup.month[stat.monthbucketid ?? -1];
      if (stat.bucket_scope === 'week') return bucketLookup.week[stat.weekbucketid ?? -1];
      if (stat.bucket_scope === 'day') return stat.stat_date ?? null;
      return null;
    };

    console.log(`${new Date().toISOString()}: getSpotifyStatsByDateRange ||||| BUCKETS NORMALIZED |||| Dates: `, startDate, endDate, ' Time Ellapsed:', new Date().getTime() - new Date(startTime).getTime(), 'ms');
    ////// ------------ PERFROMANCE NOTES ------------ //////
    //
    //   First Run - 9802ms
    //  Second Run - 8662ms
    //   Third Run - 813ms
    //
    ////// ------------ PERFROMANCE NOTES ------------ //////

    const normalizedArtistStats = artistStats.map(stat => ({ ...stat, bucket_date: resolveBucketDate(stat) }));
    const normalizedTrackStats = trackStats.map(stat => ({ ...stat, bucket_date: resolveBucketDate(stat) }));

    const filteredArtistStats = normalizedArtistStats.filter(stat => stat.bucket_date instanceof Date && stat.bucket_date >= startDate && stat.bucket_date <= endDate);
    const filteredTrackStats = normalizedTrackStats.filter(stat => stat.bucket_date instanceof Date && stat.bucket_date >= startDate && stat.bucket_date <= endDate);

    const aggregateStats = (stats: any[], key: string) => {
      const map = new Map<string, { item: any; count: number }>();
      for (const stat of stats) {
        const id = stat[key];
        const existing = map.get(id);
        if (existing) existing.count += stat.count;
        else map.set(id, { item: stat[key === 'artist_id' ? 'artist' : 'track'], count: stat.count });
      }
      return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 10);
    };

    const topArtists = aggregateStats(filteredArtistStats, 'artist_id').map(({ item }) => ({
      artistId: item.artist_id,
      name: item.name,
      image: item.image_url ?? 'images/spotify-icon.svg',
      artist_url: item.artist_url
    }));

    const topTracks = aggregateStats(filteredTrackStats, 'track_id').map(({ item }) => ({
      trackId: item.track_id,
      isrc: item.isrc,
      album: { albumId: item.album.album_id, name: item.album.name, release_date: item.album.release_date ?? new Date(), image: item.album.image_url ?? 'images/spotify-icon.svg' },
      common_album: item.common_album
        ? { albumId: item.common_album.album_id, name: item.common_album.name, image: item.common_album.image_url ?? 'images/spotify-icon.svg', release_date: item.common_album.release_date ?? new Date() }
        : null,
      artists: item.track_artists.map((ta: { artist: { name: string } }) => ta.artist.name).join(', '),
      songUrl: item.song_url ?? '',
      title: item.title,
      release_date: item.release_date ?? new Date(),
      explicit: item.explicit
    }));

    console.log(`${new Date().toISOString()}: getSpotifyStatsByDateRange ||||| TOP DATA PROCESSED ||||| Dates: `, startDate, endDate, ' Time Ellapsed:', new Date().getTime() - new Date(startTime).getTime(), 'ms');
    ////// ------------ PERFROMANCE NOTES ------------ //////
    //
    //   First Run - 9835ms
    //  Second Run - 8692ms
    //   Third Run - 813ms
    //
    ////// ------------ PERFROMANCE NOTES ------------ //////

    const formatHeatmap = (stats: any[]): HeatmapFrequencies[] =>
      stats
        .filter(stat => stat.bucket_date instanceof Date && stat.bucket_date >= startDate && stat.bucket_date <= endDate)
        .map(stat => ({
          date: stat.bucket_date.toISOString().split('T')[0],
          weekday: format(stat.bucket_date, 'EEEE'),
          hourly_plays: Array.isArray(stat.hourly_plays) && stat.hourly_plays.length === 24
            ? stat.hourly_plays
            : Array(24).fill(0),
          artistId: stat.artist_id,
          trackId: stat.track_id
        }));

    const artistHeatmaps = topArtists.flatMap(({ artistId }) => formatHeatmap(normalizedArtistStats.filter(s => s.artist_id === artistId)));
    const trackHeatMaps = topTracks.flatMap(({ trackId }) => formatHeatmap(normalizedTrackStats.filter(s => s.track_id === trackId)));

    console.log(`${new Date().toISOString()}: getSpotifyStatsByDateRange ||||| HEATMAPS FORMATTED ||||| Dates: `, startDate, endDate, ' Time Ellapsed:', new Date().getTime() - new Date(startTime).getTime(), 'ms');
    ////// ------------ PERFROMANCE NOTES ------------ //////
    //
    //   Heat Maps - 9860ms
    //  Second Run - 8708ms
    //    Third Run - 813ms
    //
    ////// ------------ PERFROMANCE NOTES ------------ //////

    const trackMap = new Map<string, any>();
    filteredTrackStats.forEach(stat => { 
        const track = (stat as any).track; // Cast to any or adjust type if necessary
        if (track && !trackMap.has(stat.track_id)) { 
            trackMap.set(stat.track_id, track); 
        } 
    });

    const artistMap = new Map<string, any>();
    filteredArtistStats.forEach(stat => { 
        const artist = (stat as any).artist; // Cast to any or adjust type if necessary
        if (artist && !artistMap.has(stat.artist_id)) { 
            artistMap.set(stat.artist_id, artist); 
        } 
    });

    const explicitCount = filteredTrackStats
      .filter(stat => trackMap.get(stat.track_id)?.explicit)
      .reduce((sum, stat) => sum + stat.count, 0);
    const totalCount = filteredTrackStats.reduce((sum, stat) => sum + stat.count, 0);
    const percentExplicit = totalCount > 0 ? parseFloat(((explicitCount / totalCount) * 100).toFixed(1)) : 0.0;

    console.log(`${new Date().toISOString()}: getSpotifyStatsByDateRange ||||| COMPLETE ||||| Dates: `, startDate, endDate, ' Total Time:', new Date().getTime() - new Date(startTime).getTime(), 'ms');
    ////// ------------ PERFROMANCE NOTES ------------ //////
    //
    //   First Run - 9861ms
    //  Second Run - 8709ms
    //    Third Run - 813ms
    //
    ////// ------------ PERFROMANCE NOTES ------------ //////

    return { status: 200, data: { topArtists, topTracks, playFrequency, artistHeatmaps, trackHeatMaps, meta: { totalTrackCount: trackMap.size, totalArtistCount: artistMap.size, percentExplicit } } };
  } catch (error) { console.error('Error in getSpotifyStatsByDateRange:', error);
    return { status: 500, data: { topArtists: [], topTracks: [], playFrequency: [], artistHeatmaps: [], trackHeatMaps: [], meta: { totalTrackCount: 0, totalArtistCount: 0, percentExplicit: 0 } } };
  }
};
