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
    const startTime = Date.now();
    console.log(`${new Date().toISOString()}: getSpotifyStatsByDateRange START - Dates:`, startDate.toISOString(), endDate.toISOString());

    // Use raw SQL for much faster bucket-aware stats aggregation
    const [dailyStats, topArtistsRaw, topTracksRaw] = await Promise.all([
      prisma.spdailyplaystats.findMany({ 
        where: { date: { gte: startDate, lte: endDate } },
        select: { date: true, weekday: true, hourly_plays: true }
      }),
      
      // Raw SQL for top artists - much faster than Prisma OR queries
      prisma.$queryRaw`
        SELECT 
          a.artist_id,
          a.name,
          a.image_url,
          a.artist_url,
          COALESCE(SUM(ast.count), 0) as total_count
        FROM spartist a
        INNER JOIN artiststat ast ON a.artist_id = ast.artist_id
        WHERE ast.stat_date >= ${startDate} AND ast.stat_date <= ${endDate}
        GROUP BY a.artist_id, a.name, a.image_url, a.artist_url
        ORDER BY total_count DESC
        LIMIT 10
      `,
      
      // Raw SQL for top tracks - much faster than Prisma OR queries  
      prisma.$queryRaw`
        SELECT 
          t.track_id,
          t.title,
          t.isrc,
          t.song_url,
          t.explicit,
          t.release_date,
          t.album_id,
          a.name as album_name,
          a.image_url as album_image,
          a.release_date as album_release_date,
          ca.album_id as common_album_id,
          ca.name as common_album_name,
          ca.image_url as common_album_image,
          ca.release_date as common_album_release_date,
          STRING_AGG(ar.name, ', ' ORDER BY ar.name) as artists,
          COALESCE(SUM(ts.count), 0) as total_count
        FROM sptrack t
        INNER JOIN trackstat ts ON t.track_id = ts.track_id
        LEFT JOIN spalbum a ON t.album_id = a.album_id
        LEFT JOIN spalbum ca ON t.common_album_id = ca.album_id
        LEFT JOIN sptrackartist ta ON t.track_id = ta.track_id
        LEFT JOIN spartist ar ON ta.artist_id = ar.artist_id
        WHERE ts.stat_date >= ${startDate} AND ts.stat_date <= ${endDate}
        GROUP BY t.track_id, t.title, t.isrc, t.song_url, t.explicit, t.release_date, t.album_id, 
                 a.name, a.image_url, a.release_date, ca.album_id, ca.name, ca.image_url, ca.release_date
        ORDER BY total_count DESC
        LIMIT 10
      `
    ]);

    console.log(`Raw query completed in ${Date.now() - startTime}ms`);
 
    // Process the results from raw SQL queries
    const playFrequency = dailyStats.map((stat) => ({
      date: stat.date.toISOString().substring(0, 10),
      weekday: stat.weekday,
      hourly_plays: Array.isArray(stat.hourly_plays) ? stat.hourly_plays : Array(24).fill(0)
    }));

    // Format top artists from raw SQL results
    const topArtists = (topArtistsRaw as any[]).map(row => ({
      artistId: row.artist_id,
      name: row.name || '',
      image: row.image_url || 'images/spotify-icon.svg',
      artist_url: row.artist_url || '',
      count: Number(row.total_count)
    }));

    // Format top tracks from raw SQL results  
    const topTracks = (topTracksRaw as any[]).map(row => ({
      trackId: row.track_id,
      isrc: row.isrc || '',
      album: {
        albumId: row.album_id || '',
        name: row.album_name || '',
        release_date: row.album_release_date || new Date(),
        image: row.album_image || 'images/spotify-icon.svg'
      },
      common_album: {
        albumId: row.common_album_id || row.album_id || '',
        name: row.common_album_name || row.album_name || '',
        image: row.common_album_image || row.album_image || 'images/spotify-icon.svg',
        release_date: row.common_album_release_date || row.album_release_date || new Date()
      },
      artists: row.artists || '',
      songUrl: row.song_url || '',
      title: row.title || '',
      release_date: row.release_date || new Date(),
      explicit: Boolean(row.explicit),
      count: Number(row.total_count)
    }));

    console.log(`Data processing completed in ${Date.now() - startTime}ms`);

    // Get accurate metadata counts for all tracks/artists in date range
    const [totalCountsRaw] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT t.track_id) as total_track_count,
          COUNT(DISTINCT a.artist_id) as total_artist_count,
          COALESCE(SUM(CASE WHEN t.explicit = true THEN ts.count ELSE 0 END), 0) as explicit_count,
          COALESCE(SUM(ts.count), 0) as total_play_count
        FROM trackstat ts
        INNER JOIN sptrack t ON ts.track_id = t.track_id
        INNER JOIN sptrackartist ta ON t.track_id = ta.track_id
        INNER JOIN spartist a ON ta.artist_id = a.artist_id
        WHERE ts.stat_date >= ${startDate} AND ts.stat_date <= ${endDate}
      `
    ]);

    const totalCounts = (totalCountsRaw as any[])[0];
    const totalTrackCount = Number(totalCounts.total_track_count);
    const totalArtistCount = Number(totalCounts.total_artist_count);
    const explicitCount = Number(totalCounts.explicit_count);
    const totalPlayCount = Number(totalCounts.total_play_count);
    const percentExplicit = totalPlayCount > 0 ? parseFloat(((explicitCount / totalPlayCount) * 100).toFixed(1)) : 0.0;

    // Get heatmap data for top artists and tracks only (much more efficient)
    let artistHeatmaps: HeatmapFrequencies[] = [];
    let trackHeatMaps: HeatmapFrequencies[] = [];
    
    if (topArtists.length > 0 || topTracks.length > 0) {
      const topArtistIds = topArtists.map(a => a.artistId);
      const topTrackIds = topTracks.map(t => t.trackId);
      
      // Get detailed hourly data only for top items
      const [heatmapArtistStats, heatmapTrackStats] = await Promise.all([
        prisma.artiststat.findMany({
          where: { 
            artist_id: { in: topArtistIds },
            stat_date: { gte: startDate, lte: endDate },
            bucket_scope: 'day'
          },
          select: { artist_id: true, stat_date: true, hourly_plays: true }
        }),
        prisma.trackstat.findMany({
          where: { 
            track_id: { in: topTrackIds },
            stat_date: { gte: startDate, lte: endDate },
            bucket_scope: 'day'  
          },
          select: { track_id: true, stat_date: true, hourly_plays: true }
        })
      ]);

      // Format heatmaps efficiently
      artistHeatmaps = heatmapArtistStats.map(stat => ({
        date: stat.stat_date.toISOString().split('T')[0],
        weekday: format(stat.stat_date, 'EEEE'),
        hourly_plays: Array.isArray(stat.hourly_plays) && stat.hourly_plays.length === 24 
          ? stat.hourly_plays 
          : Array(24).fill(0),
        artistId: stat.artist_id,
        trackId: undefined
      }));

      trackHeatMaps = heatmapTrackStats.map(stat => ({
        date: stat.stat_date.toISOString().split('T')[0],
        weekday: format(stat.stat_date, 'EEEE'),
        hourly_plays: Array.isArray(stat.hourly_plays) && stat.hourly_plays.length === 24 
          ? stat.hourly_plays 
          : Array(24).fill(0),
        artistId: undefined,
        trackId: stat.track_id
      }));
    }

    console.log(`Query completed in ${Date.now() - startTime}ms`);

    console.log(`Query completed in ${Date.now() - startTime}ms`);

    return { 
      status: 200, 
      data: {
        topArtists,
        topTracks,
        playFrequency,
        artistHeatmaps,
        trackHeatMaps,
        meta: {
          totalTrackCount,
          totalArtistCount,
          percentExplicit
        }
      }
    };
  } catch (error) {
    console.error('Error in getSpotifyStatsByDateRange:', error);
    return { 
      status: 500, 
      data: { 
        topArtists: [], 
        topTracks: [], 
        playFrequency: [], 
        artistHeatmaps: [], 
        trackHeatMaps: [], 
        meta: { totalTrackCount: 0, totalArtistCount: 0, percentExplicit: 0 } 
      } 
    };
  }
};
