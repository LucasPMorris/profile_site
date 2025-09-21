import { SiWakatime, SiSpotify as SpotifyIcon } from 'react-icons/si';
import useSWR from 'swr';
import { useEffect, useState } from 'react';

import SectionHeading from '@/common/components/elements/SectionHeading';
import SectionSubHeading from '@/common/components/elements/SectionSubHeading';
import TopArtists from './TopArtists';
import { fetcher } from '@/services/fetcher';
import { ArtistProps, TrackProps } from '@/common/types/spotify';
import TopTracks from './TopTracks';
import Overview from './Overview';
import DateRangeSelector from '@/common/components/elements/DateRangeSelector';
import { format, getISOWeek, startOfDay, startOfISOWeek, startOfWeek } from 'date-fns';
import Heatmap from './Heatmap';
import clsx from 'clsx';

const fallback = '/spotify-icon.svg';

interface SpotifyStatItem { name?: string; value?: string; title?: string; artists?: string; songUrl?: string; explicit?: boolean; common_album?: { image?: string }; image?: string; artist_url?: string; }
interface SpotifyStatGroup { title: string; styles: { bg: string }; data: SpotifyStatItem[]; }
interface HeatMapProps { date: string; weekday: string; hourly_plays: number[]; artistId?: string; trackId?: string; }

