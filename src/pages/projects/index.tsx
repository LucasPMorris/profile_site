import { GetStaticProps, NextPage } from 'next';
import { NextSeo } from 'next-seo';
import { useState } from 'react';

import Container from '@/common/components/elements/Container';
import PageHeading from '@/common/components/elements/PageHeading';
import prisma from '@/common/libs/prisma';
import { ProjectItemProps } from '@/common/types/projects';
import Projects from '@/modules/projects';

interface ProjectsPageProps {  projects: ProjectItemProps[]; }

const PAGE_TITLE = 'Projects';
const PAGE_DESCRIPTION = 'A showcase of projects, from professional work to personal endeavors.';

const ProjectsPage: NextPage<ProjectsPageProps> = ({ projects }) => {
  const [visibleProjects, setVisibleProjects] = useState(6);

  const loadMore = () => setVisibleProjects((prev) => prev + 2);
  const hasMore = visibleProjects < projects.length;

  return (
    <>
      {/* TODO: Update so that SEO with Cover Image Unfurl works */}
      <NextSeo title={`${PAGE_TITLE} - Lucas Morris`} />
      <Container data-aos='fade-up'>
        <PageHeading title={PAGE_TITLE} description={PAGE_DESCRIPTION} />
        <div className="bg-red-500 sm:bg-blue-500 md:bg-green-500 lg:bg-yellow-500 xl:bg-purple-500 p-4 text-white">
  <div className="block sm:hidden">Mobile (red)</div>
  <div className="hidden sm:block md:hidden">Small (blue)</div>
  <div className="hidden md:block lg:hidden">Medium (green)</div>
  <div className="hidden lg:block xl:hidden">Large (yellow)</div>
  <div className="hidden xl:block">XL (purple)</div>
</div>
        <Projects projects={projects.slice(0, visibleProjects)} loadMore={loadMore} hasMore={hasMore} />
      </Container>
    </>
  );
};

export default ProjectsPage;

export const getStaticProps: GetStaticProps = async () => {
  const response = await prisma.projects.findMany({ orderBy: [{ is_featured: 'desc', }, { updated_at: 'desc' }] });
  return { props: { projects: JSON.parse(JSON.stringify(response)) }, revalidate: 1 };
};
