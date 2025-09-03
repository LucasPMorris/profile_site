/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import querystring, { stringify } from 'querystring';

import { PAIR_DEVICES } from '@/common/constant/devices';
import { AccessTokenResponseProps, DeviceDataProps, DeviceResponseProps, NowPlayingResponseProps, SongProps, TopTracksResponseProps, TrackProps, TopArtistsResponseProps, ArtistProps, PlayHistoryResponseProps, TrackHistoryProps, RawRecentlyPlayedResponse } from '@/common/types/spotify';
import prisma from '@/common/libs/prisma';

// Note: Here is where you edit the Spotify App https://developer.spotify.com/dashboard/4f34998e79e743ea93550fd3994f4040

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;
const TOKEN = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

const BASE_URL = 'https://api.spotify.com/v1';
const AVAILABLE_DEVICES_ENDPOINT = `${BASE_URL}/me/player/devices`;
const NOW_PLAYING_ENDPOINT = `${BASE_URL}/me/player/currently-playing`;
const TOP_TRACKS_ENDPOINT = `${BASE_URL}/me/top/tracks=50&time_range=long_term`;
const TOP_ARTISTS_ENDPOINT = `${BASE_URL}/me/top/artists?limit=5&time_range=long_term`;
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

export const getTopTracks = async (): Promise<TopTracksResponseProps> => {
  try {
    const { access_token } = await getAccessToken();
    const response = await axios.get(`${TOP_TRACKS_ENDPOINT}`, { headers: { Authorization: `Bearer ${access_token}` }, });

    if (response.status === 204 || response.status > 400) {
      console.warn('Top Tracks returned empty or error status:', response.status);
      return { status: response.status, data: [] };
    }

    const tracks: TrackProps[] = response.data.items.map((track: any) => ({
      album: { id: track.album.almbumId, name: track.album.name, release_date: track.album.release_date, image: track.album.images.find( (image: { width: number }) => image.width === 64 ) },
      artists: track.artists.map((artist: { artistId: string, artst_url: string, name: string }) => artist.name).join(', '),
      songUrl: track.external_urls.spotify,
      title: track.name,
      release_date: track.release_date,
      explicit: track.explicit
    }));

    return { status: response.status, data: tracks };
  } catch (err) {
    console.error('getTopTracks failed:', err);
    return { status: 500, data: [] };
  }
}

export const getTopArtists = async (): Promise<TopArtistsResponseProps> => {
  try {
    const { access_token } = await getAccessToken();
    const response = await axios.get(TOP_ARTISTS_ENDPOINT, { headers: { Authorization: `Bearer ${access_token}` } });
  
    if (response.status === 204 || response.status > 400) {
      console.warn('Top Artists returned empty or error status:', response.status);
      return { status: response.status, data: [] };
    }

    const artists: ArtistProps[] = response.data.items.map((artist: any) => ({
      artistId: artist.id,
      image: artist.images.find( (image: { width: number }) => image.width === 160 ),
      artist: artist.name,
      external_urls: artist.external_urls.spotify,
      name: artist.name,
    }));

    return { status: response.status, data: artists };
  
  } catch (error) {
    console.error('Error fetching artists:', error);
    return { status: 500, data: [] };
  }
};

export const getRecentlyPlayed = async (): Promise<PlayHistoryResponseProps> => {
  try {
    const { access_token } = await getAccessToken();
    const response = await axios.get(RECENTLY_PLAYED_ENDPOINT, { headers: { Authorization: `Bearer ${access_token}` } });
  
    if (response.status === 204 || response.status > 400) {
      console.warn('Recently played tracks empty or missing, error status:', response.status);
      return { status: response.status, data: [] };
    }

    const tracks: TrackHistoryProps[] = response.data.items.map((item: any) => {
      const track = item.track;
      return {
        album: { name: track.album.name, images: track.album.images.find( (image: { width: number }) => image.width === 64 ) },
        played_at: item.played_at,
        artist: track.name,
        image: track.album.images.find( (image: { width: number }) => image.width === 64 ),
        explicit: track.explicit,
        release_date: track.release_date,
        songUrl: track.external_urls.spotify,
        title: track.name,
      };
    });

    return { status: response.status, data: tracks };
  } catch (error) {
    console.error('Error fetching recently played tracks:', error);
    return { status: 500, data: [] };
  }
}

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
    const response = await axios.get(RECENTLY_PLAYED_ENDPOINT, { headers: { Authorization: `Bearer ${access_token}` } });
  
    if (response.status === 204 || response.status > 400) {
      console.warn('Recently played tracks empty or missing, error status:', response.status);
      return { status: response.status, data: [] };
    }

    return { status: 200, data: response.data.items }; // raw Spotify items
  } catch (error) {
    console.error('Error fetching recently played tracks:', error);
    return { status: 500, data: [] };
  }
};

