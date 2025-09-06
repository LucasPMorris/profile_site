import { SiWakatime, SiSpotify as SpotifyIcon } from 'react-icons/si';
import useSWR from 'swr';
import { useState } from 'react';


import SectionHeading from '@/common/components/elements/SectionHeading';
import SectionSubHeading from '@/common/components/elements/SectionSubHeading';
import TopArtists from './TopArtists';
import { fetcher } from '@/services/fetcher';
import { ArtistProps, TrackProps } from '@/common/types/spotify';
import TopTracks from './TopTracks';
import Overview from './Overview';
import DateRangeSelector from '@/common/components/elements/DateRangeSelector';

const fallback = '/spotify-icon.svg';

interface SpotifyStatItem { name?: string; value?: string; title?: string; artists?: string; songUrl?: string;   explicit?: boolean; common_album?: { image?: string }; image?: string; artist_url?: string; }

interface SpotifyStatGroup { title: string; styles: { bg: string }; data: SpotifyStatItem[]; }
interface HeatMapProps { date: string; weekday: string;  hourly_plays: number[];}

const SpotifyStats = () => {
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; });
  const [endDate, setEndDate] = useState(() => { const d = new Date(); return d.toISOString().split('T')[0]; });
  const swrKey = `/api/spotify?start=${startDate}&end=${endDate}`;
  const { data } = useSWR(swrKey, fetcher);

  if (!data) {
    return (
      <section className='flex flex-col gap-y-2'>
        <SectionHeading title='Spotify' icon={<SpotifyIcon className='mr-1' />} />
        <SectionSubHeading><div className='text-neutral-800 dark:text-neutral-400 md:flex-row md:items-center'>Loading audio stats...</div></SectionSubHeading>
        <div className='grid grid-cols-5 gap-4 sm:grid-cols-5 md:grid-cols-5 mb-3'>
          {[...Array(5)].map((_, index) => (
        <div key={index} className='flex flex-col col-span-1 h-full space-y-1 rounded-xl px-4 py-3 border border-neutral-400 bg-neutral-100 dark:border-neutral-900 sm:col-span-1 animate-pulse'>
          <div className='h-4 bg-neutral-300 dark:bg-neutral-700 rounded w-3/4'></div>
          <div className='h-6 bg-neutral-300 dark:bg-neutral-700 rounded w-1/2'></div>
        </div>
          ))}
        </div>
      </section>
    );
  }  

  const totalTopTrackPlays = data?.topTracks?.length ?? 0;
  const explicitCount = data?.topTracks?.filter((track: TrackProps) => track.explicit).length ?? 0;
  const percentExplicit = ((explicitCount / totalTopTrackPlays) * 100).toFixed(1);
  const weekdayMap = new Map<string, number[]>();

  data.playFrequency.forEach(({ weekday, hourly_plays }: HeatMapProps) => {
    if (!weekdayMap.has(weekday)) { weekdayMap.set(weekday, Array(24).fill(0)); }
      const bucket = weekdayMap.get(weekday)!;
      hourly_plays.forEach((count, hour) => { bucket[hour] += count;
    });
  });  

  const weekdayDateMap = new Map<string, string[]>();
  
  data.playFrequency.forEach(({ weekday, date, hourly_plays }: HeatMapProps) => {
    if (!weekdayDateMap.has(weekday)) { weekdayDateMap.set(weekday, []); }
    const bucket = weekdayMap.get(weekday)!;
    hourly_plays.forEach((count, hour) => { bucket[hour] += count; });
    weekdayDateMap.get(weekday)!.push(date);
  });

  const weekdayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const sortedWeekdays = weekdayOrder.filter(day => weekdayMap.has(day));
  const maxPlays = Math.max(...(data.playFrequency as { hourly_plays: number[] }[]).flatMap(({ hourly_plays }) => hourly_plays));

  const spotifyStats: SpotifyStatGroup[] = [
    {
      title: 'Listening Overview',
      styles: { bg: 'bg-green-300/30 dark:bg-green-800/30' },
      data: [ { name: 'Total Tracks', value: data.meta.totalTrackCount.toString() }, { name: 'Total Artists', value: data.meta.totalArtistCount.toString() }, { name: 'Explicit Content', value: `${percentExplicit}%` } ],
    },
    {
      title: 'Top Artists', styles: { bg: 'bg-purple-300/30 dark:bg-purple-800/30' },
      data: data?.topArtists.map((artist: ArtistProps): ArtistProps => ({ artistId: artist.artistId, name: artist.name, artist_url: artist.artist_url, image: artist.image, })) ?? [],
    },
    {
      title: 'Top Tracks', styles: { bg: 'bg-yellow-300/30 dark:bg-yellow-800/30' },
      data: data.topTracks.map((track: TrackProps): SpotifyStatItem => ({
        title: track.title, artists: track.artists, songUrl: track.songUrl, explicit: track.explicit,
        common_album: track.common_album ? { image: track.common_album.image } : undefined, image: track.common_album?.image,
      })) ?? [],
    },
  ];

  return (
    <section className='flex flex-col gap-y-4 relative'>
      <SectionHeading title='Spotify' icon={<SpotifyIcon className='mr-1' />} />
      <DateRangeSelector startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} />
      <SectionSubHeading><div className='text-neutral-800 dark:text-neutral-400 md:flex-row md:items-center'>My audio listening habits!</div></SectionSubHeading>
      <Overview spotifyStats={spotifyStats} weekdayMap={weekdayMap} sortedWeekdays={sortedWeekdays} weekdayDateMap={weekdayDateMap} maxPlays={maxPlays} />
      <TopTracks spotifyStats={spotifyStats} />
      <TopArtists spotifyStats={spotifyStats} />
    </section>
  );
};

export default SpotifyStats;