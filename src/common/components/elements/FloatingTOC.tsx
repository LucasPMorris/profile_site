import { FiBookOpen as ContentIcon } from 'react-icons/fi';
import { BsArrowRight as ArrowIcon } from 'react-icons/bs';
import { TocItem } from '@/common/types/toc';
import { useState, useEffect, useCallback } from 'react';
import { scrollToSection } from '@/common/helpers';

interface FloatingTOCProps { 
  content: any; 
  tableOfContents: TocItem[]; 
  title?: string; 
}

export const FloatingTOC = ({ content, tableOfContents, title = "Contents" }: FloatingTOCProps) => {
  const [hoveredItem, setHoveredItem] = useState<string>('');
  const [topPosition, setTopPosition] = useState(220);
  const [isVisible, setIsVisible] = useState(false);

  const handleScroll = useCallback(() => {
    const projectContentStart = document.querySelector('.project-content-start');
    if (projectContentStart) {
      const rect = projectContentStart.getBoundingClientRect();
      const scrollY = window.scrollY;
      
      // Calculate the initial offset of the content from the top
      const contentOffsetFromTop = rect.top + scrollY;
      
      // If we've scrolled past the content start, stick to top-0
      // Otherwise, position relative to the content start
      if (scrollY >= contentOffsetFromTop) { 
        setTopPosition(0); 
      } else { 
        setTopPosition(Math.max(0, contentOffsetFromTop - scrollY)); 
      }
    }
  }, []);

  useEffect(() => {
    // Delayed fade-in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300); // 300ms delay

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return (
    <aside 
      className={`hidden lg:block fixed left-4 xl:left-8 w-64 h-fit z-40 transition-all duration-200 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
      }`}
      style={{ top: `${topPosition}px` }}
    >
      <div className="max-h-[calc(100vh-5rem)] overflow-y-auto">
        <div className="rounded-r-xl border-l-[5px] bg-white/40 dark:bg-white/5 border-neutral-900 border-l-cyan-500 backdrop-blur-sm shadow-lg py-3 pl-2">
          <h3 className="text-lg font-semibold mb-4 text-neutral-700 dark:text-neutral-400 px-2">{title}</h3>
          
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
      </div>
    </aside>
  );
}