const SpotifyStats = () => {
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; });
  const [endDate, setEndDate] = useState(() => { const d = new Date(); return d.toISOString().split('T')[0]; });
  const swrKey = `/api/spotify?start=${startDate}&end=${endDate}`;
  const { data } = useSWR(swrKey, fetcher);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  useEffect(() => {
    if (data?.topArtists?.length && !selectedArtistId) { setSelectedArtistId(data.topArtists[0].artistId); }
    if (data?.topTracks?.length && !selectedTrackId) { setSelectedTrackId(data.topTracks[0].artistId); }
  }, [data, selectedArtistId, selectedTrackId]);

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
  
  // Initialize hourly map with proper weekday handling
  const hourlyMap = new Map<string, number[]>();

  data.playFrequency.forEach(({ date, hourly_plays }: HeatMapProps) => {
    const weekday = format(new Date(date), 'EEEE'); // 'Monday', 'Tuesday', etc.
    if (!hourlyMap.has(weekday)) hourlyMap.set(weekday, Array(24).fill(0));
    const bucket = hourlyMap.get(weekday)!;
    hourly_plays.forEach((count, hour) => { bucket[hour] += count; });
  });

  const weekdayMap = new Map<string, {start: Date, counts: (number | null)[]}>();
  data.playFrequency.forEach(({ date, hourly_plays }: HeatMapProps) => {
    const d = startOfDay(new Date(date));
    const weekStart = startOfWeek(d, { weekStartsOn: 0 });
    const label = `${format(weekStart, "MMM d ''yy")}`;
    const weekday = d.getDay(); // 0 = Sun, 6 = Sat
    const totalPlays = hourly_plays.reduce((a, b) => a + b, 0);

    if (!weekdayMap.has(label)) { weekdayMap.set(label, { start: weekStart, counts: Array(7).fill(null) }); }

    const counts = weekdayMap.get(label)!.counts;
    counts[weekday] = (counts[weekday] ?? 0) + totalPlays;
  });

  const monthlyMap = new Map<string, (number | null)[]>();
  data.playFrequency.forEach(({ date, hourly_plays }: HeatMapProps) => {
    const d = new Date(date);
    const year = d.getFullYear().toString();
    const monthIndex = d.getMonth(); // 0 = Jan, 11 = Dec

    const totalPlays = hourly_plays.reduce((a, b) => a + b, 0);

    if (!monthlyMap.has(year)) { 
      monthlyMap.set(year, Array(12).fill(null)); 
    }
    const current = monthlyMap.get(year)![monthIndex];
    if (monthlyMap.get(year)) { 
      monthlyMap.get(year)![monthIndex] = (monthlyMap.get(year)![monthIndex] ?? 0) + totalPlays; 
    }
  });

  // Create sorted weekdays based on what's actually in your data
  const weekdayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const sortedWeekdays = weekdayOrder.filter(day => hourlyMap.has(day));

  // Artist-specific heatmap data (only if we have artists)
  const selectedArtistPlays = data.artistHeatmaps.filter((p: HeatMapProps) => p.artistId === selectedArtistId);
  const artistHourlyMap = new Map<string, number[]>();
  const artistWeekdayMap = new Map<string, { start: Date; counts: (number | null)[] }>();
  const artistMonthlyMap = new Map<string, (number | null)[]>();

  const selectedTrackPlays = data.trackHeatMaps.filter((p: HeatMapProps) => p.trackId === selectedTrackId);
  const trackHourlyMap = new Map<string, number[]>();
  const trackWeekdayMap = new Map<string, { start: Date; counts: (number | null)[] }>();
  const trackMonthlyMap = new Map<string, (number | null)[]>();

  selectedArtistPlays.forEach(({ date, weekday, hourly_plays }: HeatMapProps) => {
    const totalPlays = hourly_plays.reduce((a, b) => a + b, 0);

    // Hourly
    if (!artistHourlyMap.has(weekday)) { artistHourlyMap.set(weekday, Array(24).fill(0)); }
    hourly_plays.forEach((count, hour) => { artistHourlyMap.get(weekday)![hour] += count; });

    // Weekly
    const d = startOfDay(new Date(date));
    const weekStart = startOfWeek(d, { weekStartsOn: 0 });
    const label = `${format(weekStart, "MMM d ''yy")}`;
    const dayIndex = d.getDay();

    if (!artistWeekdayMap.has(label)) { artistWeekdayMap.set(label, { start: weekStart, counts: Array(7).fill(null) }); }
    artistWeekdayMap.get(label)!.counts[dayIndex] = (artistWeekdayMap.get(label)!.counts[dayIndex] ?? 0) + totalPlays;

    // Monthly
    const year = d.getFullYear().toString();
    const monthIndex = d.getMonth();
    if (!artistMonthlyMap.has(year)) { artistMonthlyMap.set(year, Array(12).fill(null)); }
    artistMonthlyMap.get(year)![monthIndex] = (artistMonthlyMap.get(year)![monthIndex] ?? 0) + totalPlays;
  });

  selectedTrackPlays.forEach(({ date, weekday, hourly_plays }: HeatMapProps) => {
    const totalPlays = hourly_plays.reduce((a, b) => a + b, 0);

    // Hourly
    if (!trackHourlyMap.has(weekday)) { trackHourlyMap.set(weekday, Array(24).fill(0)); }
    hourly_plays.forEach((count, hour) => { trackHourlyMap.get(weekday)![hour] += count; });

    // Weekly
    const d = startOfDay(new Date(date));
    const weekStart = startOfWeek(d, { weekStartsOn: 0 });
    const label = `${format(weekStart, "MMM d ''yy")}`;
    const dayIndex = d.getDay();

    if (!trackWeekdayMap.has(label)) { trackWeekdayMap.set(label, { start: weekStart, counts: Array(7).fill(null) }); }
    trackWeekdayMap.get(label)!.counts[dayIndex] = (trackWeekdayMap.get(label)!.counts[dayIndex] ?? 0) + totalPlays;

    // Monthly
    const year = d.getFullYear().toString();
    const monthIndex = d.getMonth();
    if (!trackMonthlyMap.has(year)) { trackMonthlyMap.set(year, Array(12).fill(null)); }
    trackMonthlyMap.get(year)![monthIndex] = (trackMonthlyMap.get(year)![monthIndex] ?? 0) + totalPlays;
  });

  const maxPlays = Math.max(...(data.playFrequency as { hourly_plays: number[] }[]).flatMap(({ hourly_plays }) => hourly_plays));

  const spotifyStats: SpotifyStatGroup[] = [
    {
      title: 'Listening Overview',
      styles: { bg: 'bg-green-300/30 dark:bg-green-800/30' },
      data: [ 
        { name: 'Total Tracks', value: data.meta.totalTrackCount.toString() }, 
        { name: 'Total Artists', value: data.meta.totalArtistCount.toString() }, 
        { name: 'Explicit Content', value: `${percentExplicit}%` } 
      ],
    },
    {
      title: 'Top Artists', 
      styles: { bg: 'bg-purple-300/30 dark:bg-purple-800/30' },
      data: data?.topArtists?.map((artist: ArtistProps): ArtistProps => ({ 
        artistId: artist.artistId, 
        name: artist.name, 
        artist_url: artist.artist_url, 
        image: artist.image, 
      })) ?? [],
    },
    {
      title: 'Top Tracks', 
      styles: { bg: 'bg-yellow-300/30 dark:bg-yellow-800/30' },
      data: data.topTracks?.map((track: TrackProps): SpotifyStatItem => ({
        title: track.title,
        artists: track.artists,
        songUrl: track.songUrl,
        explicit: track.explicit,
        common_album: track.common_album ? { image: track.common_album.image } : undefined, image: track.common_album?.image, })) ?? [],
    },
  ];

  return (
    <section className='flex flex-col gap-y-4 relative'>
      <SectionHeading title='Spotify' icon={<SpotifyIcon className='mr-1' />} />
      <DateRangeSelector startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} />
      <SectionSubHeading><div className='text-neutral-800 dark:text-neutral-400 md:flex-row md:items-center'>My audio listening habits!</div></SectionSubHeading>
      
      {/* Main Overview and Heatmap */}
      <Overview spotifyStats={spotifyStats} hourlyMap={hourlyMap} sortedWeekdays={sortedWeekdays} weekdayMap={weekdayMap} monthlyMap={monthlyMap} maxPlays={maxPlays} />
      
      {/* Top Artist round about */}
      <TopTracks spotifyStats={spotifyStats} />

      {/* Track-specific heatmap section */}
      {data.topTracks?.length > 0 && (
        <div className='flex flex-col gap-2'>
          <h3 className='text-lg font-semibold'>Track-Specific Listening Patterns</h3>
          <div className='flex flex-wrap gap-2'>
            {data.topTracks.map((track: TrackProps) => (
              <button key={track.trackId} onClick={() => setSelectedTrackId(track.trackId)}
                className={clsx('px-3 py-1 rounded-full text-sm font-medium transition',
                  selectedTrackId === track.trackId
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                )}
              >
                {track.title}
              </button>
            ))}
          </div>

          {selectedTrackId && selectedTrackPlays.length > 0 && ( <Heatmap hourlyMap={trackHourlyMap} sortedWeekdays={weekdayOrder.filter(day => trackHourlyMap.has(day))} weekdayMap={trackWeekdayMap} monthlyMap={trackMonthlyMap} maxPlays={0} /> )}
          {selectedTrackId && selectedTrackPlays.length === 0 && ( <div className='p-4 text-center text-neutral-500 bg-neutral-100 rounded-lg'>No listening data available for this track in the selected date range.</div> )}
        </div>
      )}

      {/* Show message if no artists at all */}
      {(!data.topTracks || data.topTracks.length === 0) && ( <div className='p-4 text-center text-neutral-500 bg-neutral-100 rounded-lg'> No top track data available. Check your Spotify data ingestion. </div> )}

      {/* Top Artist round about */}
      <TopArtists spotifyStats={spotifyStats} />
      
      {/* Artist-specific heatmap section */}
      {data.topArtists?.length > 0 && (
        <div className='flex flex-col gap-2'>
          <h3 className='text-lg font-semibold'>Artist-Specific Listening Patterns</h3>
          <div className='flex flex-wrap gap-2 mb-3'>
            {data.topArtists.map((artist: ArtistProps) => (
              <button key={artist.artistId} onClick={() => setSelectedArtistId(artist.artistId)}
                className={clsx('px-3 py-1 rounded-full text-sm font-medium transition',
                  selectedArtistId === artist.artistId
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                )}
              >
                {artist.name}
              </button>
            ))}
          </div>
          
          {selectedArtistId && selectedArtistPlays.length > 0 && ( <Heatmap hourlyMap={artistHourlyMap} sortedWeekdays={weekdayOrder.filter(day => artistHourlyMap.has(day))} weekdayMap={artistWeekdayMap} monthlyMap={artistMonthlyMap} maxPlays={0} /> )}
          {selectedArtistId && selectedArtistPlays.length === 0 && ( <div className='p-4 text-center text-neutral-500 bg-neutral-100 rounded-lg'> No listening data available for this artist in the selected date range.</div>)}    
        </div>
      )}
      
      {/* Show message if no artists at all */}
      {(!data.topArtists || data.topArtists.length === 0) && ( <div className='p-4 text-center text-neutral-500 bg-neutral-100 rounded-lg'> No top artists data available. Check your Spotify data ingestion. </div> )}
    </section>
  );
};

export default SpotifyStats;