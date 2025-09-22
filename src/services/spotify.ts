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

function getTopItems(playCountMap: Map<string, number>, playStats: any[], type: 'track' | 'artist' | 'album') {
  const sortedEntries = Array.from(playCountMap.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
    
  return sortedEntries.map(([id, count]) => {
    // Find representative item from play stats
    const representative = playStats.find(play => {
      if (type === 'track') return (play.track.isrc || play.track.track_id) === id;
      if (type === 'artist') return play.track.track_artists.some((ta: any) => ta.artist.artist_id === id);
      if (type === 'album') return (play.track.common_album?.album_id || play.track.album.album_id) === id;
      return false;
    });
    
    if (type === 'track') {
      return {
        trackId: representative.track.track_id,
        title: representative.track.title,
        artists: representative.track.track_artists.map((ta: any) => ta.artist.name).join(', '),
        playCount: count
      };
    } else if (type === 'artist') {
      const artist = representative.track.track_artists.find((ta: any) => ta.artist.artist_id === id);
      return {
        artistId: artist.artist.artist_id,
        name: artist.artist.name,
        playCount: count
      };
    } else { // album
      const album = representative.track.common_album || representative.track.album;
      return {
        albumId: album.album_id,
        name: album.name,
        image: album.image_url || '',
        playCount: count
      };
    }
  });
}

export const getSpotifyStatsByDateRange = async (startDate: string, endDate: string): Promise<any> => {
  try {
    // Single optimized query with date filtering and aggregation
   const playStats = await prisma.spplayhistory.findMany({
      where: { played_at: { gte: new Date(startDate), lte: new Date(endDate) } },
      include: { track: { include: { album: true, common_album: true, track_artists: { include: { artist: true } } } } },
      orderBy: { played_at: 'desc' }
    });

    // Process data in memory instead of additional DB queries
    const trackPlayCounts = new Map<string, number>();
    const artistPlayCounts = new Map<string, number>();
    const albumPlayCounts = new Map<string, number>();
    
    for (const play of playStats) {
      const track = play.track;
      
      // Count by ISRC for deduplication
      const key = track.isrc || track.track_id;
      trackPlayCounts.set(key, (trackPlayCounts.get(key) || 0) + 1);
      
      // Count artist plays
      for (const ta of track.track_artists) {
        const artistKey = ta.artist.artist_id;
        artistPlayCounts.set(artistKey, (artistPlayCounts.get(artistKey) || 0) + 1);
      }
      
      // Count album plays
      const albumKey = track.common_album?.album_id || track.album.album_id;
      albumPlayCounts.set(albumKey, (albumPlayCounts.get(albumKey) || 0) + 1);
    }

    return {
      recentlyPlayed: playStats.map(play => ({
        trackId: play.track.track_id,
        title: play.track.title,
        played_at: play.played_at,
        explicit: play.track.explicit,
        artists: play.track.track_artists.map(ta => ta.artist.name).join(', '),
        album: {
          albumId: play.track.album.album_id,
          name: play.track.album.name,
          image: play.track.album.image_url || ''
        }
      })),
      topTracks: getTopItems(trackPlayCounts, playStats, 'track'),
      topArtists: getTopItems(artistPlayCounts, playStats, 'artist'),
      topAlbums: getTopItems(albumPlayCounts, playStats, 'album')
    };
  } catch (error) {
    console.error('Error fetching Spotify stats by date range:', error);
    throw error;
  }
};