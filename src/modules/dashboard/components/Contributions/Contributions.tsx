import Link from 'next/link';
import { BsGithub as GithubIcon } from 'react-icons/bs';
import useSWR from 'swr';

import SectionHeading from '@/common/components/elements/SectionHeading';
import SectionSubHeading from '@/common/components/elements/SectionSubHeading';
import { fetcher } from '@/services/fetcher';

import Calendar from './Calendar';
import Overview from './Overview';
import Card from '@/common/components/elements/Card';

type ContributionsProps = {
  username: string;
  type: string;
  endpoint: string;
};

const Contributions = ({ username, endpoint }: ContributionsProps) => {
  const { data } = useSWR(endpoint, fetcher);

  const contributionCalendar = data?.contributionsCollection?.contributionCalendar;

  return (
    <section className='flex flex-col gap-y-2'>
      <SectionHeading title='Contributions' icon={<GithubIcon className='mr-1' />} />
      <SectionSubHeading>
        <p className='dark:text-neutral-400'>My contributions from last year on github.</p>
        <Link href={`https://github.com/${username}`} target='_blank' passHref
          className='font-code text-sm text-neutral-600 hover:text-neutral-700 dark:text-neutral-400 hover:dark:text-neutral-400'
        >
          @{username}
        </Link>
      </SectionSubHeading>

      {!data && <div className='dark:text-neutral-400'>No Data</div>}

      {data && (
          <div className='space-y-3'>
            <Overview data={contributionCalendar} />
            <Card className='p-4 border border-neutral-400 bg-neutral-100 dark:border-neutral-900 rounded-lg'>
              <Calendar data={contributionCalendar} />
            </Card>
          </div>
      )}
    </section>
  );
};

export default Contributions;
