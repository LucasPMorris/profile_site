import clsx from 'clsx';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { BsArrowRight as MoreIcon } from 'react-icons/bs';
import { FaRegEye as ViewIcon } from 'react-icons/fa';
import { HiOutlineClock as ClockIcon } from 'react-icons/hi';
import { TbCalendarBolt as DateIcon } from 'react-icons/tb';

import Breakline from '@/common/components/elements/Breakline';
import Card from '@/common/components/elements/Card';
import Image from '@/common/components/elements/Image';
import Tooltip from '@/common/components/elements/Tooltip';
import { calculateReadingTime, formatDate, formatExcerpt } from '@/common/helpers';
import { BlogItemProps } from '@/common/types/blog';

interface BlogCardProps extends BlogItemProps { isExcerpt?: boolean; }

const BlogCardNew = ({ id, title, featured_image_url, date, slug, content, excerpt, total_views_count, tags_list, isExcerpt = true }: BlogCardProps) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const readingTimeMinutes = calculateReadingTime(content?.rendered) ?? 0;
  const tagList = tags_list || [];
  const defaultImage = '/images/placeholder.png';
  const slideDownVariants = { hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0 } };

  console.log('BlogCardNew: ', featured_image_url);

  return (
    <Link href={`/blog/${slug}?id=${id}`}>
      <Card className='group relative flex w-full flex-col rounded-lg border shadow-sm dark:border-neutral-800 overflow-hidden'>
        {/* Image Section */}
        <div className='relative w-full h-[200px]'>
          <Image src={featured_image_url || defaultImage} alt={title?.rendered} fill sizes='100vw' className='object-cover object-center transition-transform duration-300 group-hover:scale-105' />
          {/* Tags */}
          <div className='absolute top-2 left-2 flex flex-wrap gap-2 p-2 z-10'>
            {tagList?.map((tag) => (
              <div key={tag?.term_id} className='rounded-full bg-neutral-900/70 px-2.5 py-1 font-mono text-xs text-neutral-300'>
                <span className='mr-1 font-semibold'>#</span>
                {tag?.name.charAt(0).toUpperCase() + tag?.name.slice(1)}
              </div>
            ))}
          </div>
          <div className='absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-neutral-900/70 px-2.5 py-1 text-neutral-300'>
            <DateIcon size={14} />
            <span className='ml-0.5 text-xs'>{formatDate(date)}</span>
          </div>          
        </div>

        {/* Content Section */}
        <div className='flex flex-col justify-between p-5 space-y-4'>
          {/* Title + Meta */}
          <div className='flex flex-col space-y-3'>
            <h3 className='text-lg font-medium dark:text-neutral-100 group-hover:underline group-hover:underline-offset-4'>{title?.rendered}</h3>
            {isExcerpt && (
              <p className='text-sm leading-relaxed text-neutral-700 dark:text-neutral-400'>
                {formatExcerpt(excerpt?.rendered)}
              </p>
            )}
          </div>

          <Breakline className='!border-neutral-700' />

          {/* Footer */}
          <div className='flex justify-between gap-4 px-0.5 text-neutral-400'>
            <Tooltip title='by LucasPMorris'> <Image src='/images/luke_avatar.png' alt='Lucas Morris' width={25} height={25} rounded='rounded-full' className='rotate-3 border border-neutral-500' /></Tooltip>

            <motion.div variants={slideDownVariants} initial='visible' animate={isHovered ? 'hidden' : 'visible'} className={clsx('flex justify-between gap-4', isHovered && 'hidden')}>
              <div className='flex items-center gap-1'>
                <ViewIcon size={14} className='text-neutral-700 dark:text-neutral-400' />
                <span className='ml-0.5 text-xs font-medium text-neutral-700 dark:text-neutral-400'>{total_views_count.toLocaleString()} VIEWS</span>
              </div>
              <div className='flex items-center gap-1'>
                <ClockIcon size={14} className='text-neutral-700 dark:text-neutral-400'/>
                <span className='ml-0.5 text-xs font-medium text-neutral-700 dark:text-neutral-400'>{readingTimeMinutes.toLocaleString()} MINS READ</span>
              </div>
            </motion.div>

            <motion.div variants={slideDownVariants} initial='hidden' animate={isHovered ? 'visible' : 'hidden'} className={clsx('flex items-center gap-1', !isHovered && 'hidden')}>
              <span className='mr-0.5 text-xs font-medium text-neutral-700 dark:text-neutral-400'>READ MORE</span>
              <MoreIcon size={16} />
            </motion.div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default BlogCardNew;
