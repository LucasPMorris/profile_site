/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { Prisma } from '@prisma/client';
import querystring, { stringify } from 'querystring';

import { PAIR_DEVICES } from '../../src/common/constant/devices';
import { HeatmapFrequencies, SpotifyDataResponseProps, AccessTokenResponseProps, DeviceDataProps, DeviceResponseProps, NowPlayingResponseProps, SongProps, RawRecentlyPlayedResponse } from '../../src/common/types/spotify';
import prisma from '../../src/common/libs/prisma';
import { format } from 'date-fns';

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
type BucketSelection = { year: number[]; month: number[]; day: Date[]; };

/**
 * Returns the minimal set of bucket IDs to cover the date range.
 */
function selectMinimalBuckets(
  startDate: Date,
  endDate: Date,
  yearBuckets: Bucket[],
  monthBuckets: Bucket[],
  dayBuckets: { id: number; start_date: Date }[]
) {
  const selected: { year: number[]; month: number[]; day: (number | Date)[] } = { year: [], month: [], day: [] };

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

  // 2. Try year buckets (overlap logic)
  for (const b of yearBuckets) {
    if (b.range_end >= startDate && b.range_start <= endDate) {
      selected.year.push(b.id);
      const dates = getDatesInRange(
        new Date(Math.max(b.range_start.getTime(), startDate.getTime())),
        new Date(Math.min(b.range_end.getTime(), endDate.getTime()))
      );
      dates.forEach(date => dateSet.delete(date));
    }
  }
  // 3. Try month buckets (overlap logic)
  for (const b of monthBuckets) {
    if (b.range_end >= startDate && b.range_start <= endDate) {
      selected.month.push(b.id);
      const dates = getDatesInRange(
        new Date(Math.max(b.range_start.getTime(), startDate.getTime())),
        new Date(Math.min(b.range_end.getTime(), endDate.getTime()))
      );
      dates.forEach(date => dateSet.delete(date));
    }
  }
  // 4. Remaining days
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
    const [dailyStats, yearBuckets, monthBuckets] = await Promise.all([
      prisma.spdailyplaystats.findMany({ where: { date: { gte: startDate, lte: endDate } } }),
      prisma.yearbucket.findMany({ where: { range_start: { lte: endDate }, range_end: { gte: startDate } } }),
      prisma.monthbucket.findMany({ where: { range_start: { lte: endDate }, range_end: { gte: startDate } } })
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
      month: Object.fromEntries(monthBuckets.map(b => [b.id, b.range_start]))
    };

    const coveredDates = new Set<string>();
    const toUtcMidnight = (dt: Date) => new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
    const rs = toUtcMidnight(startDate);
    const re = toUtcMidnight(endDate);
    const isFullyContained = (b: { range_start: Date; range_end: Date }) => {
      const bs = toUtcMidnight(b.range_start);
      const be = toUtcMidnight(b.range_end);
      return bs >= rs && be <= re;
    };
    const addCoveredDates = (buckets: { range_start: Date; range_end: Date }[]) => {
      for (const b of buckets) {
        // Only consider buckets fully contained within the requested range
        const bs = toUtcMidnight(b.range_start);
        const be = toUtcMidnight(b.range_end);
        if (!(bs >= rs && be <= re)) continue;
        let d = new Date(bs);
        while (d <= be) {
          coveredDates.add(d.toISOString().split('T')[0]);
          d.setUTCDate(d.getUTCDate() + 1);
        }
      }
    };
    const fullYearBuckets = yearBuckets.filter(isFullyContained);
    const fullMonthBuckets = monthBuckets.filter(isFullyContained);
    addCoveredDates(fullYearBuckets);
    addCoveredDates(fullMonthBuckets);

    const edgeDays: Date[] = [];
    let d = new Date(rs);
    while (d <= re) {
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

    // Build a concise OR query: fully-contained year/month buckets + any day stats within range
    const yearIds = fullYearBuckets.map(b => b.id);
    const monthIds = fullMonthBuckets.map(b => b.id);
    const bucketQueries: any[] = [];
    if (yearIds.length) bucketQueries.push({ bucket_scope: 'year', yearbucketid: { in: yearIds } });
    if (monthIds.length) bucketQueries.push({ bucket_scope: 'month', monthbucketid: { in: monthIds } });
    bucketQueries.push({ bucket_scope: 'day', stat_date: { gte: rs, lte: re } });

    const [artistStats, trackStats] = await Promise.all([
      prisma.artiststat.findMany({ where: { OR: bucketQueries }, include: { artist: true } }),
      prisma.trackstat.findMany({ where: { OR: bucketQueries }, include: { track: { include: { album: true, common_album: true, track_artists: { include: { artist: true } } } } } })
    ]);

    // Extract already-fetched day stats for precise in-range aggregation
    const dayArtistStatsAll = (artistStats as any[]).filter(s => s.bucket_scope === 'day');
    const dayTrackStatsAll = (trackStats as any[]).filter(s => s.bucket_scope === 'day');

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

    // Log type and value of bucket_date for first few normalized stats (uncomment for debugging)
    // for (let i = 0; i < Math.min(3, normalizedArtistStats.length); i++) {
    //   const stat = normalizedArtistStats[i];
    //   console.log(`DEBUG normalizedArtistStats[${i}].bucket_date:`, stat.bucket_date, typeof stat.bucket_date, stat);
    // }
    // for (let i = 0; i < Math.min(3, normalizedTrackStats.length); i++) {
    //   const stat = normalizedTrackStats[i];
    //   console.log(`DEBUG normalizedTrackStats[${i}].bucket_date:`, stat.bucket_date, typeof stat.bucket_date, stat);
    // }

  const filteredArtistStats = normalizedArtistStats.filter(stat => {
      if (!stat.bucket_date) return false;
      // For year/month buckets, include if bucket range overlaps requested range
      if (stat.bucket_scope === 'year' && stat.yearbucketid) {
        const bucket = yearBuckets.find(b => b.id === stat.yearbucketid);
        if (bucket && bucket.range_end >= startDate && bucket.range_start <= endDate) return true;
      }
      if (stat.bucket_scope === 'month' && stat.monthbucketid) {
        const bucket = monthBuckets.find(b => b.id === stat.monthbucketid);
        if (bucket && bucket.range_end >= startDate && bucket.range_start <= endDate) return true;
      }
      // For day buckets, use bucket_date
      const date = new Date(stat.bucket_date);
      return date >= startDate && date <= endDate;
    });

  const filteredTrackStats = normalizedTrackStats.filter(stat => {
      if (!stat.bucket_date) return false;
      if (stat.bucket_scope === 'year' && stat.yearbucketid) {
        const bucket = yearBuckets.find(b => b.id === stat.yearbucketid);
        if (bucket && bucket.range_end >= startDate && bucket.range_start <= endDate) return true;
      }
      if (stat.bucket_scope === 'month' && stat.monthbucketid) {
        const bucket = monthBuckets.find(b => b.id === stat.monthbucketid);
        if (bucket && bucket.range_end >= startDate && bucket.range_start <= endDate) return true;
      }
      const date = new Date(stat.bucket_date);
      return date >= startDate && date <= endDate;
    });

    // Robust aggregation for top artists: prefer day-level when present, else fallback to filtered buckets
    const artistCounts = new Map<string, number>();
    const artistMeta = new Map<string, any>();
    const artistSource = dayArtistStatsAll.length ? dayArtistStatsAll : filteredArtistStats;
    for (const stat of artistSource) {
      const id = stat.artist_id;
      artistCounts.set(id, (artistCounts.get(id) || 0) + stat.count);
      if (!artistMeta.has(id) && stat.artist) { artistMeta.set(id, stat.artist); }
    }
    const topArtists = Array.from(artistCounts.entries())
      .map(([id, count]) => {
        const meta = artistMeta.get(id) || {};
        return { artistId: id, name: meta.name || '', image: meta.image_url ?? 'images/spotify-icon.svg', artist_url: meta.artist_url || '', count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Robust aggregation for top tracks: prefer day-level when present, else fallback to filtered buckets
    const trackCounts = new Map<string, number>();
    const trackMeta = new Map<string, any>();
    const trackSource = dayTrackStatsAll.length ? dayTrackStatsAll : filteredTrackStats;
    for (const stat of trackSource) {
      const id = stat.track_id;
      trackCounts.set(id, (trackCounts.get(id) || 0) + stat.count);
      if (!trackMeta.has(id) && stat.track) { trackMeta.set(id, stat.track); }
    }
    const topTracks = Array.from(trackCounts.entries())
      .map(([id, count]) => {
        const meta = trackMeta.get(id) || {};
        const defaultAlbum = { albumId: '', name: '', release_date: new Date(), image: 'images/spotify-icon.svg' };
        const album = meta.album
          ? { albumId: meta.album.album_id || '', name: meta.album.name || '', release_date: meta.album.release_date ?? new Date(), image: meta.album.image_url ?? 'images/spotify-icon.svg' }
          : defaultAlbum;
        const common_album = meta.common_album
          ? { albumId: meta.common_album.album_id || '', name: meta.common_album.name || '', image: meta.common_album.image_url ?? 'images/spotify-icon.svg', release_date: meta.common_album.release_date ?? new Date() }
          : defaultAlbum;
        return {
          trackId: id,
          isrc: meta.isrc || '',
          album,
          common_album,
          artists: meta.track_artists?.map((ta: any) => ta.artist?.name).join(', ') || '',
          songUrl: meta.song_url ?? '',
          title: meta.title || '',
          release_date: meta.release_date ?? new Date(),
          explicit: meta.explicit || false,
          count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    console.log(`${new Date().toISOString()}: getSpotifyStatsByDateRange ||||| TOP DATA PROCESSED ||||| Dates: `, startDate, endDate, ' Time Ellapsed:', new Date().getTime() - new Date(startTime).getTime(), 'ms');
    ////// ------------ PERFROMANCE NOTES ------------ //////
    //
    //   First Run - 9835ms
    //  Second Run - 8692ms
    //   Third Run - 813ms
    //
    ////// ------------ PERFROMANCE NOTES ------------ //////

    const formatHeatmap = (stats: any[]): HeatmapFrequencies[] => {
      //console.log('DEBUG formatHeatmap input:', stats.length, stats[0]);
      return stats
        .filter(stat => {
          if (stat.bucket_scope === 'year' && stat.yearbucketid) {
            const bucket = yearBuckets.find(b => b.id === stat.yearbucketid);
            if (bucket && bucket.range_end >= startDate && bucket.range_start <= endDate) return true;
          }
          if (stat.bucket_scope === 'month' && stat.monthbucketid) {
            const bucket = monthBuckets.find(b => b.id === stat.monthbucketid);
            if (bucket && bucket.range_end >= startDate && bucket.range_start <= endDate) return true;
          }
          // For day buckets, use stat_date directly
          if (stat.bucket_scope === 'day' && stat.stat_date) {
            const date = new Date(stat.stat_date);
            return date >= startDate && date <= endDate;
          }
          return false;
        })
        .map(stat => {
          let dateStr;
          let weekdayStr;
          if (stat.bucket_scope === 'day' && stat.stat_date) {
            dateStr = new Date(stat.stat_date).toISOString().split('T')[0];
            weekdayStr = format(new Date(stat.stat_date), 'EEEE');
          } else {
            dateStr = new Date(stat.bucket_date).toISOString().split('T')[0];
            weekdayStr = format(new Date(stat.bucket_date), 'EEEE');
          }
          return {
            date: dateStr,
            weekday: weekdayStr,
            hourly_plays: Array.isArray(stat.hourly_plays) && stat.hourly_plays.length === 24
              ? stat.hourly_plays
              : Array(24).fill(0),
            artistId: stat.artist_id,
            trackId: stat.track_id
          };
        });
    };

  // Heatmaps will be assigned below after querying day buckets for top artists/tracks only

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

    const trackIds = new Set(filteredTrackStats.map(stat => stat.track_id));
    const artistIds = new Set(filteredArtistStats.map(stat => stat.artist_id));

    const explicitCount = filteredTrackStats
      .filter(stat => stat.track?.explicit)
      .reduce((sum, stat) => sum + stat.count, 0);
    const totalCount = filteredTrackStats.reduce((sum, stat) => sum + stat.count, 0);
    const percentExplicit = totalCount > 0 ? parseFloat(((explicitCount / totalCount) * 100).toFixed(1)) : 0.0;

    console.log(`${new Date().toISOString()}: getSpotifyStatsByDateRange ||||| COMPLETE ||||| Dates: `, startDate, endDate, ' Total Time:', new Date().getTime() - new Date(startTime).getTime(), 'ms');
  // --- HEATMAP AGGREGATION BLOCK ---
    let artistHeatmaps: HeatmapFrequencies[] = [];
    let trackHeatMaps: HeatmapFrequencies[] = [];
    if (topArtists.length > 0 || topTracks.length > 0) {
      const topArtistIds = topArtists.map(a => a.artistId);
      const topTrackIds = topTracks.map(t => t.trackId);
      const dayArtistStats = dayArtistStatsAll.filter(s => topArtistIds.includes(s.artist_id));
      const dayTrackStats = dayTrackStatsAll.filter(s => topTrackIds.includes(s.track_id));
      artistHeatmaps = topArtists.flatMap(({ artistId }) => formatHeatmap(dayArtistStats.filter(s => s.artist_id === artistId)) );
      trackHeatMaps = topTracks.flatMap(({ trackId }) => formatHeatmap(dayTrackStats.filter(s => s.track_id === trackId)));
    }
    ////// ------------ PERFROMANCE NOTES ------------ //////
    //
    //   First Run - 9861ms
    //  Second Run - 8709ms
    //    Third Run - 813ms
    //
    ////// ------------ PERFROMANCE NOTES ------------ //////

    return { status: 200, data: {
      topArtists,
      topTracks,
      playFrequency,
      artistHeatmaps,
      trackHeatMaps,
        meta: {
          totalTrackCount: Array.from(trackIds).length,
          totalArtistCount: Array.from(artistIds).length,
          percentExplicit
        }
      } };
  } catch (error) { console.error('Error in getSpotifyStatsByDateRange:', error);
    return { status: 500, data: { topArtists: [], topTracks: [], playFrequency: [], artistHeatmaps: [], trackHeatMaps: [], meta: { totalTrackCount: 0, totalArtistCount: 0, percentExplicit: 0 } } };
  }
};
