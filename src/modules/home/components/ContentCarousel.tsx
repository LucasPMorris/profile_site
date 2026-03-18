import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HiOutlineArrowSmLeft as ArrowLeft, HiOutlineArrowSmRight as ArrowRight } from 'react-icons/hi';
import useSWR from 'swr';

import BlogCardNewSkeleton from '@/common/components/skeleton/BlogCardNewSkeleton';
import { BlogItemProps } from '@/common/types/blog';
import { ProjectItemProps } from '@/common/types/projects';
import BlogCardNew from '@/modules/blog/components/BlogCardNew';
import ProjectCard from '@/modules/projects/components/ProjectCard';
import { fetcher } from '@/services/fetcher';

type CarouselItem =
  | { type: 'blog'; data: BlogItemProps }
  | { type: 'project'; data: ProjectItemProps };

const ContentCarousel = () => {
  const { data: blogResponse, isLoading: blogLoading } = useSWR(`/api/blog?page=1&per_page=4`, fetcher, { revalidateOnFocus: false, refreshInterval: 0 });
  const { data: projectResponse, isLoading: projectLoading } = useSWR(`/api/projects`, fetcher, { revalidateOnFocus: false, refreshInterval: 0 });

  const isLoading = blogLoading || projectLoading;

  const items: CarouselItem[] = useMemo(() => {
    const blogs: CarouselItem[] = (blogResponse?.posts || []).map((post: BlogItemProps) => ({ type: 'blog' as const, data: post }));
    const projects: CarouselItem[] = (projectResponse?.data || []).filter((p: ProjectItemProps) => p.is_show).slice(0, 4).map((project: ProjectItemProps) => ({ type: 'project' as const, data: project }));

    // Sort all items newest to oldest
    return [...blogs, ...projects].sort((a, b) => {
      const dateA = a.type === 'blog' ? new Date(a.data.date) : new Date(a.data.updated_at);
      const dateB = b.type === 'blog' ? new Date(b.data.date) : new Date(b.data.updated_at);
      return dateB.getTime() - dateA.getTime();
    });
  }, [blogResponse, projectResponse]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibilityMap, setVisibilityMap] = useState<Record<number, number>>({});

  const updateVisibility = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const newMap: Record<number, number> = {};

    Array.from(container.children).forEach((child, index) => {
      const childRect = child.getBoundingClientRect();
      const visibleLeft = Math.max(containerRect.left, childRect.left);
      const visibleRight = Math.min(containerRect.right, childRect.right);
      const visibleWidth = Math.max(0, visibleRight - visibleLeft);
      const ratio = childRect.width > 0 ? visibleWidth / childRect.width : 0;
      newMap[index] = ratio;
    });

    setVisibilityMap(newMap);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    updateVisibility();
    container.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);

    return () => {
      container.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, [updateVisibility, items]);

  const scrollTo = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) return;

    const cardWidth = container.children[0]?.getBoundingClientRect().width ?? 303;
    const scrollAmount = cardWidth + 16;
    container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  const scrollToIndex = (index: number) => {
    const container = scrollRef.current;
    if (!container || !container.children[index]) return;

    const child = container.children[index] as HTMLElement;
    container.scrollTo({ left: child.offsetLeft - container.offsetLeft, behavior: 'smooth' });
  };

  const renderCards = () => {
    if (isLoading) { return Array.from({ length: 3 }, (_, index) => (<BlogCardNewSkeleton key={index} />)); }

    return items.map((item, index) => (
      <motion.div key={`${item.type}-${index}`} initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }} transition={{ duration: 0.5 }} className='w-[303px] min-w-[303px] self-stretch'>
        {item.type === 'blog'
          ? ( <BlogCardNew {...item.data} /> )
          : ( <div className='h-full [&>a]:h-full [&>a>div]:h-full [&>a>div]:flex [&>a>div]:flex-col'><ProjectCard {...item.data} /></div> )}
      </motion.div>
    ));
  };

  const getDotColor = (index: number) => {
    const ratio = visibilityMap[index] ?? 0;
    if (ratio > 0.95) return 'bg-purple-500';
    if (ratio > 0.3) return 'bg-purple-500/40';
    return 'bg-neutral-500/40';
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-stretch gap-4 overflow-x-scroll p-1 scrollbar-hide' ref={scrollRef}>
        {renderCards()}
      </div>

      {!isLoading && items.length > 0 && (
        <div className='flex items-center justify-center gap-3'>
          <button onClick={() => scrollTo('left')} className='text-neutral-500 transition-colors hover:text-purple-500' aria-label='Scroll left'>
            <ArrowLeft size={22} />
          </button>
          <div className='flex items-center gap-2'>
            {items.map((_, index) => (
              <button key={index} onClick={() => scrollToIndex(index)} aria-label={`Go to card ${index + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${getDotColor(index)}`} />
            ))}
          </div>
          <button onClick={() => scrollTo('right')} className='text-neutral-500 transition-colors hover:text-purple-500' aria-label='Scroll right'>
            <ArrowRight size={22} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ContentCarousel;
