import useSWR from 'swr';
import { fetcher } from '@/services/fetcher';
import { useState } from 'react';
import { HiOutlineClipboardCopy as CopyIcon, HiCheckCircle as CheckIcon, HiEye as PreviewIcon } from 'react-icons/hi';
import { Popover, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Card from './Card';

const ImagePreviewPopover = ({ url }: { url: string }) => (
    <Popover className="relative">
      <Popover.Button className='right-3 top-3 rounded-lg border border-neutral-700 p-2 hover:bg-neutral-800' title='Copy URL'>
        <PreviewIcon size={18} className='text-neutral-400' />
      </Popover.Button>
      <Transition as={Fragment}
        enter="transition ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95" >
        <Popover.Panel className="absolute z-10 mt-2 w-64">
          <img src={url} alt="Preview" className="rounded shadow-lg border w-full h-auto" />
        </Popover.Panel>
      </Transition>
    </Popover>
);

const ImageBrowser = () => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const { data, error } = useSWR('/api/images', fetcher);

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
    <Card className="p-6">        
        {data.images.map((url: string) => (
          <li key={url} className="flex items-start gap-3 px-4 py-2 my-2 rounded-lg bg-neutral-900 border border-neutral-700 hover:bg-neutral-800">
            <ImagePreviewPopover url={url} />  
            <button onClick={() => handleCopy(url)} className='right-3 top-3 rounded-lg border border-neutral-700 p-2 hover:bg-neutral-800' title='Copy URL'>
              {(copiedUrl === url) ? (<CheckIcon size={18} className='text-green-600' />) : (<CopyIcon size={18} className='text-neutral-400' />)}
            </button>
            <div className="px-4 py-2">{url.slice(8, url.length)}</div>
          </li>
        ))}
    </Card>
  );
};

export default ImageBrowser;