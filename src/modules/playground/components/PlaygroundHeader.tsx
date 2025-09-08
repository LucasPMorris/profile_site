import { SiJavascript, SiCss3, SiHtml5, SiMarkdown } from 'react-icons/si'; import { PlaygroundMode } from './CodePlayground';

interface PlaygroundHeaderProps { mode?: PlaygroundMode; }

const PlaygroundHeader = ({ mode = 'javascript' }: PlaygroundHeaderProps) => {
  const getHeaderConfig = () => {
    switch (mode) {
      case 'javascript': return { icon: <SiJavascript size={24} className='text-yellow-400' />, title: 'JavaScript Playground', description: 'A no-fuss pure JavaScript playground with console feedback' };
      case 'css': return { icon: <SiCss3 size={24} className='text-blue-400' />, title: 'CSS Playground', description: 'Write CSS and see live changes with HTML preview' };
      case 'html': return { icon: <SiHtml5 size={24} className='text-orange-500' />, title: 'HTML Playground', description: 'Create and preview HTML documents with embedded styles' };
      case 'markdown': return { icon: <SiMarkdown size={24} className='text-gray-600' />, title: 'Markdown Playground', description: 'Write markdown with live preview rendering' };
      default: return { icon: <SiJavascript size={24} className='text-yellow-400' />, title: 'Code Playground', description: 'Interactive code playground' };
    }
  };

  const config = getHeaderConfig();

  return (
    <div className='flex flex-col space-y-2 py-10 md:items-center md:justify-center'>
      <div className='flex items-center gap-3'> {config.icon}<h1 className='text-2xl font-medium'>{config.title}</h1></div>
      <p className='text-neutral-600 dark:text-neutral-400'>{config.description}</p>
    </div>
  );
};

export default PlaygroundHeader;