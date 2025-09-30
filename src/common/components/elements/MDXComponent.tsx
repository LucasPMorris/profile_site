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
  // Remove frontmatter if it exists (content between --- lines)
  let processedContent = children;
  const frontmatterRegex = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;
  if (frontmatterRegex.test(children)) {
    processedContent = children.replace(frontmatterRegex, '').trim();
  }
  
  // Normalize line endings and ensure proper code block separation
  processedContent = processedContent
    .replace(/\r\n/g, '\n') // Convert Windows line endings
    .replace(/\r/g, '\n')   // Convert old Mac line endings
    .replace(/```\n\n```/g, '```\n\n\n```') // Ensure triple newlines between code blocks
    .trim();

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
        p: (props: React.HTMLProps<HTMLParagraphElement>) => <p className="mb-4" {...props} />,
        h1: (props: React.HTMLProps<HTMLHeadingElement>) => {
          const text = typeof props.children === 'string' ? props.children : '';
          const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          return <h1 id={id} className='text-3xl font-semibold dark:text-neutral-300 mb-6 mt-8' {...props} />;
        },
        h2: (props: React.HTMLProps<HTMLHeadingElement>) => {
          const text = typeof props.children === 'string' ? props.children : '';
          const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          return <h2 id={id} className='text-2xl font-medium dark:text-neutral-300 mb-4 mt-8' {...props} />;
        },
        h3: (props: React.HTMLProps<HTMLHeadingElement>) => {
          const text = typeof props.children === 'string' ? props.children : '';
          const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          return <h3 id={id} className='pt-4 text-[18px] font-medium leading-snug dark:text-neutral-300 mb-4 mt-6' {...props} />;
        },
        ul: (props: React.HTMLProps<HTMLUListElement>) => ( <ul className='list-disc space-y-3 pb-2 pl-10' {...props} /> ),
        code: ({ className, children }: { className?: string; children: ReactNode }) => {
          const isBlock = !!className || String(children).includes('\n');
          var header;
          var canCollapse = false;
          var codeContent = String(children);
          
          // Process special directives in order: header, canCollapse, language
          const lines = codeContent.split('\n');
          let lineIndex = 0;
          
          // Check for header (##Header)
          if (lines[lineIndex]?.startsWith('##')) {
            header = lines[lineIndex].replace(/^#+\s*/, '');
            lineIndex++;
          }
          
          // Check for canCollapse (#canCollapse)
          if (lines[lineIndex]?.startsWith('#canCollapse')) {
            canCollapse = true;
            lineIndex++;
          }
          
          // Check for language (#language-xxx)
          if (lines[lineIndex]?.startsWith('#language-')) {
            const lang = lines[lineIndex].replace('#language-', 'language-').trim();
            if (lang && !className) { className = `${lang}`; }
            lineIndex++;
          }
          
          // Remove processed lines from content
          codeContent = lines.slice(lineIndex).join('\n');
          
          return isBlock
            ? (<CodeBlock className={className} header={header || undefined} canCollapse={canCollapse}>{codeContent}</CodeBlock>)
            : (<code className='rounded bg-neutral-400/70 px-1 py-0.5 font-mono text-sm dark:bg-slate-700'>{children}</code>); },
        hr: () => ( <hr className='my-6 border-t-1 border-neutral-700' /> ),
        blockquote: (props: React.HTMLProps<HTMLQuoteElement>) => ( <blockquote className='rounded-br-2xl rounded-tr-2xl items-center border-l-[5px] border-neutral-700 border-l-cyan-500 bg-neutral-200 py-2 pl-6 text-lg font-medium text-cyan-800 dark:bg-neutral-800 dark:text-cyan-200' {...props} /> ),
        table: (props: React.HTMLProps<HTMLTableElement>) => <Table {...props} />,
        th: (props: React.HTMLProps<HTMLTableCellElement>) => ( <th className='border px-3 py-1 text-left dark:border-neutral-600'>{props.children}</th> ),
        td: (props: React.HTMLProps<HTMLTableCellElement>) => ( <td className='border px-3 py-1 dark:border-neutral-600'>{props.children}</td> ),
        img: ({ src = '', alt = '', width, height, className, style }: React.ImgHTMLAttributes<HTMLImageElement>) => {
          // Don't render if src is empty
          if (!src || (typeof src === 'string' && src.trim() === '')) { return null; }

          var fallbackHeight = 1080;
          // If width and height are provided, use them directly
          if (typeof width === 'number' || typeof width === 'string') {
            fallbackHeight = typeof height === 'number' ? height : typeof height === 'string' ? parseInt(height) : 1080;
          }
          const fallbackWidth = typeof width === 'number' ? width : typeof width === 'string' ? parseInt(width) : 1920;

          // Optional: fallback dimensions or styling
          const fallbackStyle = {
            maxWidth: width ? undefined : '90%',
            width: width ? undefined : '90%',
            height: 'auto',
            ...style,
          };
          const fallbackClassName = className ? className : '';

          return (
            <div className="my-6 flex justify-center">
              <Image src={typeof src === 'string' ? src : ''} width={fallbackWidth} height={fallbackHeight} alt={alt} className={fallbackClassName} style={fallbackStyle} />
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
      {processedContent}
    </ReactMarkdown>
  );
};

export default MDXComponent;