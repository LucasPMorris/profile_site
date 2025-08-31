import useSWR from 'swr';

import Breakline from '@/common/components/elements/Breakline';
import MDXComponent from '@/common/components/elements/MDXComponent';
import { calculateReadingTime, formatDate } from '@/common/helpers';
import { BlogDetailProps } from '@/common/types/blog';
import { fetcher } from '@/services/fetcher';

import BlogHeader from './BlogHeader';

const BlogDetail = ({ id, title, date, slug, content, tags_list, featured_image_url, date_gmt }: BlogDetailProps) => {
  const { data: viewsData } = useSWR( `/api/views?slug=${slug}&id=${id}`, fetcher );

  const viewsCount = viewsData?.views || 0;
  const tagList = tags_list || [];

  const readingTimeMinutes = calculateReadingTime(content?.rendered) ?? 0;

  return (
    <>
      <BlogHeader title={title?.rendered} comments_count={0} reading_time_minutes={readingTimeMinutes} published_at={date} page_views_count={viewsCount} featuredImageUrl={featured_image_url} tags_list={tags_list} />
      <div className='space-y-6 leading-[1.8] dark:text-neutral-300 '>{content?.rendered && <MDXComponent>{content?.markdown}</MDXComponent>}</div>
      <Breakline className='!my-10' />
    </>
  );
};

export default BlogDetail;
