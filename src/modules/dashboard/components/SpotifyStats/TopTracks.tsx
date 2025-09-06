import Image from 'next/image';
import clsx from 'clsx';
const fallback = '/spotify-icon.svg';

const TopTracks = ({ spotifyStats }: { spotifyStats: any }) => {
  return (
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
 )
};

export default TopTracks;