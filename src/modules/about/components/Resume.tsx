import Link from 'next/link';
import { LuDownload as DownloadIcon } from 'react-icons/lu';

import GoogleDocsEmbed from '@/common/components/elements/GoogleDocsEmbed';

const Resume = () => {
  const RESUME_URL = 'https://drive.google.com/file/d/1ubqPB5byKm9YHT2r3aiLb4Soi5YTei93/view?usp=sharing';
  const EMBED_URL = 'https://drive.google.com/file/d/1ubqPB5byKm9YHT2r3aiLb4Soi5YTei93/preview';

  return (
    <div className='space-y-5'>
      <Link
          href={RESUME_URL} target='_blank' passHref
          className='flex w-fit items-center gap-2 rounded-lg border border-neutral-700 px-4 py-2.5 text-sm text-neutral-700 transition-all duration-300 hover:gap-3 hover:border-neutral-500 hover:text-neutral-700
                    dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-400 hover:dark:border-neutral-300 hover:dark:text-neutral-300' /*data-umami-event='Download Resume'*/
      >
        <DownloadIcon />
        <span>Download Resume & Template</span>
      </Link>

      <GoogleDocsEmbed src={EMBED_URL} />
    </div>
  );
};

export default Resume;
