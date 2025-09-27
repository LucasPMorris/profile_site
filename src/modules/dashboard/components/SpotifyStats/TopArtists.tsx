import React, { useEffect, useState } from 'react';
import { FaPlayCircle } from 'react-icons/fa';
import useIsMobile from '@/common/hooks/useIsMobile';
import Image from 'next/image';
import clsx from 'clsx';

interface TopArtistsProps { spotifyStats: any[]; selectedArtistId: string | null; onArtistSelect: (artistId: string) => void; }

const TopArtists = ({ spotifyStats, selectedArtistId, onArtistSelect }: TopArtistsProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const isMobile = useIsMobile();
  const [showArrows, setShowArrows] = useState(true);

  useEffect(() => {
    if (!isMobile) return;
    const handleScroll = () => {
      // Fade out arrows after scrolling 80px (adjust as needed)
      setShowArrows(window.scrollY < 1100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);
  const artists = spotifyStats[1].data;

  const handlePrev = () => { setSelectedIndex((prev) => (prev - 1 + artists.length) % artists.length); };
  const handleNext = () => { setSelectedIndex((prev) => (prev + 1) % artists.length); };

  useEffect(() => {
    if (artists && artists.length > 0) { onArtistSelect(artists[selectedIndex].artistId); }
  }, [selectedIndex]);

  const fallback = '/spotify-icon.svg';

  return (
    <div className='bg-gradient-to-r from-blue-400 to-purple-600 relative flex flex-1 flex-col gap-2 rounded-lg p-[3px] mb-6'>
      <div className='h-full w-full rounded-lg bg-neutral-50 p-2 pb-3 dark:bg-dark'>  
        <p className='relative -top-5 inline-block px-2 rounded bg-neutral-50 dark:bg-dark'>Top Artists</p>
        <div className='relative'>
          {/* Carousel */}
          <div className='overflow-hidden h-[135px] group'>
            <ul className='flex w-max animate-looping-tag gap-3 group-hover:paused p-[8px]'>
              {[...spotifyStats[1].data, ...spotifyStats[1].data, ...spotifyStats[1].data].map((artist: any, index: number) => {
                if (!('artist_url' in artist)) return null;

                const isSelected = selectedArtistId === artist.artistId;
                const originalIndex = index % spotifyStats[1].data.length;

                return (
                  <li key={`${artist.name}-${index}`}
                    className={clsx('relative min-w-[140px] flex flex-col items-center justify-center flex-shrink-0 gap-4 px-2 py-2 rounded-xl cursor-pointer transition-all duration-200',
                      isSelected ? 'bg-purple-200 dark:bg-purple-800/50 ring-2 ring-purple-400' : spotifyStats[1].styles.bg
                    )}
                    onClick={() => onArtistSelect(artist.artistId)}>
                    <span className={clsx( 'absolute -top-2 -left-2 z-40 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white', isSelected ? 'bg-purple-600' : 'bg-black' )}>
                      #{originalIndex + 1}
                    </span>

                    {isSelected && ( <div className="absolute top-1 right-1"><div className="w-3 h-3 bg-green-500 rounded-full border border-white"></div></div> )}
                    <div className='flex flex-col items-center'>
                      <div className='relative w-20 h-20'><Image src={artist.image ?? fallback} alt={artist.name} fill className='rounded-full object-cover' /></div>
                      <span className='text-sm font-medium text-center'>{artist.name}</span>
                      {/* Spotify link with green arrow icon, absolutely positioned */}
                      {artist.artist_url && (
                        <a href={artist.artist_url} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 flex items-center gap-1 text-green-600 hover:text-green-700 font-semibold" style={{ zIndex: 50 }} title="Listen on Spotify" >
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

          {/* Arrows */}
          <div className={'absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex gap-3 transition-opacity duration-500' + (isMobile ? ' pointer-events-none' : '')} style={{ opacity: showArrows ? 1 : 0 }}>
            <button onClick={handlePrev} 
              className='relative w-24 h-10 flex items-center justify-center text-3xl bg-gradient-to-tr from-blue-400 to-purple-600 text-neutral-300 rounded-lg shadow overflow-hidden group transition pointer-events-auto hover:opacity-85 hover:scale-105 active:scale-95'> ← </button>
            <button onClick={handleNext} className='relative w-24 h-10 flex items-center justify-center text-3xl bg-gradient-to-tr from-blue-400 to-purple-600 text-neutral-300 rounded-lg shadow overflow-hidden group transition pointer-events-auto hover:opacity-85 hover:scale-105 active:scale-95'> → </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TopArtists;