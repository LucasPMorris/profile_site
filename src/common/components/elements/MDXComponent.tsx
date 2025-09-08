import { ReactNode, createElement } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import CodeBlock from './CodeBlock';
import Breakline from './Breakline';
import TestItOut from '../../../modules/snippets/components/TestItOut';

interface MarkdownRendererProps { 
  children: string; 
}

interface TableProps { 
  children?: ReactNode; 
}

const Table = ({ children }: TableProps) => (
  <div className='table-container'>
    <table className='table w-full'>{children}</table>
  </div>
);

interface ExtendedComponents extends Components { TestItOut?: React.ComponentType<any>; }

const MDXComponent = ({ children }: MarkdownRendererProps) => {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw]}
      components={{
        a: (props: React.HTMLProps<HTMLAnchorElement>) => ( <a className='cursor-pointer text-teal-500 hover:text-teal-400 hover:underline' {...props} /> ),
        p: (props: React.HTMLProps<HTMLDivElement>) => <div {...props} />,
        h2: (props: React.HTMLProps<HTMLHeadingElement>) => ( <h2 className='text-2xl font-medium dark:text-neutral-300' {...props} /> ),
        h3: (props: React.HTMLProps<HTMLHeadingElement>) => ( <h3 className='pt-4 text-[18px] font-medium leading-snug dark:text-neutral-300' {...props} /> ),
        ul: (props: React.HTMLProps<HTMLUListElement>) => ( <ul className='list-disc space-y-3 pb-2 pl-10' {...props} /> ),
        code: ({ className, children }: { className?: string; children: ReactNode }) => {
          const isBlock = !!className || String(children).includes('\n');
          return isBlock
            ? (<CodeBlock className={className}>{children}</CodeBlock>)
            : (<code className='rounded bg-neutral-400/70 px-1 py-0.5 font-mono text-sm dark:bg-neutral-800'>{children}</code>); },
        hr: () => ( <hr className='my-6 border-t-1 border-neutral-700' /> ),
        blockquote: (props: React.HTMLProps<HTMLQuoteElement>) => ( <blockquote className='rounded-br-2xl border-l-[5px] border-neutral-700 border-l-cyan-500 bg-neutral-200 py-3 pl-6 text-lg font-medium text-cyan-800 dark:bg-neutral-800 dark:text-cyan-200' {...props} /> ),
        table: (props: React.HTMLProps<HTMLTableElement>) => <Table {...props} />,
        th: (props: React.HTMLProps<HTMLTableCellElement>) => ( <th className='border px-3 py-1 text-left dark:border-neutral-600'>{props.children}</th> ),
        td: (props: React.HTMLProps<HTMLTableCellElement>) => ( <td className='border px-3 py-1 dark:border-neutral-600'>{props.children}</td> ),
        div: (props: any) => {
          if (props['data-component'] === 'TestItOut') {
            if (typeof window === 'undefined') {
              return (
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded-lg p-4">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
                </div>
              );
            }

            const title = props['data-title'];
            const description = props['data-description'];
            const snippetId = props['data-snippet-id'];
            const code = props['data-code'];

            const decodedCode = code
              ?.replace(/%2F/g, "/")
              ?.replace(/%47/g, "/")
              ?.replace(/&#47;/g, "/")
              ?.replace(/; /g, ";\n")        
              ?.replace(/\/\/ /g, "\n// ")                
              ?.replace(/&quot;/g, '"')
              ?.replace(/&#x27;/g, "'")
              ?.replace(/&lt;/g, '<')
              ?.replace(/&gt;/g, '>')
              ?.replace(/&amp;/g, '&')
              ?.replace(/\\n/g, '\n')
              ?.replace(/\\t/g, '\t')
              ?.replace(/\\\\/g, '\\')

            return <TestItOut title={title} snippetId={snippetId} code={decodedCode} description={description} />;
          }

          return <div {...props} />;
        },
      } as ExtendedComponents}
    >
      {children}
    </ReactMarkdown>
  );
};

export default MDXComponent;