import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';

import NavigationSection from '@/common/components/elements/NavigationSection';
import { parseUrl } from '@/common/helpers';
import { SubContentMetaProps } from '@/common/types/snippets';
import { fetcher } from '@/services/fetcher';

import ContentBody from './ContentBody';
import ContentPlayground from './ContentPlayground';

interface ContentListItemProps { id: number; parent_slug: string; slug: string; title: string; }
interface ContentDetailProps { content: string; frontMatter: SubContentMetaProps; }

const ContentDetail = ({ content, frontMatter }: ContentDetailProps) => {
  const [contentList, setContentList] = useState<ContentListItemProps[]>([]);

  const [currentId, setCurrentId] = useState<number>(0);
  const [nextTitle, setNextTitle] = useState<string | null>(null);
  const [previousTitle, setPreviousTitle] = useState<string | null>(null);

  const router = useRouter();
  const currentUrl = router.asPath;
  const { parentSlug, contentSlug } = parseUrl(currentUrl);

  const meta = frontMatter;
  const isShowPlayground = meta?.is_playground ?? false;
  const initialCode = meta?.initial_code ?? '';

  const { data: resContentData } = useSWR(`/api/content?category=${parentSlug}`, fetcher );
  const { data: viewsData } = useSWR( `/api/views?slug=${contentSlug}&type=snippet`, fetcher );

  const getNextOrPreviousContent = useCallback(
    (contents: ContentListItemProps[], step: number) => {
      return contents.find((item) => item.id === currentId + step) || null;
    },
    [currentId],
  );

  const handleNavigation = (step: number) => {
    const targetContent = getNextOrPreviousContent(contentList, step);

    if (targetContent) {
      const { slug: targetSlug } = targetContent;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      router.push(`/snippets/${parentSlug}/${targetSlug}`);
    }
  };

  useEffect(() => {
    resContentData && setContentList(resContentData.data);
  }, [resContentData]);

  useEffect(() => {
    const getId = contentList?.find((item: ContentListItemProps) => item.slug === contentSlug );
    const currentContentId = getId?.id as number;
    setCurrentId(currentContentId);

    if (currentContentId > 0) { 
      const previousContent = getNextOrPreviousContent(contentList, -1);
      previousContent && setPreviousTitle(previousContent.title);
    }

    if (currentContentId < contentList.length - 1) {
      const nextContent = getNextOrPreviousContent(contentList, 1);
      nextContent && setNextTitle(nextContent?.title);
    }
  }, [contentList, contentSlug, getNextOrPreviousContent]);

  return (
    <>
      {content && <ContentBody content={content} />}
      <NavigationSection currentIndex={currentId} totalItems={contentList.length} handleNext={() => handleNavigation(1)} handlePrevious={() => handleNavigation(-1)} previousTitle={previousTitle} nextTitle={nextTitle}/>
      {isShowPlayground && <ContentPlayground initialCode={initialCode} />}
    </>
  );
};

export default ContentDetail;
