import { GetServerSideProps, NextPage } from 'next';
import { NextSeo } from 'next-seo';

import BackButton from '@/common/components/elements/BackButton';
import Container from '@/common/components/elements/Container';
import PageHeading from '@/common/components/elements/PageHeading';
import prisma from '@/common/libs/prisma';
import { ProjectItemProps } from '@/common/types/projects';
import ProjectDetail from '@/modules/projects/components/ProjectDetail';
import axios from 'axios';
import { useEffect } from 'react';

interface ProjectsDetailPageProps { project: ProjectItemProps; }

const ProjectsDetailPage: NextPage<ProjectsDetailPageProps> = ({ project }) => {
  const PAGE_TITLE = project?.title;
  const PAGE_DESCRIPTION = project?.description;

  const canonicalUrl = `https://lucas.untethered4life.com/project/${project?.slug}`;
  const incrementViews = async () => { await axios.post(`/api/views?&slug=${project?.slug}&type=project`); };

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') { incrementViews(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <NextSeo
        title={`${project?.title} - Project Lucas Morris`}
        description={project?.description}
        canonical={canonicalUrl}
        openGraph={{
          type: 'article',
          article: { publishedTime: project?.updated_at.toString(), modifiedTime: project?.updated_at.toString(), authors: ['Lucas Morris'] },
          url: canonicalUrl, images: [ { url: project?.image } ], siteName: 'Projects by Lucas Morris' 
        }}
      />
      <Container data-aos='fade-up'>
        <BackButton url='/projects' />
        <PageHeading title={PAGE_TITLE} description={PAGE_DESCRIPTION} />
        <ProjectDetail {...project} />
      </Container>
    </>
  );
};

export default ProjectsDetailPage;

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const response = await prisma.projects.findUnique({ where: { slug: String(params?.slug) } });
  
  if (response === null) { return { redirect: { destination: '/404', permanent: false } }; }

  return { props: { project: JSON.parse(JSON.stringify(response)) } };
};
