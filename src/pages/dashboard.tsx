import { GetStaticProps, NextPage } from 'next';
import { NextSeo } from 'next-seo';
import { SWRConfig } from 'swr';

import Container from '@/common/components/elements/Container';
import PageHeading from '@/common/components/elements/PageHeading';
import Dashboard from '@/modules/dashboard';
import { getGithubUser } from '@/services/github';

interface DashboardPageProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fallback: any;
}

const PAGE_TITLE = 'Dashboard';
const PAGE_DESCRIPTION =
  'A personal Spotify and Programming Dashboard';

const DashboardPage: NextPage<DashboardPageProps> = ({ fallback }) => {
  // Add Toaster for toast notifications
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Toaster } = require('react-hot-toast');
  return (
    <SWRConfig value={{ fallback }}>
      <NextSeo title={`${PAGE_TITLE} - Lucas Morris`} description={PAGE_DESCRIPTION} 
        openGraph={{ images: [{url: '/images/dashboard_1200x628.png', width: 1200, height: 628, alt: 'Spotify Dashboard Preview' } ] }}
      />
      <Container data-aos='fade-up'>
        <Toaster position='top-center' />
        <PageHeading title={PAGE_TITLE} description={PAGE_DESCRIPTION} />
        <Dashboard />
      </Container>
    </SWRConfig>
  );
};

export default DashboardPage;

export const getStaticProps: GetStaticProps = async () => {
  // const readStats = await getReadStats();
  const githubUserPersonal = await getGithubUser('personal');

  return {
    props: {
      fallback: {
        // '/api/read-stats': readStats.data,
        '/api/github?type=personal': githubUserPersonal?.data,
      },
    },
    revalidate: 1,
  };
};
