import Image from '@/common/components/elements/Image';
import MDXComponent from '@/common/components/elements/MDXComponent';
import Tooltip from '@/common/components/elements/Tooltip';
import { STACKS } from '@/common/constant/stacks';
import { ProjectItemProps } from '@/common/types/projects';
import { TableOfContents } from '@/common/components/elements/TableOfContents';
import ProjectLink from './ProjectLink';
import useSWR from 'swr';
import { fetcher } from '@/services/fetcher';
import useIsMobile from '@/common/hooks/useIsMobile';
import { useMemo } from 'react';

const ProjectDetail = ({ title, image, stacks, link_demo, link_github, content, slug }: ProjectItemProps) => {
  const { data: viewsData } = useSWR(`/api/views?slug=${slug}&type=project`, fetcher);
  const stacksArray = stacks ? stacks.split(',').map(s => s.trim()) : [];

  const tableOfContents = useMemo(() => {
    if (!content) return [];
    
    const lines = content.split('\n');
    const tocItems: any[] = [];

    lines.forEach((line, index) => {
      const spanMatch = line.match(/<span\s+id="([^"]+)"\s+name="([^"]+)"\s+data-toc(sub)?[^>]*>/);
      if (spanMatch) {
        const id = spanMatch[1].trim();
        const displayTitle = spanMatch[2].trim();
        const isSubsection = !!spanMatch[3];
        
        tocItems.push({ 
          id, 
          title: displayTitle, 
          line: index + 1, 
          originalTitle: displayTitle,
          level: isSubsection ? 2 : 1
        });
      }
    });

    return tocItems;
  }, [content]);

  return (
    <div className="w-full min-h-screen">
      {/* Mobile TOC - Only on mobile */}
      <div className="lg:hidden mb-6">
        <TableOfContents content={content || ''} title={title} mode='mobile'/>
      </div>
      
      Floating TOC - Only on desktop
      <div className="hidden lg:block">
        <TableOfContents content={content || ''} title={title} mode='floating'/>
      </div>
      
      {/* Main Content Container - Full width on mobile */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* <div className="max-w-none sm:max-w-7xl mx-auto"> */}
          {/* Project Content */}
          <div className='space-y-8 project-content-start'>
            <div className='flex flex-col items-start justify-between gap-5 sm:flex-row lg:flex-row lg:items-center'>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='mb-1 text-[15px] text-neutral-800 dark:text-neutral-300'>Tech Stack :</span>
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
            <Image 
              src={image || '/placeholder.jpg'} 
              width={800} 
              height={400} 
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              alt={title} 
              className='w-full h-auto hover:scale-105' 
            />
            {content && (
              <div className='mt-5 space-y-5 leading-[1.8] dark:text-neutral-300'>
                <MDXComponent>{content}</MDXComponent>
              </div>
            )}
          </div>
        {/* </div> */}
      </div>
    </div>
  );
};

export default ProjectDetail;

