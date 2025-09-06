// import Link from 'next/link';
// import { useEffect, useState } from 'react';
import Image from 'next/image';
import { SiWakatime as WakatimeIcon, SiSpotify as SpotifyIcon } from 'react-icons/si';
import useSWR, { mutate } from 'swr';
import Card from '@/common/components/elements/Card';

import SectionHeading from '@/common/components/elements/SectionHeading';
import SectionSubHeading from '@/common/components/elements/SectionSubHeading';
import { fetcher } from '@/services/fetcher';
// import SpotifyOverview from './SpotifyOverview';
import { ArtistProps, TrackProps } from '@/common/types/spotify';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

const fallback = '/spotify-icon.svg';

interface SpotifyStatItem { name?: string; value?: string; title?: string; artists?: string; songUrl?: string;   explicit?: boolean; common_album?: { image?: string }; image?: string; artist_url?: string; }

interface SpotifyStatGroup { title: string; styles: { bg: string }; data: SpotifyStatItem[]; }
interface HeatMapProps { date: string; weekday: string;  hourly_plays: number[];}

interface DateRangeSelectorProps { startDate: string; endDate: string; setStartDate: React.Dispatch<React.SetStateAction<string>>; setEndDate: React.Dispatch<React.SetStateAction<string>>;}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ startDate, endDate, setStartDate, setEndDate }) => {
  const [startInput, setStartInput] = useState(startDate);
  const [endInput, setEndInput] = useState(endDate);
 
  const handleApply = () => { setStartDate(startInput); setEndDate(endInput); };

