import Image from '@/common/components/elements/Image';
import MDXComponent from '@/common/components/elements/MDXComponent';
import Tooltip from '@/common/components/elements/Tooltip';
import { STACKS } from '@/common/constant/stacks';
import { ProjectItemProps } from '@/common/types/projects';
import { TableOfContents } from '@/common/components/elements/TableOfContents';
import ProjectLink from './ProjectLink';
import useSWR from 'swr';
import { fetcher } from '@/services/fetcher';

const ProjectDetail = ({ title, image, stacks, link_demo, link_github, content, slug }: ProjectItemProps) => {
  const { data: viewsData } = useSWR( `/api/views?slug=${slug}&type=project`, fetcher );
  const stacksArray = stacks ? stacks.split(',').map(s => s.trim()) : [];

  return (
    <div className="w-full relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile TOC */}
        <TableOfContents content={content || ''} title={title} mode="mobile" />
        
        {/* Project Content Container with Floating TOC */}
        <div className="relative">
          {/* Floating TOC for Desktop - positioned relative to this container */}
          <div className="hidden lg:block"><TableOfContents content={content || ''} title={title} mode="floating" /></div> 
          
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
            <Image src={image || '/placeholder.jpg'} width={0} height={0} sizes="100vw" alt={title} className='w-full h-auto hover:scale-105' />
            {content && (
              <div className='mt-5 space-y-5 leading-[1.8] dark:text-neutral-300'>
                <MDXComponent>{content}</MDXComponent>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
