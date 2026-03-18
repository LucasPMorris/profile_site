import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface RawMDComponentProps { children: string; }

const RawMDComponent = ({ children }: RawMDComponentProps) => {
  let content = children;

  // Strip frontmatter if present
  const fmRegex = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;
  if (fmRegex.test(content)) {
    content = content.replace(fmRegex, '').trim();
  }

  // Normalize line endings
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  return (
    <div className='raw-md rounded-xl border px-8 py-6 border-orange-200/60 bg-[#fef6f0] dark:border-neutral-700 dark:bg-[#1e1e1e]'>
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default RawMDComponent;
