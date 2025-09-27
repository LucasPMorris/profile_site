import Image from '@/common/components/elements/Image';
import MDXComponent from '@/common/components/elements/MDXComponent';
import Tooltip from '@/common/components/elements/Tooltip';
import { STACKS } from '@/common/constant/stacks';
import { ProjectItemProps } from '@/common/types/projects';

import ProjectLink from './ProjectLink';
import useSWR from 'swr';
import { fetcher } from '@/services/fetcher';
import { useMemo, useState } from 'react';
import { FiBookOpen as ContentIcon } from 'react-icons/fi';
import { BsArrowRight as ArrowIcon } from 'react-icons/bs';

interface TocItem {
  id: string;
  title: string;
  level: number;
}

const ProjectDetail = ({ title, image, stacks, link_demo, link_github, content, slug }: ProjectItemProps) => {
  const { data: viewsData } = useSWR( `/api/views?slug=${slug}&type=project`, fetcher );
  const [hoveredItem, setHoveredItem] = useState<string>('');
  const stacksArray = stacks ? stacks.split(',').map(s => s.trim()) : [];

  // Extract table of contents from H2 and H3 header tags (ignoring code blocks)
  const tableOfContents = useMemo(() => {
    if (!content) return [];
    
    // Remove frontmatter if it exists (content between --- lines)
    let processedContent = content;
    const frontmatterRegex = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;
    if (frontmatterRegex.test(content)) {
      processedContent = content.replace(frontmatterRegex, '').trim();
    }
       
    const lines = processedContent.split('\n');
    const tocItems: TocItem[] = [];
    let inCodeBlock = false;

    lines.forEach((line, index) => {
      // Check if we're entering or leaving a code block
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return;
      }
      
      // Skip processing if we're inside a code block
      if (inCodeBlock) { return; }
      
      // Look for H2 tags (## Header) - primary sections
      const h2Match = line.match(/^##\s+(.+)/);
      // Look for H3 tags (### Header) - sub topics
      const h3Match = line.match(/^###\s+(.+)/);
      
      if (h2Match) {
        const title = h2Match[1].trim();
        // Create a URL-friendly ID from the title (matching MDXComponent logic)
        const id = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        tocItems.push({ id, title, level: 1 }); // H2 becomes level 1 in TOC
      } else if (h3Match) {
        const title = h3Match[1].trim();
        // Create a URL-friendly ID from the title (matching MDXComponent logic)
        const id = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        tocItems.push({ id, title, level: 2 }); // H3 becomes level 2 in TOC
      }
    });

    return tocItems;
  }, [content]);

  // Smooth scroll to section using the generated ID
  const scrollToSection = (item: TocItem) => {
    const element = document.getElementById(item.id);
    
    if (element) {
      const headerOffset = 80; // Adjust this value based on your header height
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    } else {
      console.warn(`Could not find element with id: ${item.id}`);
    }
  };

  return (
    <div className="flex max-w-7xl mx-auto gap-6">
      {/* Table of Contents Sidebar */}
      {tableOfContents.length > 0 && (
        <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-20 h-fit max-h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="rounded-r-xl border-l-[5px] bg-white/40 dark:bg-white/5 border-neutral-900 border-l-cyan-500 bg-neutral-200 py-3 pl-2 text-lg font-medium">
            <h3 className="text-lg font-semibold mb-4 text-neutral-700 dark:text-neutral-400">Contents</h3>
            
            <nav className="space-y-2">
              {tableOfContents.map((item) => (
                <div key={item.id} onClick={() => scrollToSection(item)}
                  className={`block w-11/12 text-left px-[6px] rounded-md transition-colors text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 hover:dark:text-neutral-300 ${item.level === 2 ? 'pl-6' : ''}`}>
                  <div className='flex justify-left items-center hover:cursor-pointer hover:bg-white dark:hover:bg-neutral-700 p-2 rounded-md'>
                    {item.level === 1 && <ContentIcon size={16} className="inline mr-[12px]" />}
                    <div className='flex justify-between items-center w-full' onMouseEnter={() => setHoveredItem(item.id)} onMouseLeave={() => setHoveredItem('')}>
                      <span className={`block truncate text-left ${item.level === 1 ? 'text-sm' : 'text-xs'}`}>{item.title}</span>
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
                <ContentIcon size={16} className="mr-2" />Contents
              </summary>
              <div className="px-2 pb-2 border-t border-neutral-200 dark:border-neutral-700 mt-2 pt-2 max-h-60 overflow-y-auto space-y-1">
                {tableOfContents.map((item) => {
                  const isHovered = hoveredItem === item.id;
                  
                  return (
                    <button key={item.id} onClick={() => scrollToSection(item)} onMouseEnter={() => setHoveredItem(item.id)} onMouseLeave={() => setHoveredItem('')} className={`flex items-center gap-2 py-2 pr-2.5 text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 hover:dark:text-neutral-300 rounded-lg group w-full transition-all duration-300 ${isHovered ? 'bg-neutral-200 dark:bg-neutral-800' : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'} ${item.level === 1 ? 'pl-4' : 'pl-8'}`}>
                      {item.level === 1 && <ContentIcon size={14} />}
                      {item.level === 2 && <div className="w-3.5"></div>}
                      <div className={`ml-0.5 flex-grow text-left ${item.level === 1 ? 'text-sm' : 'text-xs'}`}>{item.title}</div>
                      {isHovered && <ArrowIcon size={20} className="text-gray-500 transition-all duration-300" />}
                    </button>
                  );
                })}
              </div>
            </details>
          </div>
        )}

        {/* Existing Project Content */}
        <div className='space-y-8'>
          <div className='flex flex-col items-start justify-between gap-5 sm:flex-row lg:flex-row lg:items-center'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='mb-1 text-[15px] text-neutral-800 dark:text-neutral-300'>
                Tech Stack :
              </span>
              <div className='flex flex-wrap items-center gap-3'>
                {stacksArray?.map((stack: string, index: number) => (
                  <div key={index}>
                    <Tooltip title={stack}>{STACKS[stack]}</Tooltip>
                  </div>
                ))}
              </div>
            </div>
            <ProjectLink title={title} link_demo={link_demo} link_github={link_github} />
          </div>
          <Image src={image} width={800} height={400} alt={title} className='hover:scale-105' />
          {content && (
            <div className='mt-5 space-y-5 leading-[1.8] dark:text-neutral-300'>
              <MDXComponent>{content}</MDXComponent>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProjectDetail;
