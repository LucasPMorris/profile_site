import Image from '@/common/components/elements/Image';
import MDXComponent from '@/common/components/elements/MDXComponent';
import Tooltip from '@/common/components/elements/Tooltip';
import { STACKS } from '@/common/constant/stacks';
import { ProjectItemProps } from '@/common/types/projects';
import { TableOfContents } from '@/common/components/elements/TableOfContents';
import ProjectLink from './ProjectLink';
import useSWR from 'swr';
import { fetcher } from '@/services/fetcher';
import useHasMounted from '@/common/hooks/useHasMounted';
import useIsMobile from '@/common/hooks/useIsMobile'; // Use your existing hook

const ProjectDetail = ({ title, image, stacks, link_demo, link_github, content, slug }: ProjectItemProps) => {
  const { data: viewsData } = useSWR(`/api/views?slug=${slug}&type=project`, fetcher);
  const stacksArray = stacks ? stacks.split(',').map(s => s.trim()) : [];
  const hasMounted = useHasMounted();
  const isMobile = useIsMobile(); // This properly handles state updates

  console.log('ProjectDetail Debug:', { 
    hasMounted, 
    isMobile,
    timestamp: Date.now() // Add timestamp to see when this runs
  });

  return (
    <div className="w-full">
      {/* TOC - Now with proper state management */}
      {hasMounted && (
        <>
          {isMobile && (
            <div className="mb-4 border-2 border-green-500 p-2">
              <div className="text-green-600 text-xs mb-2">MOBILE TOC ACTIVE</div>
              <TableOfContents content={content || ''} title={title} mode="mobile" />
            </div>
          )}
          
          {!isMobile && (
            <div className="border-2 border-red-500 p-2">
              <div className="text-red-600 text-xs mb-2">DESKTOP TOC ACTIVE</div>
              <TableOfContents content={content || ''} title={title} mode="floating" />
            </div>
          )}
        </>
      )}
      
      {/* Project Content Container */}
      <div className="w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
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
            
            <div className="w-full">
              <Image 
                src={image || '/placeholder.jpg'} 
                width={800} 
                height={400} 
                sizes="(max-width: 640px) 100vw, (max-width: 1200px) 80vw, 1200px"
                alt={title} 
                className='w-full h-auto hover:scale-105' 
              />
            </div>
            
            {content && (
              <div className='mt-5 space-y-5 leading-[1.8] dark:text-neutral-300 w-full'>
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