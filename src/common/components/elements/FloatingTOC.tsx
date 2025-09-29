import { useState, useEffect, useCallback, useRef } from 'react';
import { FiBookOpen as ContentIcon } from 'react-icons/fi';
import { BsArrowRight as ArrowIcon } from 'react-icons/bs';
import { TocItem } from '@/common/types/toc';
import { scrollToSection } from '@/common/helpers';

interface FloatingTOCProps { content: any; tableOfContents: TocItem[]; title?: string; }
export const FloatingTOC = ({ content, tableOfContents, title = "Contents" }: FloatingTOCProps) => {
  const [hoveredItem, setHoveredItem] = useState<string>('');
  const [activeItem, setActiveItem] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  // Track which section is currently in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the largest intersection ratio (most visible)
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        
        if (visibleEntries.length > 0) {
          // Sort by intersection ratio (how much of the element is visible)
          const mostVisible = visibleEntries.reduce((prev, current) => 
            current.intersectionRatio > prev.intersectionRatio ? current : prev
          );
          
          // Get the TOC ID from the data attribute we set
          const tocId = mostVisible.target.getAttribute('data-toc-id');
          if (tocId) {
            setActiveItem(tocId);
          }
        }
      },
      {
        // More aggressive margins since we're observing content blocks
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0]
      }
    );

    // Debug: Find all span elements with data-toc attribute and log their IDs
    const tocMarkers = document.querySelectorAll('span[data-toc]');
    console.log('=== DEBUGGING TOC MARKERS ===');
    console.log('TOC items from props:', tableOfContents.map(item => ({ id: item.id, title: item.title })));
    console.log('Span elements found in DOM:');
    tocMarkers.forEach(span => {
      console.log({
        id: span.id,
        name: span.getAttribute('name'),
        element: span
      });
    });
    
    const observedElements: Element[] = [];
    
    // For each TOC item, find the span and observe meaningful content near it
    tableOfContents.forEach((tocItem) => {
      console.log(`\n--- Looking for TOC item: ${tocItem.id} ---`);
      
      // IMPORTANT: Use querySelector to specifically target the span, not just any element with this ID
      // This avoids matching the header which also has the same ID
      let spanElement = document.querySelector(`span[data-toc]#${CSS.escape(tocItem.id)}`) as HTMLElement;
      
      if (!spanElement) {
        console.log(`❌ No span[data-toc] found with ID: ${tocItem.id}`);
        
        // Try finding by name attribute
        spanElement = document.querySelector(`span[data-toc][name="${tocItem.title}"]`) as HTMLElement ||
                     document.querySelector(`span[data-toc][name="${tocItem.originalTitle}"]`) as HTMLElement;
        
        if (spanElement) {
          console.log(`✅ Found by name attribute:`, spanElement);
        } else {
          console.log(`❌ No span found by name either. Tried names: "${tocItem.title}", "${tocItem.originalTitle}"`);
          return; // Skip this item
        }
      } else {
        console.log(`✅ Found span by ID:`, spanElement);
      }
      
      if (spanElement) {
        // Find the next meaningful element to observe
        let elementToObserve: Element | null = null;
        
        // Try different strategies to find content to observe
        const strategies = [
          // 1. Next sibling element
          () => spanElement.nextElementSibling,
          // 2. Parent's next sibling
          () => spanElement.parentElement?.nextElementSibling,
          // 3. First child of parent's next sibling
          () => spanElement.parentElement?.nextElementSibling?.firstElementChild,
          // 4. Next paragraph or heading
          () => {
            let next = spanElement.nextElementSibling;
            while (next) {
              if (next.tagName?.match(/^(P|DIV|H[1-6]|SECTION|ARTICLE)$/)) {
                return next;
              }
              next = next.nextElementSibling;
            }
            return null;
          },
          // 5. Fallback to parent element
          () => spanElement.parentElement
        ];
        
        for (const strategy of strategies) {
          elementToObserve = strategy() || null;
          if (elementToObserve && (elementToObserve as HTMLElement).offsetHeight > 0) {
            break;
          }
        }
        
        if (elementToObserve) {
          // Add a data attribute to link back to the TOC item
          elementToObserve.setAttribute('data-toc-id', tocItem.id);
          
          observer.observe(elementToObserve);
          observedElements.push(elementToObserve);
          
          console.log(`✅ Observing content for TOC item:`, {
            tocId: tocItem.id,
            tocTitle: tocItem.title,
            spanElement: spanElement,
            observedElement: elementToObserve,
            elementTag: elementToObserve.tagName,
            elementHeight: (elementToObserve as HTMLElement).offsetHeight
          });
        } else {
          console.warn(`❌ Could not find meaningful content to observe for:`, {
            id: tocItem.id,
            title: tocItem.title,
            spanElement: spanElement
          });
        }
      }
    });
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total elements being observed: ${observedElements.length}/${tableOfContents.length}`);

    return () => {
      observer.disconnect();
    };
  }, [tableOfContents]);

  useEffect(() => {
    // Delayed fade-in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <aside 
      className={`hidden lg:block fixed left-4 xl:left-8 top-20 w-64 h-fit z-40 transition-all duration-200 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
      }`}
    >
      <div className="max-h-[calc(100vh-6rem)] overflow-y-auto">
        <div className="rounded-r-xl border-l-[5px] bg-white/40 dark:bg-white/5 border-neutral-900 border-l-cyan-500 backdrop-blur-sm shadow-lg py-3 pl-2">
          <h3 className="text-lg font-semibold mb-4 text-neutral-700 dark:text-neutral-400 px-2">{title}</h3>
          
          <nav className="space-y-2">
            {tableOfContents.map((item) => {
              const isActive = activeItem === item.id;
              const isHovered = hoveredItem === item.id;
              
              return (
                <div key={item.id} onClick={() => scrollToSection(item)}
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
                    {item.level === 1 && (
                      <ContentIcon 
                        size={16} 
                        className={`inline mr-[12px] transition-colors ${
                          isActive ? 'text-cyan-600 dark:text-cyan-400' : ''
                        }`} 
                      />
                    )}
                    <div className='flex justify-between items-center w-full' 
                         onMouseEnter={() => setHoveredItem(item.id)} 
                         onMouseLeave={() => setHoveredItem('')}>
                      <span className="block truncate text-left">{item.title}</span>
                      {isHovered && !isActive && ( 
                        <ArrowIcon size={14} className="text-neutral-900 dark:text-neutral-300" />
                      )}
                      {isActive && (
                        <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}