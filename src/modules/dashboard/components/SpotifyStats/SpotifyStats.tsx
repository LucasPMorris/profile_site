// import Link from 'next/link';
// import { useEffect, useState } from 'react';
import Image from 'next/image';
import { SiWakatime as WakatimeIcon } from 'react-icons/si';
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

const getStatKey = (item: SpotifyStatItem): string => { if ('name' in item) return item.name; if ('title' in item) return item.title; return Math.random().toString(); };

// const SpotifyOverviewItem = ({ label, value }: { label: string; value: string | number }) => (
//   <Card className='flex flex-col space-y-1 rounded-xl px-4 py-3 border border-neutral-400 bg-neutral-100 dark:border-neutral-900 sm:col-span-1'>
//     <span className='text-sm dark:text-neutral-400'>{label}</span>
//     <span>{value || '-'}</span>
//   </Card>
// );


const SpotifyStats = () => {
  const { data } = useSWR('/api/spotify', fetcher);

  const totalPlays = data?.recentlyPlayed?.length ?? 0; 
  data?.recentlyPlayed?.forEach((track: { played_at: string }, index: number) => {
    console.log(`${index + 1}: ${JSON.stringify(track)}`);
  });

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
  
  const spotifyStats: SpotifyStatGroup[] = [
    {
      title: 'Listening Overview',
      styles: { bg: 'bg-green-300/30 dark:bg-green-800/30' },
      data: [
        { name: 'Avg Songs/Day', value: avgPerDay },
        { name: 'Explicit Content', value: `${percentExplicit}%` },
        { name: 'Total Plays', value: totalPlays },
        { name: 'Date Range', value: dateRange }

      ],
    },
    {
      title: 'Top Artists', styles: { bg: 'bg-purple-300/30 dark:bg-purple-800/30' },
      data: data?.topArtists?.slice(0, 5).map((artist: ArtistProps): ArtistProps => ({
        name: artist.name, artist_url: artist.artist_url,
        image: artist.image, })) ?? [],
    },
    {
      title: 'Top Tracks', styles: { bg: 'bg-yellow-300/30 dark:bg-yellow-800/30' },
      data: data?.topTracks?.slice(0, 5).map((track: TrackProps): TrackProps => ({
        album: track.album,
        artist: track.artist,
        songUrl: track.songUrl,
        title: track.title,
        release_date: track.release_date,
        explicit: track.explicit,
      })) ?? [],
    },
  ];

  if (!data) {
    return (
      <section className='flex flex-col gap-y-2'>
        <SectionHeading title='Spotify' icon={<WakatimeIcon className='mr-1' />} />
        <SectionSubHeading>Loading your audio stats...</SectionSubHeading>
        {/* Skeleton cards or shimmer effect here */}
      </section>
    );
  }

  return (
    <section className='flex flex-col gap-y-4'>
      <SectionHeading title='Spotify' icon={<WakatimeIcon className='mr-1' />} />
      <SectionSubHeading>My audio listening habits!</SectionSubHeading>

      {/* Overview Grid */}
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 mb-6'>
        {spotifyStats[0].data.map((subItem) =>
          'value' in subItem ? (
            <Card
              key={subItem.name}
              className='flex flex-col space-y-1 rounded-xl px-4 py-3 border border-neutral-400 bg-neutral-100 dark:border-neutral-900 sm:col-span-1'
            >
              <span className='text-sm dark:text-neutral-400'>{subItem.name}</span>
              <span>{subItem.value || '-'}</span>
            </Card>
          ) : null
        )}
      </div>

      {/* Top Tracks */}
      <div className='mb-6 rounded-xl border border-neutral-400 bg-neutral-100 p-4 dark:border-neutral-900'>
        <h3 className='mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300'>Top Tracks</h3>
        <ul className='flex flex-col gap-3'>
          {spotifyStats[2].data.map((track) =>
            'title' in track ? (
              <li key={track.title} className='flex items-center gap-4'>
                <Image
                  src={track.album.image?.url ?? fallback}
                  alt={track.title} width={48} height={48}
                  className='rounded-md'
                />
                <div className='flex flex-col'>
                  <a href={track.songUrl} target='_blank' rel='noopener noreferrer' className='hover:underline'>
                    <span className='text-sm font-medium'>{track.title}</span>
                  </a>
                  <span className='text-xs text-neutral-500'>{track.artist}</span>
                  {track.explicit && <span className='text-xs text-red-500'>🔞 Explicit</span>}
                </div>
              </li>
            ) : null
          )}
        </ul>
      </div>

      {/* Top Artists */}
      <div className='mb-6 rounded-xl border border-neutral-400 bg-neutral-100 p-4 dark:border-neutral-900'>
        <h3 className='mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300'>Top Artists</h3>
        <ul className='flex flex-col gap-3'>
          {spotifyStats[1].data.map((artist) =>
            'artist_url' in artist ? (
              <li key={artist.name} className='flex items-center gap-4'>
                <Image
                  src={artist.image?.url ?? fallback}
                  alt={artist.name}
                  width={48}
                  height={48}
                  className='rounded-full'
                />
                <a href={artist.artist_url} target='_blank' rel='noopener noreferrer' className='text-sm hover:underline'>
                  {artist.name}
                </a>
              </li>
            ) : null
          )}
        </ul>
      </div>
    </section>
  );
};

export default SpotifyStats;



// const TopTracksCard = ({ tracks }: { tracks: TrackProps[] }) => (
//   <div className='rounded-md bg-yellow-300/30 dark:bg-yellow-800/30 p-3'>
//     <p className='mb-2 text-sm font-semibold'>Top Tracks</p>
//     <ul className='flex flex-col gap-3'>
//       {tracks.map((track) => (
//         <li key={track.title} className='flex items-center gap-3'>
//           <Image src={track.album.image?.url ?? '/default-fallback.png'} alt={track.title} width={48} height={48} className='rounded-md' priority />
//           <div className='flex flex-col'>
//             <a href={track.songUrl} target='_blank' rel='noopener noreferrer' className='hover:underline'>
//               <span className='text-sm font-medium'>{track.title}</span>
//             </a>
//             <span className='text-xs text-neutral-600 dark:text-neutral-400'>{track.artist}</span>
//           </div>
//           {track.explicit && <span className='ml-auto text-xs text-red-500'>🔞</span>}
//         </li>
//       ))}
//     </ul>
//   </div>
// );

// const TopArtistsCard = ({ artists }: { artists: ArtistProps[] }) => (

//   <div className='rounded-md bg-purple-300/30 dark:bg-purple-800/30 p-3'>
//     <p className='mb-2 text-sm font-semibold'>Top Artists</p>
//     <div className='flex gap-4 overflow-x-auto'>
//       {artists.map((artist) => (
//         <a key={artist.name} href={artist.artist_url} target='_blank' rel='noopener noreferrer' className='flex flex-col items-center gap-1 hover:underline'>
//           <Image src={artist.image?.url ?? fallback} alt={artist.name} width={48} height={48} className='rounded-full' />
//           <span className='text-xs'>{artist.name}</span>
//         </a>
//       ))}
//     </div>
//   </div>
// );