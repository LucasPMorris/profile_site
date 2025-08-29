import useSWR from 'swr';
import { fetcher } from '@/services/fetcher';
import { useState } from 'react';
import { HiOutlineClipboardCopy as CopyIcon, HiCheckCircle as CheckIcon, HiEye as PreviewIcon } from 'react-icons/hi';
import { Popover, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Card from './Card';
import clsx from 'clsx';
import { useTheme } from 'next-themes';

const ImagePreviewPopover = ({ url }: { url: string }) => (
    <Popover className="relative">
      <Popover.Button className='right-3 top-3 rounded-lg p-2 border border-neutral-400 dark:border-neutral-600 hover:text-neutral-200 hover:bg-[rgba(106,106,128)] dark:hover:bg-neutral-800' title='View Image'>
        <PreviewIcon size={18} />
      </Popover.Button>
      <Transition as={Fragment}
        enter="transition ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95" >
        <Popover.Panel className="absolute z-10 mt-2 w-64">
          <img src={url} alt="Preview" className="rounded shadow-lg w-full h-auto" />
        </Popover.Panel>
      </Transition>
    </Popover>
);

const ImageBrowser = () => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const { data, error } = useSWR('/api/images', fetcher);

  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === 'dark' || resolvedTheme === 'system';

  if (error) return <div>Error loading images</div>;
  if (!data) return <div>Loading images...</div>;

  const handlePreviewPopover = (url: string) => {

  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000); // Clear after 2s
    } catch (err) { console.error('Failed to copy:', err); }
  };

  return (
    <Card className="p-3 space-y-2">        
        {data.images.map((url: string) => (
          <li key={url} className='flex items-start gap-3 px-4 py-2 my-2 rounded-lg
             bg-white/60 dark:bg-[rgba(255,255,255,0.05)]
             border border-neutral-400 dark:border-neutral-700
             hover:bg-white/70 dark:hover:bg-[rgba(255,255,255,0.1)]'>
            <ImagePreviewPopover url={url} />  
            <button onClick={() => handleCopy(url)} className='rounded-lg border border-neutral-400 dark:border-neutral-600 p-2 hover:text-neutral-200 hover:bg-[rgba(106,106,128)] dark:hover:bg-neutral-800' title='Copy URL'>
              {(copiedUrl === url) ? (<CheckIcon size={18} className='text-green-600' />) : (<CopyIcon size={18} className={clsx(isDarkTheme ? 'text-neutral-400' : '')} />)}
            </button>
            <div className="px-4 py-2">{url.slice(8, url.length)}</div>
          </li>
        ))}
    </Card>
  );
};

export default ImageBrowser;