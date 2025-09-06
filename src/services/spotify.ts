/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import querystring, { stringify } from 'querystring';

import { PAIR_DEVICES } from '@/common/constant/devices';
import { SpotifyDataResponseProps } from '@/common/types/spotify';
import { AccessTokenResponseProps, DeviceDataProps, DeviceResponseProps, NowPlayingResponseProps, SongProps, TopTracksResponseProps, TrackProps, TopArtistsResponseProps, ArtistProps, PlayHistoryResponseProps, TrackHistoryProps, RawRecentlyPlayedResponse } from '@/common/types/spotify';
import prisma from '@/common/libs/prisma';

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

export const getSpotifyStatsByDateRange = async (startDate: Date, endDate: Date): Promise<SpotifyDataResponseProps> => {
  const stats = await prisma.spdailyplaystats.findMany({ 
    where: { date: { gte: startDate, lte: endDate }},
    include: { top_tracks: { include: { track: { include: { album: true, common_album: true, track_artists: { include: { artist: true } } } } } }, top_artists: { include: { artist: true } } } 
  });
  
  const allTrackStats = stats.flatMap(s => s.top_tracks);
  const allArtistStats = stats.flatMap(s => s.top_artists);

  // Aggregate counts across days
  const trackMap = new Map<string, { track: any, count: number }>();
  for (const stat of allTrackStats) {
    const key = stat.track_id;
    const existing = trackMap.get(key);
    if (existing) { existing.count += stat.count; }
    else { trackMap.set(key, { track: stat.track, count: stat.count }); }
  }

  const artistMap = new Map<string, { artist: any, count: number }>();
  for (const stat of allArtistStats) {
    const key = stat.artist_id;
    const existing = artistMap.get(key);
    if (existing) { existing.count += stat.count; }
    else { artistMap.set(key, { artist: stat.artist, count: stat.count }); }
  }

  const heatmapData = stats.map(stat => ({
      date: stat.date.toISOString().split('T')[0],
      weekday: stat.weekday,
      hourly_plays: Array.isArray(stat.hourly_plays) ? stat.hourly_plays as number[] : [],
  }));

  const totalTrackCount = allTrackStats.length;
  const totalArtistCount = allArtistStats.length;

  const topArtists = Array.from(artistMap.values()).sort((a, b) => b.count - a.count).slice(0, 10).map(({ artist }) =>  ({
    artistId: artist.artist_id,
    name: artist.name,
    image: artist.image_url ?? "images/spotify-icon.svg", // Provide a fallback value for null
    artist_url: artist.artist_url
  }));

  const topTracks = Array.from(trackMap.values()).sort((a, b) => b.count - a.count).slice(0, 10).map(({ track }) => ({
    trackId: track.track_id,
    isrc: track.isrc,
    album: { 
      albumId: track.album.album_id,
      name: track.album.name,
      release_date: track.album.release_date ? track.album.release_date : new Date(),
      image: track.album.image_url ?? 'images/spotify-icno.svg' },
    common_album: track.common_album ? {
        albumId: track.common_album.album_id, 
        name: track.common_album.name,
        image: track.common_album.image_url ?? 'images/spotify-icon.svg',
        release_date: track.common_album.release_date ?? new Date()
      } : null,
    artists: track.track_artists.map((ta: { artist: { name: string } }) => ta.artist.name).join(', '),
    songUrl: track.song_url ?? '',
    title: track.title,
    release_date: track.release_date || new Date(),
    explicit: track.explicit
  }));
 

return { status: 200, data: { topArtists, topTracks, playFrequency: heatmapData, meta: {totalTrackCount, totalArtistCount} } }
};