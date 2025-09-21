import { ReactNode } from 'react';

export interface AccessTokenResponseProps { access_token: string; }

export interface DeviceProps { is_active: boolean; name: string; type: string; icon?: ReactNode; id?: string; model?: string; }

export type DeviceInfoProps = Pick<DeviceProps, 'icon' | 'model' | 'id'>;

export interface DeviceDataProps { devices: DeviceProps[]; }

export interface DeviceResponseProps { status: number; data: DeviceProps[]; }

export interface SongProps {
  is_playing: boolean;
  item: { 
    album: {  name: string; images: { width: number; url: string; }[]; };
    artists: { name: string; }[];
    external_urls: { spotify: string; };
    name: string;
  };
}

export interface AlbumProps { albumId: string; name: string; release_date: Date; image: string }

export interface TrackProps {
  trackId: string;
  isrc: string;
  album: { albumId: string; name: string; release_date: Date, image: string };
  common_album: AlbumProps | null;
  artists: string;
  songUrl: string;
  title: string;
  release_date: Date;
  explicit: boolean;  
}

export interface RawRecentlyPlayedResponse { status: number; data: []; }

export interface NowPlayingProps { songUrl: string; albumImageUrl: string | undefined; album: string; title: string; artist: string; }

export interface NowPlayingResponseProps { status: number; isPlaying: boolean; data: NowPlayingProps | null; }

export interface TopTracksResponseProps { status: number; data: TrackProps[]; }

export interface ArtistProps { artistId: string, name: string; artist_url: string; image: string }

export interface TopArtistsResponseProps { status: number; data: ArtistProps[]; }

export interface TrackHistoryProps {
  album: { albumId: string; name: string; image: string };
  common_album: AlbumProps | null;
  isrc: string;
  title: string;
  artists: string;
  songUrl: string; 
  played_at: Date;
  explicit: boolean;
  release_date: Date; 
}


export interface HeatmapFrequencies { date: string; weekday: string; hourly_plays: number[]; artistId?: string; trackId?: string;}

export interface HeatmapDisplayProps { hourlyMap: Map<string, number[]>; sortedWeekdays: string[]; weekdayMap: Map<string, { start: Date, counts: (number | null)[] }>; monthlyMap: Map<string, (number | null)[]>; maxPlays: number; }

export interface PlayHistoryResponseProps { status: number; data: TrackHistoryProps[]; }

export interface SpotifyDataProps { topArtists: ArtistProps[]; topTracks: TrackProps[]; artistHeatmaps: HeatmapFrequencies[]; trackHeatMaps: HeatmapFrequencies[]; playFrequency: HeatmapFrequencies[]; meta: { totalTrackCount: number; totalArtistCount: number; }; }

export interface SpotifyStatsProps {  topArtists: ArtistProps[]; topTracks: TrackProps[]; }

export interface SpotifyDataResponseProps { status: number; data: SpotifyDataProps; } 