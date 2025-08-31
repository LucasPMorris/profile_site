// import Link from 'next/link';
// import { useEffect, useState } from 'react';
import Image from 'next/image';
import { SiWakatime as WakatimeIcon, SiSpotify as SpotifyIcon } from 'react-icons/si';
import useSWR from 'swr';
import Card from '@/common/components/elements/Card';

import SectionHeading from '@/common/components/elements/SectionHeading';
import SectionSubHeading from '@/common/components/elements/SectionSubHeading';
import { fetcher } from '@/services/fetcher';
// import SpotifyOverview from './SpotifyOverview';
import { ArtistProps, TrackProps } from '@/common/types/spotify';
import clsx from 'clsx';

const fallback = '/default-fallback.png';

type OverviewStat = { name: string; value: string | number };
type SpotifyStatItem = OverviewStat | ArtistProps | TrackProps;

interface SpotifyStatGroup { title: string; styles: { bg: string }; data: SpotifyStatItem[]; }

const SpotifyStats = () => {
  const { data } = useSWR('/api/spotify', fetcher);

  const totalPlays = data?.recentlyPlayed?.length ?? 0; 
  const uniqueDays = new Set(data?.recentlyPlayed?.map((track: { played_at: string }) => {
    const date = new Date(track.played_at); 
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0]; })
  );

  const days = uniqueDays.size || 1; // Avoid division by zero
  const sortedDates = [...uniqueDays].sort((a, b) => new Date(a as string).getTime() - new Date(b as string).getTime());
  const dateRange = sortedDates.length === 1 ? sortedDates[0] : `${sortedDates[0]} - ${sortedDates[sortedDates.length - 1]}`;
  const avgPerDay = (totalPlays / days).toFixed(1);
  const explicitCount = data?.recentlyPlayed?.filter((track: { explicit: boolean }) => track.explicit).length ?? 0;
  const percentExplicit = ((explicitCount / totalPlays) * 100).toFixed(1);
  
  const playsByHour: number[] = Array(24).fill(0);

  data?.recentlyPlayed?.forEach((track: { played_at: string }) => {
    const hour = new Date(track.played_at).getHours(); // 0–23
    playsByHour[hour]++;
  });

  const maxPlays = Math.max(...playsByHour);

  const getIntensityClass = (count: number) => {
  const ratio = count / maxPlays;
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
        // { name: 'Avg Songs/Day', value: avgPerDay },
        { name: 'Explicit Content', value: `${percentExplicit}%` },
      ],
    },
    {
      title: 'Top Artists', styles: { bg: 'bg-purple-300/30 dark:bg-purple-800/30' },
      data: data?.topArtists?.slice(0, 5).map((artist: ArtistProps): ArtistProps => ({ name: artist.name, artist_url: artist.artist_url, image: artist.image, })) ?? [],
    },
    {
      title: 'Top Tracks', styles: { bg: 'bg-yellow-300/30 dark:bg-yellow-800/30' },
      data: data?.topTracks?.slice(0, 5).map((track: TrackProps): TrackProps => ({
        album: track.album, artist: track.artist, songUrl: track.songUrl, title: track.title, release_date: track.release_date, explicit: track.explicit
      })) ?? [],
    },
  ];

  if (!data) {
    return (
      <section className='flex flex-col gap-y-2'>
        <SectionHeading title='Spotify' icon={<SpotifyIcon className='mr-1' />} />
        <SectionSubHeading><div className='text-neutral-800 dark:text-neutral-400 md:flex-row md:items-center'>Loading you audio stats...</div></SectionSubHeading>
        {/* Skeleton cards or shimmer effect here */}
      </section>
    );
  }

  return (
    <section className='flex flex-col gap-y-4'>
      <SectionHeading title='Spotify' icon={<SpotifyIcon className='mr-1' />} />
      <SectionSubHeading ><div className='text-neutral-800 dark:text-neutral-400 md:flex-row md:items-center'>My audio listening habits!</div></SectionSubHeading>

      {/* Overview Grid */}
      <div className='grid grid-cols-5 gap-4 sm:grid-cols-5 md:grid-cols-5 mb-3'>
        {spotifyStats[0].data.map((subItem) => 'value' in subItem
          ? (
            <Card key={subItem.name} className='flex flex-col col-span-1 h-full space-y-1 rounded-xl px-4 py-3 border border-neutral-400 bg-neutral-100 dark:border-neutral-900 sm:col-span-1'>
              <span className='text-sm dark:text-neutral-400'>{subItem.name}</span>
              <span>{subItem.value || '-'}</span>
            </Card>)
          : null )}

        {/* Heatmap Column */}
        <Card className='col-span-4 h-full rounded-xl border border-neutral-400 bg-neutral-100 p-4 dark:border-neutral-900 mb-5'>
        {/* <Card className='rounded-xl border border-neutral-400 bg-neutral-100 p-4 dark:border-neutral-900 mb-5' > */}
          <span className='text-sm dark:text-neutral-400'>Listining Times</span>
          <div className='flex flex-row gap-[4px]'>
            {playsByHour.map((count, hour) => (            
              <div className='flex flex-col items-center' key={hour}>
                { hour % 3 === 0 ? 
                  ( <span key={hour} className='text-[10px] text-neutral-500 text-center overflow-visible'>
                      {hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`}
                    </span>)
                  : ( <div className='text-[10px] text-neutral-500 text-center'>&nbsp;</div> )
                }              
                <div className={clsx('h-5 w-5 rounded-sm', getIntensityClass(count))} title={`${hour}:00 – ${count} plays`} />
              </div> )
            )}
          </div>
        </Card>  
      </div>



      {/* Top Tracks */}
      <div className='bg-gradient-to-r from-amber-400 to-rose-600 relative flex flex-1 flex-col gap-2 rounded-lg p-[3px] mb-6'>
        <div className='h-full w-full rounded-lg bg-neutral-50 p-2 pb-3 dark:bg-dark'>  
          <p className='relative -top-5 inline-block px-2 rounded bg-neutral-50 dark:bg-dark'>Top Tracks</p>
          <div className='overflow-hidden relative h-[110px] group mb-2'>
            <ul className='flex w-max animate-looping-tag gap-3 group-hover:paused p-2'>
                {[...spotifyStats[2].data, ...spotifyStats[2].data].map((track, index) => 'title' in track ? (
                  <li key={`${track.title}-${index}`} className={clsx(spotifyStats[2].styles.bg, 'relative flex min-w-[240px] flex-shrink-0 items-top gap-4 px-2 pt-2 py-3 rounded-xl')}>
                  <span className='absolute -top-2 -left-2 z-5000 flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-bold text-white'>
                    #{(index % spotifyStats[2].data.length) + 1}
                  </span>
                  <Image src={track.album.image?.url ?? fallback} alt={track.title} width={82} height={82} className='rounded-md' />
                  <div className='flex flex-col'>
                    <a href={track.songUrl} target='_blank' rel='noopener noreferrer' className='hover:underline'><span className='font-medium'>{track.title}</span></a>
                    <span className='text-neutral-600 dark:text-neutral-400'>{track.artist}</span>
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
            <p className='relative -top-5 inline-block px-2 rounded bg-neutral-50 dark:bg-dark'>Top Arists</p>
            <div className='overflow-hidden relative h-[135px] group'>
              <ul className='flex w-max animate-looping-tag gap-3 group-hover:paused p-[8px]'>
                {[...spotifyStats[1].data, ...spotifyStats[1].data, ...spotifyStats[1].data ].map((artist, index) => 'artist_url' in artist ? (
                    <li key={`${artist.name}-${index}`} className={clsx(spotifyStats[1].styles.bg, 'relative min-w-[140px] flex flex-col items-center justify-center flex-shrink-0 gap-4 px-2 py-2 rounded-xl')}>
                      <span className='absolute -top-2 -left-2 z-40 overflow-visible flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs font-bold text-white'>
                        #{(index % spotifyStats[2].data.length) + 1}
                      </span>
                      <div className='flex flex-col items-center'>
                        <div className='relative w-20 h-20'>
                          <Image src={artist.image?.url ?? fallback} alt={artist.name} width={82} height={82} className='rounded-full object-cover' />
                        </div>
                          <a href={artist.artist_url} target='_blank' rel='noopener noreferrer' className='relative hover:underline text-center font-medium'>
                            <p className='inine-block px-2 rounded bg-neutral-50 dark:bg-dark'>{artist.name}</p>
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