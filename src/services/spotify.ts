/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import querystring from 'querystring';

import { PAIR_DEVICES } from '@/common/constant/devices';
import { AccessTokenResponseProps, DeviceDataProps, DeviceResponseProps, NowPlayingResponseProps, SongProps, TopTracksResponseProps, TrackProps, TopArtistsResponseProps, ArtistProps, PlayHistoryResponseProps, TrackHistoryProps } from '@/common/types/spotify';
import MenuItem from '@/common/components/sidebar/MenuItem';


// Note: Here is where you edit the Spotify App https://developer.spotify.com/dashboard/4f34998e79e743ea93550fd3994f4040

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;
const TOKEN = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

const BASE_URL = 'https://api.spotify.com/v1';
const AVAILABLE_DEVICES_ENDPOINT = `${BASE_URL}/me/player/devices`;
const NOW_PLAYING_ENDPOINT = `${BASE_URL}/me/player/currently-playing`;
const TOP_TRACKS_ENDPOINT = `${BASE_URL}/me/top/tracks`;
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
    name: device.name,
    is_active: device.is_active,
    type: device.type,
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
    const response = await axios.get(`${TOP_TRACKS_ENDPOINT}?limit=10`, { headers: { Authorization: `Bearer ${access_token}` }, });

    if (response.status === 204 || response.status > 400) {
      console.warn('Top Tracks returned empty or error status:', response.status);
      return { status: response.status, data: [] };
    }

    const tracks: TrackProps[] = response.data.items.map((track: any) => ({
      album: { name: track.album.name, image: track.album.images.find( (image: { width: number }) => image.width === 64 ) },
      artist: track.artists.map((artist: { name: string }) => artist.name).join(', '),
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
      console.warn('Recently played tracks empty or error status:', response.status);
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