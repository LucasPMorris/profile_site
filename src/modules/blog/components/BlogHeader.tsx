import { motion, easeInOut } from 'framer-motion';
import { useEffect, useState } from 'react';
import { FaRegEye as ViewIcon } from 'react-icons/fa';
import { HiOutlineClock as ClockIcon } from 'react-icons/hi';

import { formatDate } from '@/common/helpers';
import { TbCalendarBolt } from 'react-icons/tb';

interface BlogHeaderProps { title: string; comments_count?: number; reading_time_minutes?: number; page_views_count?: number | null; published_at?: string;
                            featuredImageUrl?: string; tags_list?: { term_id: number; name: string; }[]; }

const BlogHeader = ({ title, page_views_count, published_at, reading_time_minutes, featuredImageUrl, tags_list }: BlogHeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 250);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const transition = { duration: 0.3, ease: easeInOut };
  const titleVariants = { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="mb-6">
      {/* Image + Overlays */}
      <div className="relative w-full aspect-[1200/628] overflow-hidden rounded-xl">
        {featuredImageUrl && (<img src={featuredImageUrl} alt="Header" className="absolute inset-0 h-full w-full object-cover"/>)}

        {/* Top-right stats */}
        <div className="absolute top-4 right-4 z-10 flex gap-4 text-sm text-white dark:text-neutral-200">
          <div className="flex rounded-full bg-black/0 px-3 py-1 text-xs text-white dark:bg-neutral-700">
            <div className='mr-3 text-[14px]'>
              <TbCalendarBolt size={18} className="inline-block mr-1 text-neutral-700 dark:text-neutral-200" />
              <span className="px-1">{published_at ? formatDate(published_at) : ''}</span>
            </div>  
            <div className="flex mr-4 text-[14px] items-center gap-1">
              <ViewIcon size={18} />
              <span>{page_views_count?.toLocaleString() || '-'}</span>
            </div>
            <div className="flex text-[14px] items-center gap-1">
              <ClockIcon size={18} />
              <span>{reading_time_minutes} min</span>
            </div>
          </div>
        </div>

        {/* Bottom-right tags */}
        {(tags_list ?? []).length > 0 && (
          <div className="absolute bottom-4 right-4 z-10 flex flex-wrap gap-2">
            {(tags_list ?? []).map((tag) => (
              <span key={tag.term_id} className="rounded-full bg-black/60 px-3 py-1 text-xs text-white dark:bg-neutral-700">
                #{tag.name.charAt(0).toUpperCase() + tag.name.slice(1)}
              </span>
            ))}
          </div>
        )}

        {/* Title Overlay */}
        <div className="absolute inset-0 z-10 flex items-center px-4 py-6">
          {!isScrolled 
            ? (
              <motion.h1 className="text-3xl font-semibold text-white dark:text-neutral-200" initial="initial" animate="animate"
                         variants={titleVariants} transition={transition} >
                {title}
              </motion.h1>)
            : (
              <motion.div className="shadow-bottom top-0 z-10 w-full border-b border-neutral-300 bg-light py-6 backdrop-blur dark:border-neutral-600 dark:bg-dark lg:sticky"
                          initial="initial" animate="animate" variants={titleVariants} transition={transition}>
                <h1 className="text-lg font-semibold lg:text-xl">{title}</h1>
              </motion.div> )
          }
        </div>
      </div>
    </div>
  );
};


export default BlogHeader;
