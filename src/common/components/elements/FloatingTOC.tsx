import { useState, useEffect, useCallback, useRef } from 'react';
import { FiBookOpen as ContentIcon, FiMenu as MenuIcon, FiX as CloseIcon } from 'react-icons/fi';
import { BsArrowRight as ArrowIcon } from 'react-icons/bs';
import { TocItem } from '@/common/types/toc';
import { scrollToSection } from '@/common/helpers';

interface FloatingTOCProps { content: any; tableOfContents: TocItem[]; title?: string; }

export const FloatingTOC = ({ content, tableOfContents, title = "Contents" }: { content: any; tableOfContents: TocItem[]; title?: string }) => {
  const [hoveredItem, setHoveredItem] = useState<string>('');
  const [activeItem, setActiveItem] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);

  // Debounce utility
  function debounce(fn: (...args: any[]) => void, delay: number) {
    let timer: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
  
  // Track if a TOC click is in progress, so we don't update activeItem until scroll arrives
  const tocClickInProgress = useRef<string | null>(null);

  // Enhanced scrollToSection that sets tocClickInProgress
  const handleTocClick = useCallback((item: TocItem) => {
    //tocClickInProgress.current = item.id;
    scrollToSection(item);
    if (isMenuOpen) { setTimeout(() => setIsMenuOpen(false), 400); }
  }, [isMenuOpen]);

  // Check if we should show the menu button (when TOC would normally be hidden)
  useEffect(() => {
    const checkButtonVisibility = debounce(() => {
      const totalNeeded = 1700;
      setShouldShowButton(window.innerWidth < totalNeeded || window.innerWidth < 920);
    }, 100);

    checkButtonVisibility();
    window.addEventListener('resize', checkButtonVisibility);
    return () => window.removeEventListener('resize', checkButtonVisibility);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && !(event.target as Element).closest('.toc-menu')) { setIsMenuOpen(false); }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  // Fallback: determine active item based on scroll position
  const updateActiveItemByScroll = useCallback(() => {
    const scrollTop = window.scrollY + 100;

    const sectionPositions = tableOfContents.map((item) => {
      const element = document.getElementById(item.id);
      return { id: item.id, top: element ? element.offsetTop : 0, element };
    }).filter(item => item.element);

    sectionPositions.sort((a, b) => a.top - b.top);

    let activeSection = sectionPositions[0];

    for (const section of sectionPositions) {
      if (section.top <= scrollTop) { activeSection = section; }
      else { break; }
    }

    if (activeSection && activeItem !== activeSection.id) { setActiveItem(activeSection.id); }
  }, [tableOfContents, activeItem]);

  // Track which section is currently in view
  useEffect(() => {
    if (tableOfContents.length === 0) return;

    const observer = new IntersectionObserver(
      debounce((entries: IntersectionObserverEntry[]) => {
        const visible = entries
          .filter(entry => entry.isIntersecting && entry.target.hasAttribute('data-toc-id'))
          .map(entry => ({
            id: entry.target.getAttribute('data-toc-id')!,
            top: Math.abs(entry.boundingClientRect.top),
            ratio: entry.intersectionRatio
          }));

        if (visible.length > 0) {
          visible.sort((a, b) => a.top - b.top);
          const newActiveId = visible[0].id;
          setActiveItem(newActiveId);
        } else {
          updateActiveItemByScroll();
        }
      }, 100),
      {
        rootMargin: '-20% 0px -40% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0]
      }
    );

    const observedElements: Element[] = [];

    tableOfContents.forEach((tocItem) => {
      let spanElement = document.getElementById(tocItem.id) as HTMLElement;

      if (!spanElement) {
        spanElement =
          document.querySelector(`span[data-toc][name="${tocItem.title}"]`) as HTMLElement ||
          document.querySelector(`span[data-tocsub][name="${tocItem.title}"]`) as HTMLElement ||
          document.querySelector(`span[name="${tocItem.originalTitle}"]`) as HTMLElement;
      }

      if (spanElement) {
        let elementToObserve: Element | null = null;

        let sibling = spanElement.nextElementSibling;
        while (sibling && !elementToObserve) {
          if (sibling.tagName?.match(/^(H[1-6]|P|DIV|SECTION|ARTICLE|UL|OL|BLOCKQUOTE)$/)) {
            const rect = (sibling as HTMLElement).getBoundingClientRect();
            if (rect.height > 0) {
              elementToObserve = sibling;
              break;
            }
          }
          sibling = sibling.nextElementSibling;
        }

        if (!elementToObserve && spanElement.previousElementSibling) {
          const prevSibling = spanElement.previousElementSibling;
          if (prevSibling.tagName === 'BR') {
            let nextAfterBr = prevSibling.nextElementSibling;
            while (nextAfterBr) {
              if (nextAfterBr.tagName?.match(/^(H[1-6]|P|DIV|SECTION|ARTICLE|UL|OL|BLOCKQUOTE)$/)) {
                const rect = (nextAfterBr as HTMLElement).getBoundingClientRect();
                if (rect.height > 0) {
                  elementToObserve = nextAfterBr;
                  break;
                }
              }
              nextAfterBr = nextAfterBr.nextElementSibling;
            }
          }
        }

        if (!elementToObserve) {
          let parentNext = spanElement.parentElement?.nextElementSibling;
          while (parentNext && !elementToObserve) {
            if (parentNext.tagName?.match(/^(H[1-6]|P|DIV|SECTION|ARTICLE|UL|OL|BLOCKQUOTE)$/)) {
              const rect = (parentNext as HTMLElement).getBoundingClientRect();
              if (rect.height > 0) {
                elementToObserve = parentNext;
                break;
              }
            }
            parentNext = parentNext.nextElementSibling;
          }
        }

        if (!elementToObserve && spanElement.parentElement) {
          const parent = spanElement.parentElement;
          const rect = parent.getBoundingClientRect();
          if (rect.height > 0) {
            elementToObserve = parent;
          }
        }

        if (elementToObserve) {
          elementToObserve.setAttribute('data-toc-id', tocItem.id);
          observer.observe(elementToObserve);
          observedElements.push(elementToObserve);
        }
      }
    });

    const handleScroll = debounce(() => { updateActiveItemByScroll(); }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [tableOfContents, updateActiveItemByScroll]);

  useEffect(() => {
    const timer = setTimeout(() => { setIsVisible(true) }, 300);
    return () => clearTimeout(timer);
  }, []);

  const TOCContent = ({ className = "" }: { className?: string }) => (
    <div className={`max-h-[calc(100vh-6rem)] overflow-y-auto ${className}`}>
      <div className="rounded-r-xl border-l-[5px] bg-white/40 dark:bg-white/5 border-neutral-900 border-l-cyan-500 backdrop-blur-sm shadow-lg py-3 pl-2">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-400">{title}</h3>
          {isMenuOpen && (
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
              <CloseIcon size={16} className="text-neutral-600 dark:text-neutral-400" />
            </button>
          )}
        </div>
        
        <nav className="space-y-2">
          {tableOfContents.map((item) => {
            const isActive = activeItem === item.id;
            const isHovered = hoveredItem === item.id;
            
            return (
              <div key={item.id} onClick={() => handleTocClick(item)}
                className={`block w-11/12 text-left px-[6px] rounded-md text-sm transition-colors ${
                  isActive 
                    ? 'text-cyan-600 dark:text-cyan-400 font-medium' 
                    : 'text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 hover:dark:text-neutral-300'
                } ${item.level === 2 ? 'pl-6' : ''}`}>
                <div className={`flex justify-left items-center hover:cursor-pointer p-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-cyan-50 dark:bg-cyan-900/20 border-l-2 border-cyan-500' 
                    : 'hover:bg-white dark:hover:bg-neutral-700'
                  }`}>
                  {item.level === 1 && ( <ContentIcon size={16} className={`inline mr-[12px] transition-colors ${ isActive ? 'text-cyan-600 dark:text-cyan-400' : '' }`}  /> )}
                  <div className='flex justify-between items-center w-full' onMouseEnter={() => setHoveredItem(item.id)} onMouseLeave={() => setHoveredItem('')}>
                    <span className="block truncate text-left">{item.title}</span>
                    {isHovered && !isActive && ( <ArrowIcon size={14} className="text-neutral-900 dark:text-neutral-300" /> )}
                    {isActive && ( <div className="w-2 h-2 bg-cyan-500 rounded-full"></div> )}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Floating Menu Button - shows when TOC would normally be hidden */}
      {shouldShowButton && (
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`fixed left-4 top-80 z-50 p-3 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg hover:bg-white dark:hover:bg-neutral-800 transition-all duration-200 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
          }`}
          aria-label="Toggle Table of Contents"
        >
          <MenuIcon size={20} className="text-neutral-700 dark:text-neutral-300" />
          {tableOfContents.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {tableOfContents.length}
            </span>
          )}
        </button>
      )}

      {/* Automatic TOC (desktop, when there's enough space) */}
      {!shouldShowButton && (
        <aside className={`hidden lg:block fixed left-4 xl:left-8 top-80 w-64 h-fit z-40 transition-all duration-200 ${ isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4' }`} >
          <TOCContent />
        </aside>
      )}

      {/* Menu Overlay TOC */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40" />
          
          {/* Menu TOC */}
          <aside className="toc-menu fixed left-4 top-80 w-72 h-fit z-50 transition-all duration-300 transform">
            <TOCContent />
          </aside>
        </>
      )}
    </>
  );
}