export const getTopArtistsFromDB = async (): Promise<TopArtistsResponseProps> => {
  const artists = await prisma.spartist.findMany({
    take: 5,
    orderBy: { name: 'asc' } // Example: ordering by name in ascending order
  });

  return {
    status: 200,
    data: artists.map((
      artist: { name: string; artist_url: string; image_url: string | null; artist_id: string }) => ({
      artistId: artist.artist_id,
      name: artist.name,
      image: artist.image_url ?? '', // Provide a fallback value for null
      artist_url: artist.artist_url,
      artist: artist.name
    }))
  };
};

export const getTopTracksFromDB = async (): Promise<TopTracksResponseProps> => {
  const rawIsrcs = await prisma.sptrack.findMany({
    select: { isrc: true, album: true, plays: true, track_id: true, track_artists: { include: { artist: true } } }
  });

  const isrcs = Array.from(new Set(rawIsrcs.map(t => t.isrc)));

  const playCounts = await Promise.all(
    isrcs.map(async (isrc) => {
      const tracks = rawIsrcs.filter(t => t.isrc === isrc);
      const trackIds = tracks.map(t => t.track_id);
      const count = await prisma.spplayhistory.count({ where: { track_id: { in: trackIds } } });
      return { isrc, count };
    })
  );

  const topPlayedISRCs = playCounts.sort((a, b) => b.count - a.count).slice(0, 5);

  const topTracks = await prisma.sptrack.findMany({
    where: { isrc: { in: topPlayedISRCs.map(t => t.isrc) } },
    include: { album: true, common_album: true, plays: true, track_artists: { include: { artist: true } } }
  });

  const topTracksSorted = topPlayedISRCs.map(({ isrc }) => {
    const candidates = topTracks.filter(t => t.isrc === isrc);
    return candidates.sort((a, b) => b.plays.length - a.plays.length)[0];
  });  

  return {
    status: 200,
    data: topTracksSorted.map((track): TrackProps => ({
      trackId: track.track_id,
      isrc: track.isrc,
      album: { albumId: track.album.album_id, name: track.album.name, release_date: track.album.release_date ? track.album.release_date : new Date(), image: track.album.image_url ?? '' },
      common_album: track.common_album ?
        {
          albumId: track.common_album.album_id,
          name: track.common_album.name,
          image: track.common_album.image_url ?? '',
          release_date: track.common_album.release_date ?? new Date()
        } : null, 
      artists: track.track_artists.map(ta => ta.artist.name).join(', '),
      songUrl: track.song_url ?? '',
      title: track.title,
      release_date: track.release_date || new Date(),
      explicit: track.explicit
    }))
  };
};

export const getRecentlyPlayedFromDB = async (): Promise<PlayHistoryResponseProps> => {
  const recentPlays = await prisma.spplayhistory.findMany({
    orderBy: { played_at: 'desc' },
    include: { track: { include: { album: true, common_album: true, track_artists: { include: { artist: true } } } } },
  });

  const tracks: TrackHistoryProps[] = recentPlays.map((play) => {
    const track = play.track;
    const album = track.album;

    return {
      trackId: track.track_id,
      title: track.title,
      songUrl: track.song_url ?? '',
      played_at: play.played_at,
      explicit: track.explicit,
      release_date: track.release_date ?? new Date(),
      artists: track.track_artists.map(ta => ta.artist.name).join(', '),
      album: { albumId: album.album_id, name: album.name, image: album.image_url ?? '' },
      isrc: track.isrc,
      common_album: track.common_album
      ? {
          albumId: track.common_album.album_id,
          name: track.common_album.name ?? '',
          image: track.common_album.image_url ?? '',
          release_date: track.common_album.release_date ?? new Date()
        }
      : null
    };
  });

  return {
    status: 200,
    data: tracks
  };
};
