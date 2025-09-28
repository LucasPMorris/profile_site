import { useState } from 'react';
import { BsArrowRight as ArrowIcon } from 'react-icons/bs';
import { FiBookOpen as ContentIcon } from 'react-icons/fi';
import { TocItem } from '@/common/types/toc';
import { scrollToSection } from '@/common/helpers';

interface InlineTOCProps { content: any; tableOfContents: TocItem[], title?: string; }

export const InlineTOC = ({ content, tableOfContents, title = "Contents" }: InlineTOCProps) => {
  const [hoveredItem, setHoveredItem] = useState<string>('');
    
  return (
    <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-20 h-fit max-h-[calc(100vh-5rem)] overflow-y-auto">
      <div className="rounded-r-xl border-l-[5px] bg-white/40 dark:bg-white/5 border-neutral-900 border-l-cyan-500 bg-neutral-200 py-3 pl-2 text-lg font-medium">
        <h3 className="text-lg font-semibold mb-4 text-neutral-700 dark:text-neutral-400">{title}</h3>
        
        <nav className="space-y-2">
          {tableOfContents.map((item) => (
            <div key={item.id} onClick={() => scrollToSection(item)}
              className={`block w-11/12 text-left px-[6px] rounded-md text-sm transition-colors text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 hover:dark:text-neutral-300 ${item.level === 2 ? 'pl-6' : ''}`}>
              <div className='flex justify-left items-center hover:cursor-pointer hover:bg-white dark:hover:bg-neutral-700 p-2 rounded-md'>
                {item.level === 1 && <ContentIcon size={16} className="inline mr-[12px]" />}
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
  );
}