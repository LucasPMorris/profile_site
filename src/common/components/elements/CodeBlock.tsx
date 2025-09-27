import dynamic from 'next/dynamic';
import { useEffect, useState, type ComponentPropsWithoutRef } from 'react';
import { HiCheckCircle as CheckIcon, HiOutlineClipboardCopy as CopyIcon, } from 'react-icons/hi';
import { BiSolidChevronUp, BiSolidChevronDown } from 'react-icons/bi';

import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json';
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css';
import diff from 'react-syntax-highlighter/dist/cjs/languages/prism/diff';
import javascript from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript';
import tsx from 'react-syntax-highlighter/dist/cjs/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';
import { a11yDark as themeColor } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useCopyToClipboard } from 'usehooks-ts';
const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

const languages = { javascript: 'javascript', typescript: 'typescript', diff: 'diff', tsx: 'tsx', css: 'css', json: 'json' };

SyntaxHighlighter.registerLanguage(languages.javascript, javascript);
SyntaxHighlighter.registerLanguage(languages.typescript, typescript);
SyntaxHighlighter.registerLanguage(languages.diff, diff);
SyntaxHighlighter.registerLanguage(languages.tsx, tsx);
SyntaxHighlighter.registerLanguage(languages.css, css);
SyntaxHighlighter.registerLanguage(languages.json, json);

// Helper to parse collapsible regions
// New, may remove.
const parseRegions = (code: string) => {
  const lines = code.split('\n');
  const blocks: { title: string; content: string[] }[] = [];
  let current: string[] = [];
  let title = '';
  let inRegion = false;

  for (const line of lines) {
    if (line.includes('// region:')) {
      inRegion = true;
      title = line.split('// region:')[1].trim();
      current = [];
    } else if (line.includes('// endregion')) {
      inRegion = false;
      blocks.push({ title, content: current });
    } else if (inRegion) {
      current.push(line);
    }
  }

  return blocks.length ? blocks : null;
};


const CodeBlock = ({ className = '', children, inline, header, canCollapse, ...props }: ComponentPropsWithoutRef<'code'> & { header?: string, inline?: boolean, canCollapse?: boolean }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [value, copy] = useCopyToClipboard();
  const match = /language-(\w+)/.exec(className || '');

  // New, may remove
  const rawCode = String(children).replace(/\n$/, '');
  const regions = parseRegions(rawCode);

  const handleCopy = (code: string) => {
    copy(code);
    setIsCopied(true);
  };

  useEffect(() => {
    if (isCopied) {
      const timeout = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [isCopied]);

  console.log(header);

  return (
    <>
      {!inline ? (
        <div className='relative rounded-lg bg-[rgb(43,43,43)] border border-neutral-700'>
          <div className={header ? 'flex flex-row justify-between border-b-2 border-cyan-800 dark:border-cyan-200' : ''}>
            {header && <div className='pl-6 py-3 font-sans text-lg font-medium text-cyan-800 dark:text-cyan-200'>{header}</div>}
            {header &&
              <div className='relative flex justify-end gap-2 p-2'>
                <button type='button' aria-label='Copy to Clipboard' onClick={() => handleCopy(rawCode)} className='p-2 rounded border border-neutral-700 hover:bg-neutral-800' >
                  {!isCopied ? ( <CopyIcon size={18} className='text-neutral-400' /> ) : ( <CheckIcon size={18} className='text-green-500' /> )}
                </button>
                {canCollapse && (
                  <button type='button' onClick={() => setCollapsed(!collapsed)} className='p-2 rounded border border-neutral-700 hover:bg-neutral-800' >
                    {collapsed ? ( <BiSolidChevronDown size={18} className='text-neutral-400' /> ) : ( <BiSolidChevronUp size={18} className='text-neutral-400' /> )}
                  </button>
                )}
              </div>
            }
          </div>
          <div className={`${collapsed ? 'hidden' : 'block'} relative`}>
            {!header && (
              <button type='button' aria-label='Copy to Clipboard' onClick={() => handleCopy(rawCode)} className='absolute top-2 right-2 p-2 rounded border border-neutral-700 hover:bg-neutral-800 z-10' >
                {!isCopied ? ( <CopyIcon size={18} className='text-neutral-400' /> ) : ( <CheckIcon size={18} className='text-green-500' /> )}
              </button>                  
            )}
            { match && className === 'language-json'
              ? ( <ReactJson src={JSON.parse(String(children).replace(/\n$/, ''))} collapsed={1} name={false} enableClipboard={false} displayDataTypes={false} displayObjectSize={false} theme='monokai' style={{ backgroundColor: 'transparent', fontSize: '14px', padding: '20px', borderRadius: '8px' }} /> )
              : ( 
                <SyntaxHighlighter
                  {...props} style={themeColor} showLineNumbers={true} customStyle={{ padding: '15px', fontSize: '14px', borderRadius: '8px', paddingRight: '50px' }} PreTag='div' language={match ? match[1] : 'javascript'} wrapLongLines>              
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter> )
            }
          </div>
        </div>
      ) : (
        <code className='rounded-md bg-neutral-200 px-2 py-1 text-[14px] font-light text-sky-600 dark:bg-neutral-700 dark:text-sky-300'>
          {children}
        </code>
      )}
    </>
  );
};

const LoadingPlaceholder = () => <div className='mb-12 mt-12 h-36 w-full' />;

export default dynamic(() => Promise.resolve(CodeBlock), { ssr: false, loading: LoadingPlaceholder });