import { SiSpotify as SpotifyIcon } from 'react-icons/si';
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
import { format, startOfDay, startOfWeek } from 'date-fns';
import Heatmap from './Heatmap';
import clsx from 'clsx';
import Card from '@/common/components/elements/Card';
import { formatDynamicAPIAccesses } from 'next/dist/server/app-render/dynamic-rendering';

const fallback = '/spotify-icon.svg';

interface SpotifyStatItem { name?: string; value?: string; title?: string; artists?: string; songUrl?: string; explicit?: boolean; common_album?: { image?: string }; image?: string; artist_url?: string; trackId?: string; }
interface SpotifyStatGroup { title: string; styles: { bg: string }; data: SpotifyStatItem[]; }
interface HeatMapProps { date: string; weekday: string; hourly_plays: number[]; artistId?: string; trackId?: string; }

const SpotifyStats = () => {
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 365); return d.toISOString().split('T')[0]; });
  const [endDate, setEndDate] = useState(() => { const d = new Date(); return d.toISOString().split('T')[0]; });
  const swrKey = `/api/spotify?start=${startDate}&end=${endDate}`;
  const { data } = useSWR(swrKey, fetcher);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  useEffect(() => {
    if (data?.topArtists?.length && !selectedArtistId) { setSelectedArtistId(data.topArtists[0].artistId); }
    if (data?.topTracks?.length && !selectedTrackId) { setSelectedTrackId(data.topTracks[0].trackId); }
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
  const selectedArtistPlays: HeatMapProps[] = data.artistHeatmaps.filter((p: HeatMapProps) => p.artistId === selectedArtistId);
  const artistHourlyMap = new Map<string, number[]>();
  const artistWeekdayMap = new Map<string, { start: Date; counts: (number | null)[] }>();
  const artistMonthlyMap = new Map<string, (number | null)[]>();

  const selectedTrackPlays: HeatMapProps[] = data.trackHeatMaps.filter((p: HeatMapProps) => p.trackId === selectedTrackId);
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

  const totalDays = startDate && endDate ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))) : 1;

  const overallTotalPlays = data.playFrequency.reduce((sum: number, p: HeatMapProps) => sum + p.hourly_plays.reduce((a, b) => a + b, 0), 0);
  const avgPlaysPerDay = (overallTotalPlays / totalDays).toFixed(1);
 
  const spotifyStats: SpotifyStatGroup[] = [
    {
      title: 'Listening Overview',
      styles: { bg: 'bg-green-300/30 dark:bg-green-800/30' },
      data: [ { name: 'Total Tracks', value: data.meta.totalTrackCount.toString() }, { name: 'Total Artists', value: data.meta.totalArtistCount.toString() }, { name: 'Explicit Content', value: `${data.meta.percentExplicit}%` }, { name: 'Avg/Day', value: `${avgPlaysPerDay}`}  ],
    },
    {
      title: 'Top Artists', styles: { bg: 'bg-purple-300/30 dark:bg-purple-800/30' },
      data: data?.topArtists?.map((artist: ArtistProps): ArtistProps => ({ artistId: artist.artistId,  name: artist.name,  artist_url: artist.artist_url, image: artist.image })
      ) ?? [],
    },
    {
      title: 'Top Tracks',  styles: { bg: 'bg-yellow-300/30 dark:bg-yellow-800/30' },
      data: data.topTracks?.map((track: TrackProps): SpotifyStatItem => ({
        trackId: track.trackId, title: track.title, artists: track.artists, songUrl: track.songUrl, explicit: track.explicit,
        common_album: track.common_album ? { image: track.common_album.image } : undefined, image: track.common_album?.image, })
      ) ?? [],
    },
  ];

  const maxPlays = Math.max(...(data.playFrequency as { hourly_plays: number[] }[]).flatMap(({ hourly_plays }) => hourly_plays));
  const uniqueTracks = Array.from( new Set( selectedArtistPlays.filter(p => p.trackId && typeof p.trackId === 'string').map(p => p.trackId))).length;
  const totalPlays = selectedArtistPlays.reduce((sum, p) => sum + p.hourly_plays.reduce((a, b) => a + b, 0), 0);
  const activeDays = new Set(selectedTrackPlays.map((p: HeatMapProps) => p.date)).size;
  const totalTrackPlays = selectedTrackPlays.reduce((sum: number, p: HeatMapProps) => sum + p.hourly_plays.reduce((a, b) => a + b, 0), 0);
  const firstPlayed = selectedArtistPlays.map(p => new Date(p.date)).sort((a, b) => a.getTime() - b.getTime())[0];

  return (
    <section className='flex flex-col gap-y-4 relative'>
      <SectionHeading title='Spotify' icon={<SpotifyIcon className='mr-1' />} />
      <DateRangeSelector startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} />
      <SectionSubHeading><div className='text-neutral-800 dark:text-neutral-400 md:flex-row md:items-center'>My personal history represented through music!</div></SectionSubHeading>
      
      {/* Main Overview and Heatmap */}
      <Overview spotifyStats={spotifyStats} hourlyMap={hourlyMap} sortedWeekdays={sortedWeekdays} weekdayMap={weekdayMap} monthlyMap={monthlyMap} maxPlays={maxPlays} />

      {/* Top Artist Section */}
      <TopArtists spotifyStats={spotifyStats} selectedArtistId={selectedArtistId} onArtistSelect={setSelectedArtistId} />
      {data.topArtists?.length > 0 && (
        <>        
            {selectedArtistId && selectedArtistPlays.length > 0 && (
              <div className='grid grid-cols-1 md:grid-cols-5 gap-4 mb-4'>
                {/* Left-Side Artist Stats */}
                <div className='md:col-span-1 flex flex-col gap-4'>
                  <div className='col-span-1'><h3 className='text-md font-semibold'>{data.topArtists.find((a: any) => a.artistId === selectedArtistId)?.name} Listening History</h3></div>
                  <Card className='flex flex-col space-y-1 rounded-xl px-4 py-3 border border-neutral-400 bg-neutral-100 dark:border-neutral-900'>
                    <span className='text-xs font-medium text-neutral-500 dark:text-neutral-400 tracking-wide uppercase'>First Played</span>
                    <span className='text-lg font-semibold text-neutral-800 dark:text-neutral-100'>{format(firstPlayed, 'MMM,  yyyy')}</span>
                  </Card>
                  <Card className='flex flex-col space-y-1 rounded-xl px-4 py-3 border border-neutral-400 bg-neutral-100 dark:border-neutral-900'>
                    <span className='text-xs font-medium text-neutral-500 dark:text-neutral-400 tracking-wide uppercase'>Total Plays</span>
                    <span className='text-lg font-semibold text-neutral-800 dark:text-neutral-100'>{totalPlays}</span>
                  </Card>
                </div>
                <div className='md:col-span-4 flex flex-col gap-2'>  
                  <Heatmap hourlyMap={artistHourlyMap}  sortedWeekdays={weekdayOrder.filter(day => artistHourlyMap.has(day))}  weekdayMap={artistWeekdayMap}  monthlyMap={artistMonthlyMap}  maxPlays={maxPlays} />
                </div>
              </div>
            )}
            {selectedArtistId && selectedArtistPlays.length === 0 && ( <div className='p-4 text-center text-neutral-500 bg-neutral-100 rounded-lg'> No top artist data available for the time frame selected.</div>)}    
        </>
      )}
      
      {/* Show message if no artists at all */}
      {(!data.topArtists || data.topArtists.length === 0) && ( <div className='p-4 text-center text-neutral-500 bg-neutral-100 rounded-lg'> No top artists data available. Check your Spotify data ingestion. </div> )}

      {/* Top Track Section */}
      <TopTracks spotifyStats={spotifyStats} selectedTrackId={selectedTrackId} onTrackSelect={setSelectedTrackId} />
      {data.topTracks?.length > 0 && (
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4 mb-4'>
          {/* Left Column: Track Stats */}
          <div className='md:col-span-1 flex flex-col gap-4'>
            <h3 className='text-lg font-semibold'>{data.topTracks.find((t: any) => t.trackId === selectedTrackId)?.title} Listening History</h3>

            <Card className='flex flex-col space-y-1 rounded-xl px-4 py-3 border border-neutral-400 bg-neutral-100 dark:border-neutral-900'>
              <span className='text-xs font-medium text-neutral-500 dark:text-neutral-400 tracking-wide uppercase'>Total Plays</span>
              <span className='text-lg font-semibold text-neutral-800 dark:text-neutral-100'>{totalTrackPlays}</span>
            </Card>

            <Card className='flex flex-col space-y-1 rounded-xl px-4 py-3 border border-neutral-400 bg-neutral-100 dark:border-neutral-900'>
              <span className='text-xs font-medium text-neutral-500 dark:text-neutral-400 tracking-wide uppercase'>Active Days</span>
              <span className='text-lg font-semibold text-neutral-800 dark:text-neutral-100'>{activeDays}</span>
            </Card>
          </div>

          {/* Right Column: Heatmap */}
          <div className='md:col-span-4 flex flex-col gap-2'><Heatmap hourlyMap={trackHourlyMap} sortedWeekdays={weekdayOrder.filter(day => trackHourlyMap.has(day))} weekdayMap={trackWeekdayMap} monthlyMap={trackMonthlyMap} maxPlays={maxPlays} /></div>
        </div>
      )}

      {/* Show message if no tracks at all */}
      {(!data.topTracks || data.topTracks.length === 0) && ( <div className='p-4 text-center text-neutral-500 bg-neutral-100 rounded-lg'> No top track data available for time frame selected. </div> )}
    </section>
  );
};

export default SpotifyStats;