  return ( // flex-1 px-4 py-2 text-center font-medium border-x border-t border-neutral-800 dark:border-neutral-400'} bg-[rgba(106,106,128)] text-neutral-100 dark:bg-[rgba(106,106,128)] dark:text-neutral-900 md:rounded-tl
    <div className='absolute top-4 right-4 flex gap-2 items-center'>
      <input type='date' value={startInput} onChange={e => setStartInput(e.target.value)} className='rounded border px-2 py-1 text-sm border-neutral-400 bg-neutral-100 dark:border-neutral-900' />
      <input type='date' value={endInput} onChange={e => setEndInput(e.target.value)} className='rounded border px-2 py-1 text-sm border-neutral-400 bg-neutral-100 dark:border-neutral-900' />
      <button type='button' onClick={handleApply} className='rounded bg-green-500 text-white px-3 py-1 text-sm hover:bg-green-600'>Apply</button>
    </div>
  );
};

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
  const maxHourlyCount = Math.max(...Array.from(weekdayMap.values()).flat());
  
  data.playFrequency.forEach(({ weekday, date, hourly_plays }: HeatMapProps) => {
    if (!weekdayDateMap.has(weekday)) { weekdayDateMap.set(weekday, []); }
    const bucket = weekdayMap.get(weekday)!;
    hourly_plays.forEach((count, hour) => { bucket[hour] += count; });
    weekdayDateMap.get(weekday)!.push(date);
  });

  const weekdayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const sortedWeekdays = weekdayOrder.filter(day => weekdayMap.has(day));
  const maxPlays = Math.max(...(data.playFrequency as { hourly_plays: number[] }[]).flatMap(({ hourly_plays }) => hourly_plays));

  const getIntensityClass = (count: number) => {
  const ratio = count / maxHourlyCount;
  if (ratio === 0) return 'bg-neutral-200';
  if (ratio < 0.2) return 'bg-rose-200';
  if (ratio < 0.4) return 'bg-rose-400';
  if (ratio < 0.6) return 'bg-rose-500';
  if (ratio < 0.8) return 'bg-rose-700';
  return 'bg-rose-900';
};

  const spotifyStats: SpotifyStatGroup[] = [
    {
      title: 'Listening Overview',
      styles: { bg: 'bg-green-300/30 dark:bg-green-800/30' },
      data: [
        { name: 'Total Tracks', value: data.meta.totalTrackCount.toString() },
        { name: 'Total Artists', value: data.meta.totalArtistCount.toString() },
        { name: 'Explicit Content', value: `${percentExplicit}%` },
      ],
    },
    {
      title: 'Top Artists', styles: { bg: 'bg-purple-300/30 dark:bg-purple-800/30' },
      data: data?.topArtists.map((artist: ArtistProps): ArtistProps => ({ artistId: artist.artistId, name: artist.name, artist_url: artist.artist_url, image: artist.image, })) ?? [],
    },
    {
      title: 'Top Tracks', styles: { bg: 'bg-yellow-300/30 dark:bg-yellow-800/30' },
      data: data.topTracks.map((track: TrackProps): SpotifyStatItem => ({
        title: track.title,
        artists: track.artists,
        songUrl: track.songUrl,
        explicit: track.explicit,
        common_album: track.common_album ? { image: track.common_album.image } : undefined,
        image: track.common_album?.image,
      })) ?? [],
    },
  ];

  const formatDates = (dates: string[]) => dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })).join(', ');

  return (
    <section className='flex flex-col gap-y-4 relative'>
      <SectionHeading title='Spotify' icon={<SpotifyIcon className='mr-1' />} />
      <DateRangeSelector startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} />
      <SectionSubHeading>
        <div className='text-neutral-800 dark:text-neutral-400 md:flex-row md:items-center'>My audio listening habits!</div>
      </SectionSubHeading>

      {/* Overview Grid */}
      <div className='grid grid-cols-5 gap-4 sm:grid-cols-5 md:grid-cols-5 mb-3'>
        {spotifyStats?.[0]?.data?.map((subItem) =>
          'value' in subItem ? (
            <Card key={subItem.name} className='flex flex-col col-span-1 h-full space-y-1 rounded-xl px-4 py-3 border border-neutral-400 bg-neutral-100 dark:border-neutral-900 sm:col-span-1'>
              <span className='text-sm dark:text-neutral-400'>{subItem.name}</span>
              <span>{subItem.value || '-'}</span>
            </Card>
          ) : null
        )}

        {/* Heatmap Column */}
        <Card className='col-span-4 h-full rounded-xl border border-neutral-400 bg-neutral-100 p-4 dark:border-neutral-900 mb-5'>
          <span className='text-sm dark:text-neutral-400 mb-2'>Listening Times</span>
          <div className='grid grid-cols-[60px_repeat(24,1fr)] gap-[2px]'>
            {/* Header row: empty cell + hour labels */}
            <div></div>
            {[...Array(24)].map((_, hour) => (
              <div key={`hour-${hour}`} className='text-[10px] text-neutral-500 text-center'>
                {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
              </div>
            ))}

            {/* Weekday rows */}
            {sortedWeekdays.map(weekday => {
              const hourly_plays = weekdayMap.get(weekday)!;
              return (
                <>
                  <div key={`label-${weekday}`} className='text-[10px] text-neutral-500 text-right pr-1'>
                    {weekday}
                  </div>
                  {hourly_plays.map((count, hour) => (
                    <div
                      key={`${weekday}-${hour}`}
                      className={clsx('h-5 w-5 rounded-sm', getIntensityClass(count))}
                      title={`${weekday} ${hour}:00 – ${count} plays`}
                    />
                  ))}
                </>
              );
            })}
          </div>
        </Card>
      </div>



      {/* Top Tracks */}
      <div className='bg-gradient-to-r from-amber-400 to-rose-600 relative flex flex-1 flex-col gap-2 rounded-lg p-[3px] mb-6'>
        <div className='h-full w-full rounded-lg bg-neutral-50 p-2 pb-3 dark:bg-dark'>
          <p className='relative -top-5 inline-block px-2 rounded bg-neutral-50 dark:bg-dark'>Top Tracks</p>
          <div className='overflow-hidden relative h-[110px] group mb-2'>
            <ul className='flex w-max animate-looping-tag gap-3 group-hover:paused p-2'>
              {[...spotifyStats[2].data, ...spotifyStats[2].data].map((track, index) => 'title' in track 
                ? ( <li key={`${track.title}-${index}`} className={clsx(spotifyStats[2].styles.bg, 'relative flex min-w-[240px] flex-shrink-0 items-top gap-4 px-2 pt-2 py-3 rounded-xl')}>
                    <span className='absolute -top-2 -left-2 z-5000 flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-bold text-white'>
                      #{(index % spotifyStats[2].data.length) + 1}
                    </span>
                    <Image src={track.common_album?.image ?? fallback} alt={track.title ?? 'Unknown Track'} width={82} height={82} className='rounded-md' />
                    <div className='flex flex-col'>
                      <a href={track.songUrl} target='_blank' rel='noopener noreferrer' className='hover:underline'>
                        <span className='font-medium'>{track.title}</span>
                      </a>
                      <span className='text-neutral-600 dark:text-neutral-400'>{track.artists}</span>
                      {track.explicit && <span className='text-red-500'>🔞 Explicit</span>}
                    </div>
                  </li>
                ) : null
              )}
            </ul>
          </div>
        </div>
      </div>
      {/* </Card>   */}

      {/* Top Artists */}
      <div className='bg-gradient-to-r from-blue-400 to-purple-600 relative flex flex-1 flex-col gap-2 rounded-lg p-[3px]'>
        <div className='h-full w-full rounded-lg bg-neutral-50 p-2 pb-3 dark:bg-dark'>  
          <p className='relative -top-5 inline-block px-2 rounded bg-neutral-50 dark:bg-dark'>Top Artists</p>
          <div className='overflow-hidden relative h-[135px] group'>
            <ul className='flex w-max animate-looping-tag gap-3 group-hover:paused p-[8px]'>
              {[...spotifyStats[1].data, ...spotifyStats[1].data, ...spotifyStats[1].data].map((artist, index) =>
                'artist_url' in artist ? (
                  <li key={`${artist.name}-${index}`} className={clsx(spotifyStats[1].styles.bg, 'relative min-w-[140px] flex flex-col items-center justify-center flex-shrink-0 gap-4 px-2 py-2 rounded-xl')}>
                    <span className='absolute -top-2 -left-2 z-40 overflow-visible flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-bold text-white'>
                      #{(index % spotifyStats[1].data.length) + 1}
                    </span>
                    <div className='flex flex-col items-center'>
                      <div className='relative w-20 h-20'>
                        <Image src={artist.image ?? fallback} alt={artist.name ?? 'Unknown Artist'} width={82} height={82} className='rounded-full object-cover' />
                      </div>
                      <a href={artist.artist_url} target='_blank' rel='noopener noreferrer' className='relative hover:underline text-center font-medium'>
                        <p className='inline-block px-2 rounded bg-neutral-50 dark:bg-dark'>{artist.name}</p>
                      </a>
                    </div>
                  </li>
                ) : null
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpotifyStats;