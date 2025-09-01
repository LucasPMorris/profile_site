import { motion } from 'framer-motion';
import InfiniteScroll from 'react-infinite-scroll-component';
import { PiTrafficConeFill } from "react-icons/pi";

import EmptyState from '@/common/components/elements/EmptyState';
import { ProjectsProps } from '@/common/types/projects';

import ProjectCard from './ProjectCard';

interface ProjectsComponentProps { projects: ProjectsProps['projects']; loadMore: () => void; hasMore: boolean; }

const Projects = ({ projects, loadMore, hasMore }: ProjectsComponentProps) => {
  const filteredProjects = projects.filter((project) => project?.is_show);

  const CurrentState = () => {
    return (
      <div className='flex flex-col items-center justify-center space-y-3 py-5 text-neutral-700 dark:text-neutral-400'>
        <PiTrafficConeFill size={48} />
        <p>Project section will be updated soon.</p>
        <p>Site only recently went live (09/01/2025)</p>
        <p>Coming soon!</p>
      </div>
    );
  };

  // TODO: Remove CurrentState and use EmptyState component after Projects have been added.
  if (filteredProjects.length === 0) { return <CurrentState />; }
//  if (filteredProjects.length === 0) { return <EmptyState message='No Data' />; }

  return (
    <InfiniteScroll dataLength={filteredProjects.length} next={loadMore} hasMore={hasMore} loader={<h4>Loading...</h4>} style={{ overflow: 'hidden' }}>
      <div className='grid gap-5 px-1 pt-2 sm:grid-cols-2'>
        {filteredProjects.map((project, index) => (
          <motion.div key={index} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: index * 0.1 }} >
            <ProjectCard {...project} />
          </motion.div>
        ))}
      </div>
    </InfiniteScroll>
  );
};

export default Projects;
