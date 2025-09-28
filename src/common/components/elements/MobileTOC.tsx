import { useMemo, useState } from 'react';
import { HiOutlineMenuAlt2 as MenuIcon } from 'react-icons/hi';
import { HiOutlineChevronRight as ArrowIcon } from 'react-icons/hi';
import { HiOutlineDocumentText as ContentIcon } from 'react-icons/hi';
import { TocItem, TableOfContentsProps } from '@/common/types/toc';
import { scrollToSection } from '@/common/helpers';

export const MobileTOC = ({ content, title }: Omit<TableOfContentsProps, 'showMobile' | 'mode'>) => {
  const [hoveredItem, setHoveredItem] = useState<string>('');

  const tableOfContents = useMemo(() => {
    if (!content) return [];
    
    const lines = content.split('\n');
    const tocItems: TocItem[] = [];

    lines.forEach((line, index) => {
      const spanMatch = line.match(/<span\s+id="([^"]+)"\s+name="([^"]+)"\s+data-toc(sub)?[^>]*>/);
      if (spanMatch) {
        const id = spanMatch[1].trim();
        const displayTitle = spanMatch[2].trim();
        const isSubsection = !!spanMatch[3];        
        tocItems.push({ id,  title: displayTitle, line: index + 1, originalTitle: displayTitle, level: isSubsection ? 2 : 1 });
      }
    });

    return tocItems;
  }, [content]);

  if (tableOfContents.length === 0) {
    return null;
  }

  return (
    <div className="lg:hidden mb-6">
      <details className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-600 shadow-sm">
        <summary className="flex items-center justify-between w-full px-4 py-3 cursor-pointer font-medium text-neutral-700 dark:text-neutral-300 list-none">
          <div className="flex items-center gap-2">
            <MenuIcon size={16} className="text-neutral-600 dark:text-neutral-400" />
            <span>{title}</span>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">({tableOfContents.length})</span>
          </div>
          <ArrowIcon size={16} className="text-neutral-600 dark:text-neutral-400 transform transition-transform duration-200 details-open:rotate-90" />
        </summary>
        
        <div className="border-t border-neutral-200 dark:border-neutral-700 mt-2 pt-2 max-h-60 overflow-y-auto">
          <nav className="pb-2">
            {tableOfContents.map((item) => {
              const isHovered = hoveredItem === item.id;
              
              return (
                <button key={item.id} onClick={() => scrollToSection(item)} onMouseEnter={() => setHoveredItem(item.id)} onMouseLeave={() => setHoveredItem('')} 
                  className={`flex items-center gap-2 w-full py-2 px-4 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 hover:dark:text-neutral-300 rounded-lg transition-all duration-300 ${isHovered ? 'bg-neutral-100 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'} ${item.level === 2 ? 'pl-8' : ''}`}
                >
                  {item.level === 1 && <ContentIcon size={14} className="text-neutral-500 dark:text-neutral-400" />}
                  <div className="flex-grow text-left">{item.title}</div>
                  {isHovered && <ArrowIcon size={14} className="text-neutral-600 dark:text-neutral-400 transition-all duration-300" />}
                </button>
              );
            })}
          </nav>
        </div>
      </details>
    </div>
  );
};