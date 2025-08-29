import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SiWakatime as WakatimeIcon } from 'react-icons/si';
import useSWR from 'swr';

import SectionHeading from '@/common/components/elements/SectionHeading';
import SectionSubHeading from '@/common/components/elements/SectionSubHeading';
import { fetcher } from '@/services/fetcher';

import Overview from './HikingOverview';

const HikingStats = () => {
  return (
    <section className='flex flex-col gap-y-2'>
      <SectionHeading title='' icon={<WakatimeIcon className='mr-1' />} />
      <SectionSubHeading>Hello</SectionSubHeading>
    </section>
  )
};

export default HikingStats;