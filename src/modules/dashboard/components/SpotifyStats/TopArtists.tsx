import Image from 'next/image';
import clsx from 'clsx';
const fallback = '/spotify-icon.svg';

const TopArtists = ({ spotifyStats }: { spotifyStats: any }) => {
  return (
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
 )
};

export default TopArtists;