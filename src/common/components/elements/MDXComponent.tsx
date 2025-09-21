import { ReactNode, createElement } from 'react';
import Image from 'next/image';
import ReactMarkdown, { Components } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import CodeBlock from './CodeBlock';
import SvgScroll from './SvgScroll'
import TestItOut from '../../../modules/snippets/components/TestItOut';
import CallOut from './CallOut';

interface MarkdownRendererProps { children: string; }
interface TableProps { children?: ReactNode; }

const Table = ({ children }: TableProps) => (
  <div className='table-container'>
    <table className='table w-full'>{children}</table>
  </div>
);

interface ExtendedComponents extends Components { TestItOut?: React.ComponentType<any>; }

const MDXComponent = ({ children }: MarkdownRendererProps) => {
  const decodeCode = (code: string, mode: string = 'javascript') => {
    if (!code) return code;

    let decodedCode = code
      .replace(/%2F/g, "/")
      .replace(/%47/g, "/")
      .replace(/&#47;/g, "/")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\');

    if (mode === 'javascript') {
      decodedCode = decodedCode
        .replace(/; /g, ";\n")        
        .replace(/\/\/ /g, "\n// ");
    } else if (mode === 'css') {
      decodedCode = decodedCode
        .replace(/}\s*/g, "}\n\n")
        .replace(/;\s*([a-zA-Z-])/g, ";\n  $1")
        .replace(/\{\s*/g, " {\n  ")
        .replace(/\/\*\s*/g, "\n/* ")
        .replace(/\s*\*\//g, " */\n")
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        .trim();
    } else if (mode === 'html') {
      decodedCode = decodedCode
        .replace(/>\s*</g, ">\n<")
        .replace(/\/\*\s*/g, "\n/* ")
        .replace(/\s*\*\//g, " */\n");
    } else if (mode === 'markdown') { decodedCode = decodedCode.trim(); }

    return decodedCode;
  };

  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw]}
      components={{
        a: (props: React.HTMLProps<HTMLAnchorElement>) => ( <a className='cursor-pointer text-teal-500 hover:text-teal-400 hover:underline' {...props} /> ),
        p: (props: React.HTMLProps<HTMLDivElement>) => <div {...props} />,
        h1: (props: React.HTMLProps<HTMLHeadingElement>) => ( <h1 className='text-3xl font-semibold dark:text-neutral-300' {...props} /> ),
        h2: (props: React.HTMLProps<HTMLHeadingElement>) => ( <h2 className='text-2xl font-medium dark:text-neutral-300' {...props} /> ),
        h3: (props: React.HTMLProps<HTMLHeadingElement>) => ( <h3 className='pt-4 text-[18px] font-medium leading-snug dark:text-neutral-300' {...props} /> ),
        ul: (props: React.HTMLProps<HTMLUListElement>) => ( <ul className='list-disc space-y-3 pb-2 pl-10' {...props} /> ),
        code: ({ className, children }: { className?: string; children: ReactNode }) => {
          const isBlock = !!className || String(children).includes('\n');
          var header;
          var canCollapse = false;
          var codeContent = String(children);
          const headerLine = codeContent.split('\n')[0];
          if (headerLine.startsWith('##')) {
            codeContent = codeContent.split('\n').slice(1).join('\n');
            header = headerLine.replace(/^#+\s*/, '');
          }
          const canCollapseLine = codeContent.split('\n')[0];
          if (canCollapseLine.startsWith('#canCollapse')) {
            canCollapse = true;
            codeContent = codeContent.split('\n').slice(1).join('\n');
          }
          const languageLine = codeContent.split('\n')[0];
          if (languageLine.startsWith('#language-')) {
            const lang = languageLine.replace('#language-', 'language-').trim();
            if (lang && !className) { className = `${lang}`; }
            codeContent = codeContent.split('\n').slice(1).join('\n');
          }
          return isBlock
            ? (<CodeBlock className={className} header={header || undefined} canCollapse={canCollapse}>{codeContent}</CodeBlock>)
            : (<code className='rounded bg-neutral-400/70 px-1 py-0.5 font-mono text-sm dark:bg-neutral-800'>{children}</code>); },
        hr: () => ( <hr className='my-6 border-t-1 border-neutral-700' /> ),
        blockquote: (props: React.HTMLProps<HTMLQuoteElement>) => ( <blockquote className='rounded-br-2xl border-l-[5px] border-neutral-700 border-l-cyan-500 bg-neutral-200 py-3 pl-6 text-lg font-medium text-cyan-800 dark:bg-neutral-800 dark:text-cyan-200' {...props} /> ),
        table: (props: React.HTMLProps<HTMLTableElement>) => <Table {...props} />,
        th: (props: React.HTMLProps<HTMLTableCellElement>) => ( <th className='border px-3 py-1 text-left dark:border-neutral-600'>{props.children}</th> ),
        td: (props: React.HTMLProps<HTMLTableCellElement>) => ( <td className='border px-3 py-1 dark:border-neutral-600'>{props.children}</td> ),
        img: ({ src = '', alt = '', width, height, className, style }: React.ImgHTMLAttributes<HTMLImageElement>) => {
          // Optional: fallback dimensions or styling
          const fallbackWidth = width ? parseInt(width as string) : 800;
          const fallbackHeight = height ? parseInt(height as string) : 600;
          const fallbackStyle = style ? style : { maxWidth: '100%', height: 'auto' };
          const fallbackClassName = className ? className : "rounded-lg shadow-md";

          return (
            <div className="my-6 flex justify-center">
              <Image src={typeof src === 'string' ? src : ''} alt={alt} width={fallbackWidth} height={fallbackHeight} className={fallbackClassName} style={fallbackStyle} />
            </div>
          );
        },
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
            const html = props['data-html']; 
            const mode = props['data-mode'] || 'javascript'; 

            const decodedCode = decodeCode(code, mode);
            const decodedHtml = html ? decodeCode(html, 'html') : undefined;

            return <TestItOut title={title} snippetId={snippetId} code={decodedCode} html={decodedHtml || ''} description={description} mode={mode}/>;
          }

          if (props['data-component'] === 'CallOut') {
            if (typeof window === 'undefined') {
              return (
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded-lg p-4">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
                </div>
              );
            }
            
            return <CallOut header={props['data-header']} children={props.children}/>;
          }

          if (props['data-component'] === 'SvgScroll') {
            if (typeof window === 'undefined') {
              return (
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-[400px] rounded-lg p-4">
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-4"></div>
                  <div className="h-full bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              );
            }
            const src = props['data-src'] || '';
            const width = props['data-width'] ? parseInt(props['data-width']) : undefined;
            const height = props['data-height'] ? parseInt(props['data-height']) : undefined;
            const initialScale = props['data-initial-scale'] ? parseFloat(props['data-initial-scale']) : undefined;
            return <SvgScroll src={src} width={width} height={height} initialScale={initialScale} />;            
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