import { motion } from 'framer-motion';
import { useMemo, useRef } from 'react';
import { useDraggable } from 'react-use-draggable-scroll';
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

    // Interleave: blog, project, blog, project, ...
    const merged: CarouselItem[] = [];
    const maxLen = Math.max(blogs.length, projects.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < blogs.length) merged.push(blogs[i]);
      if (i < projects.length) merged.push(projects[i]);
    }
    return merged;
  }, [blogResponse, projectResponse]);

  const ref = useRef<HTMLDivElement>(undefined) as React.MutableRefObject<HTMLInputElement>;
  const { events } = useDraggable(ref);

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

  return (
    <div className='flex items-stretch gap-4 overflow-x-scroll p-1 scrollbar-hide' {...events} ref={ref}>{renderCards()}</div>
  );
};

export default ContentCarousel;
