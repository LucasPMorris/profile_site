import { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import CodeBlock from './CodeBlock';
import Breakline from './Breakline';

interface MarkdownRendererProps { children: string; }

interface TableProps { children?: ReactNode; }

const Table = ({ children }: TableProps) => (<div className='table-container'><table className='table w-full'>{children}</table></div>);

const MDXComponent = ({ children }: MarkdownRendererProps) => {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw]}
      components={{
        a: (props) => (<a className='cursor-pointer text-teal-500 hover:text-teal-400 hover:underline' {...props} />),
        p: (props) => <div {...props} />,
        h2: (props) => (<h2 className='text-2xl font-medium dark:text-neutral-300' {...props} />),
        h3: (props) => (<h3 className='pt-4 text-[18px] font-medium leading-snug dark:text-neutral-300' {...props} />),
        ul: (props) => (<ul className='list-disc space-y-3 pb-2 pl-10' {...props} />),
        ol: (props) => (<ol className='list-decimal space-y-3 pb-2 pl-10' {...props} />),
        code: ({ className, children }) => {
          const isBlock = !!className || String(children).includes('\n');
          return isBlock
            ? (<CodeBlock className={className}>{children}</CodeBlock>)
            : (<code className='rounded bg-neutral-400/70 px-1 py-0.5 font-mono text-sm dark:bg-neutral-800'>{children}</code>
          );
        },
        hr: () => (<hr className='my-6 border-t-1 border-neutral-700' />),
        blockquote: (props) => (<blockquote className='rounded-br-2xl border-l-[5px] border-neutral-700 border-l-cyan-500 bg-neutral-200 py-3 pl-6 text-lg font-medium text-cyan-800 dark:bg-neutral-800 dark:text-cyan-200' {...props} />),
        table: (props) => <Table {...props} />,
        th: (props) => (<th className='border px-3 py-1 text-left dark:border-neutral-600'>{props.children}</th>),
        td: (props) => (<td className='border px-3 py-1 dark:border-neutral-600'>{props.children}</td>),
        div: (props) => (<div>{props.children}</div>)
      }}
    >
      {children}
    </ReactMarkdown>
  );
};

export default MDXComponent;