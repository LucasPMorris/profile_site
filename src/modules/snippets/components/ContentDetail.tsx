import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import NavigationSection from '@/common/components/elements/NavigationSection';
import { TableOfContents } from '@/common/components/elements/TableOfContents';
import { MobileTOC } from '@/common/components/elements/MobileTOC';
import { parseUrl } from '@/common/helpers';
import { SubContentMetaProps } from '@/common/types/snippets';
import { fetcher } from '@/services/fetcher';

import ContentBody from './ContentBody';

interface ContentListItemProps { id: number; parent_slug: string;  slug: string; title: string; }
interface ContentDetailProps { content: string; frontMatter: SubContentMetaProps;  }
interface TocItem { id: string; title: string; line: number; originalTitle: string; }

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
  const language = meta?.language;

  const { data: resContentData } = useSWR(`/api/content?category=${parentSlug}`, fetcher);
  const { data: viewsData } = useSWR(`/api/views?slug=${contentSlug}&type=snippet`, fetcher);

  // Extract table of contents from span elements with IDs only
  const tableOfContents = useMemo(() => {
    if (!content) return [];
    
    const lines = content.split('\n');
    const tocItems: TocItem[] = [];

    lines.forEach((line, index) => {
      // Look for span elements with id and name attributes
      const spanMatch = line.match(/##\s*<span\s+id="([^"]+)"\s+name="([^"]+)"><\/span>/);
      if (spanMatch) {
        const id = spanMatch[1].trim(); // Use the actual ID from the span
        const title = spanMatch[2].trim(); // Use the name for display
        
        tocItems.push({ id, title, line: index + 1, originalTitle: title });
      }
    });

    return tocItems;
  }, [content]);

  // Smooth scroll to section using the span ID
  const scrollToSection = (item: TocItem) => {
    // First try to find by the exact ID
    const element = document.getElementById(item.id);
    
    if (element) {
      const headerOffset = 80; // Adjust this value based on your header height
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    } else { 
      // Fallback: try to find the span by searching for the name attribute
      const spanByName = document.querySelector(`span[name="${item.title}"]`);
      if (spanByName) {
        const headerOffset = 80;
        const elementPosition = spanByName.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      } else { console.warn(`Could not find span with name: ${item.title}`); }
    }
  };

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
    const getId = contentList?.find((item: ContentListItemProps) => item.slug === contentSlug);
    const currentContentId = getId?.id as number;
    setCurrentId(currentContentId);

    if (currentContentId > 0) { 
      const previousContent = getNextOrPreviousContent(contentList, -1);
      previousContent && setPreviousTitle(previousContent.title);
    }

    if (currentContentId < contentList.length) {
      const nextContent = getNextOrPreviousContent(contentList, 1);
      nextContent && setNextTitle(nextContent.title);
    }
  }, [contentList, contentSlug, getNextOrPreviousContent]);
  
  return (
    <div className="flex max-w-7xl mx-auto gap-6">
      {/* Desktop TOC - Sidebar only */}
      <TableOfContents content={content} title="Snippets" mode="inline" />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {/* Mobile TOC - Inside main content area */}
        <MobileTOC content={content} title="Snippets" />
        
        {/* Existing Content */}
        {content && <ContentBody content={content} />}
        
        <NavigationSection 
          currentIndex={currentId} 
          totalItems={contentList.length} 
          handleNext={() => handleNavigation(1)} 
          handlePrevious={() => handleNavigation(-1)} 
          previousTitle={previousTitle} 
          nextTitle={nextTitle} 
        />
      </main>
    </div>
  );
};

export default ContentDetail;