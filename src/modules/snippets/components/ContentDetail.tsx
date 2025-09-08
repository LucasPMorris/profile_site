import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import { FiBookOpen as ContentIcon } from 'react-icons/fi';
import { BsArrowRight as ArrowIcon } from 'react-icons/bs';

import NavigationSection from '@/common/components/elements/NavigationSection';
import { parseUrl } from '@/common/helpers';
import { SubContentMetaProps } from '@/common/types/snippets';
import { fetcher } from '@/services/fetcher';

import ContentBody from './ContentBody';
import ContentPlayground from './ContentPlayground';
import clsx from 'clsx';

interface ContentListItemProps { id: number; parent_slug: string;  slug: string; title: string; }
interface ContentDetailProps { content: string; frontMatter: SubContentMetaProps;  }
interface TocItem { id: string; title: string; line: number; originalTitle: string; }

const ContentDetail = ({ content, frontMatter }: ContentDetailProps) => {
  const [contentList, setContentList] = useState<ContentListItemProps[]>([]);
  const [currentId, setCurrentId] = useState<number>(0);
  const [nextTitle, setNextTitle] = useState<string | null>(null);
  const [previousTitle, setPreviousTitle] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string>('');

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
        
        console.log(`Found span - ID: "${id}", Name: "${title}", Line: ${index + 1}`);
        tocItems.push({ id, title, line: index + 1, originalTitle: title });
      }
    });

    console.log('Final TOC items:', tocItems);
    return tocItems;
  }, [content]);

  // Smooth scroll to section using the span ID
  const scrollToSection = (item: TocItem) => {
    console.log(`Trying to scroll to ID: ${item.id}`);
    
    // First try to find by the exact ID
    const element = document.getElementById(item.id);
    
    if (element) {
      console.log(`Found element with ID: ${item.id}`, element);
      const headerOffset = 80; // Adjust this value based on your header height
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    } else {
      console.warn(`Could not find element with ID: ${item.id}`);
      console.log('Available elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
      
      // Fallback: try to find the span by searching for the name attribute
      const spanByName = document.querySelector(`span[name="${item.title}"]`);
      if (spanByName) {
        console.log(`Found span by name attribute: ${item.title}`, spanByName);
        const headerOffset = 80;
        const elementPosition = spanByName.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      } else {
        console.warn(`Could not find span with name: ${item.title}`);
      }
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
      {/* Table of Contents Sidebar */}
      {tableOfContents.length > 0 && (
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-20 h-fit max-h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="rounded-r-xl border-l-[5px] bg-white/40 dark:bg-white/5 border-neutral-900 border-l-cyan-500 bg-neutral-200 py-3 pl-2 text-lg font-medium">
            <h3 className="text-lg font-semibold mb-4 text-neutral-700 dark:text-neutral-400">Snippets</h3>
            
            <nav className="space-y-2">
              {tableOfContents.map((item) => (
                <div key={item.id} onClick={() => scrollToSection(item)}
                  className={'block w-11/12 text-left px-[6px] rounded-md text-sm transition-colors text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 hover:dark:text-neutral-300'}>
                  <div className='flex justify-left items-center hover:cursor-pointer hover:bg-white dark:hover:bg-neutral-700 p-2 rounded-md'>
                    <ContentIcon size={16} className="inline mr-[12px]" />
                    <div className='flex justify-between items-center w-full' onMouseEnter={() => setHoveredItem(item.id)} onMouseLeave={() => setHoveredItem('')}>
                      <span className="block truncate text-left">{item.title}</span>
                      {hoveredItem === item.id && ( <ArrowIcon size={14} className="text-neutral-900 dark:text-neutral-300" />)}
                    </div>
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {/* Mobile TOC */}
        {tableOfContents.length > 0 && (
          <div className="lg:hidden mb-6">
            <details className="bg-white dark:bg-neutral-900 rounded-lg border dark:border-neutral-700">
              <summary className="px-4 py-3 cursor-pointer font-medium text-neutral-900 dark:text-neutral-200 flex items-center">
                <ContentIcon size={16} className="mr-2" />Snippets
              </summary>
              <div className="px-2 pb-2 border-t border-neutral-200 dark:border-neutral-700 mt-2 pt-2 max-h-60 overflow-y-auto space-y-1">
                {tableOfContents.map((item) => {
                  const isHovered = hoveredItem === item.id;
                  
                  return (
                    <button key={item.id} onClick={() => scrollToSection(item)} onMouseEnter={() => setHoveredItem(item.id)} onMouseLeave={() => setHoveredItem('')} className={`flex items-center gap-2 py-2 pl-4 pr-2.5 text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 hover:dark:text-neutral-300 rounded-lg group w-full transition-all duration-300 ${isHovered ? 'bg-neutral-200 dark:bg-neutral-800' : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'}`}>
                      <ContentIcon size={14} />
                      <div className="ml-0.5 flex-grow text-left text-sm">{item.title}</div>
                      {isHovered && <ArrowIcon size={20} className="text-gray-500 transition-all duration-300" />}
                    </button>
                  );
                })}
              </div>
            </details>
          </div>
        )}

        {/* Existing Content */}
        {content && <ContentBody content={content} />}
        
        <NavigationSection currentIndex={currentId} totalItems={contentList.length} handleNext={() => handleNavigation(1)} handlePrevious={() => handleNavigation(-1)} previousTitle={previousTitle} nextTitle={nextTitle} />
        
        {isShowPlayground && language !== 'JavaScript' && (
          <ContentPlayground initialCode={initialCode} />
        )}
      </main>
    </div>
  );
};

export default ContentDetail;