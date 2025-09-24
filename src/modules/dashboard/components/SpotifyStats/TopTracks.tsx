import Image from 'next/image';
import clsx from 'clsx';
import useIsMobile from '@/common/hooks/useIsMobile';
import { useEffect, useState } from 'react';
import { FaPlayCircle } from 'react-icons/fa';
const fallback = '/spotify-icon.svg';

interface TopTracksProps { spotifyStats: any[]; selectedTrackId: string | null; onTrackSelect: (trackId: string) => void; }

const TopTracks = ({ spotifyStats, selectedTrackId, onTrackSelect }: TopTracksProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const isMobile = useIsMobile();
  const [showArrows, setShowArrows] = useState(true);
  
  useEffect(() => {
    if (!isMobile) return;
    const handleScroll = () => {
      // Fade out arrows after scrolling 80px (adjust as needed)
      setShowArrows(window.scrollY < 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);  
  
  const tracks = spotifyStats[2].data;
  
  const fallback = '/spotify-icon.svg';
  const handlePrevTrack = () => { setSelectedIndex((prev) => (prev - 1 + tracks.length) % tracks.length); };
  const handleNextTrack = () => { setSelectedIndex((prev) => (prev + 1) % tracks.length); };

  useEffect(() => {
    if(tracks && tracks.length > 0) onTrackSelect(tracks[selectedIndex].trackId);
  }, [selectedIndex]);

  return (
  <div className='bg-gradient-to-r from-amber-400 to-rose-600 relative flex flex-1 flex-col gap-2 rounded-lg p-[3px] mb-6'>
    <div className='h-full w-full rounded-lg bg-neutral-50 p-2 pb-3 dark:bg-dark'>
      <p className='relative -top-5 inline-block px-2 rounded bg-neutral-50 dark:bg-dark'>Top Tracks</p>
      <div className='relative'>
        <div className='overflow-hidden h-[145px] group'>
          <ul className='flex w-max animate-looping-tag gap-3 group-hover:paused p-[8px]'>
            {[...spotifyStats[2].data, ...spotifyStats[2].data, ...spotifyStats[2].data].map((track: any, index: number) => {
              if (!track || !track.trackId || !track.title) return null;

              const isSelected = selectedTrackId === track.trackId;
              const originalIndex = index % spotifyStats[2].data.length;

              return (
                <li key={`${track.title}-${index}`}
                  className={clsx( 'relative min-w-[140px] flex flex-col items-center justify-center flex-shrink-0 gap-4 px-2 py-2 rounded-xl cursor-pointer transition-all duration-200',
                    isSelected ? 'bg-blue-200 dark:bg-blue-800/50 ring-2 ring-blue-400' : spotifyStats[2].styles.bg )}
                  onClick={() => onTrackSelect(track.trackId)}
                  >
                  <span className={clsx('absolute -top-2 -left-2 z-40 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white', isSelected ? 'bg-blue-600' : 'bg-black' )}>
                    #{originalIndex + 1}
                  </span>

                  {isSelected && ( <div className='absolute top-1 right-1 z-50'><div className='w-3 h-3 bg-green-500 rounded-full border border-white'></div> </div>)}

                  <div className='flex flex-col items-center'>
                    <div className='relative w-20 h-20'><Image src={track.image ?? fallback} alt={track.title} fill className='rounded-full object-cover' /></div>
                    <span className='text-sm font-medium text-center'>{track.title}</span>
                    {/* Spotify link with play icon, absolutely positioned */}
                    {track.trackId && (
                      <a
                      href={`https://open.spotify.com/track/${track.trackId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2 flex items-center gap-1 text-green-600 hover:text-green-700 font-semibold"
                      style={{ zIndex: 50 }}
                      title="Listen on Spotify"
                      >
                      <FaPlayCircle size={32} />
                      <span className="sr-only">Listen on Spotify</span>
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className={clsx('absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-1 flex gap-3', { 'pointer-events-none': isMobile, 'opacity-0': !showArrows, 'opacity-100': showArrows })} style={{ transition: 'opacity 0.3s ease' }}>
          <button onClick={handlePrevTrack} className='relative w-24 h-10 flex items-center justify-center text-3xl bg-gradient-to-tr from-amber-400 to-rose-600 text-neutral-300 rounded-lg shadow overflow-hidden group hover:bg-blue-900 transition pointer-events-auto hover:opacity-85 hover:scale-105 active:scale-95'> ← </button>
          <button onClick={handleNextTrack} className='relative w-24 h-10 flex items-center justify-center text-3xl bg-gradient-to-tr from-amber-400 to-rose-600 text-neutral-300 rounded-lg shadow overflow-hidden group hover:bg-blue-900 transition pointer-events-auto hover:opacity-85 hover:scale-105 active:scale-95' > → </button>
        </div>
      </div>
    </div>
  </div>
  );
};

export default TopTracks;