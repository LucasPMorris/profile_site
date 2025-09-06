import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BsEye as Eye, BsEyeSlash as EyeOff, BsCode as Code, BsTypeH1 as Heading1, BsTypeH2 as Heading2, BsTypeH3 as Heading3, BsListUl as List, BsListOl as ListOrdered, BsBlockquoteLeft as Quote,
  BsLink45Deg as Link, BsImage as Image, BsTable as Table, BsSave as Save, BsUpload as Upload, BsArrowsAngleContract as Minimize, BsArrowsAngleExpand as Maximize, BsMouse as Mouse, BsPencil as Edit3
} from 'react-icons/bs';
import MDXComponent from '@/common/components/elements/MDXComponent';
import content from '@/pages/api/content';

function useIsMounted() {
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true; 
    return () => { isMounted.current = false; }
  }, []);
  return useCallback(() => isMounted.current, []);
}

// Enhanced MDXComponent with visual editing capabilities
interface MDXPreviewProps { content: string; isVisualMode: boolean; onContentChange: (newContent: string) => void;
}
 
const MDXPreview: React.FC<MDXPreviewProps> = ({ content, isVisualMode, onContentChange }) => {

  const isMounted = useIsMounted();
  const [dragState, setDragState] = useState({ isDragging: false, startX: 0, startWidth: 50 });

  const handleColumnResize = useCallback((newFirstWidth: number) => {
    if (!isMounted() || !onContentChange) return;
    
    const secondWidth = 100 - newFirstWidth;
    
    // Map percentages to Tailwind classes
    const getWidthClass = (percentage: number) => {
      if (percentage <= 25) return 'w-1/4';
      if (percentage <= 33) return 'w-1/3';
      if (percentage <= 40) return 'w-2/5';
      if (percentage <= 50) return 'w-1/2';
      if (percentage <= 60) return 'w-3/5';
      if (percentage <= 67) return 'w-2/3';
      if (percentage <= 75) return 'w-3/4';
      if (percentage <= 80) return 'w-4/5';
      return 'w-full';
    };

    const firstClass = getWidthClass(newFirstWidth);
    const secondClass = getWidthClass(secondWidth);

    // Update the content by replacing the width classes
    let updatedContent = content;
    const regex = /class="w-\d+\/\d+"/g;
    const matches = updatedContent.match(regex);
    
    if (matches && matches.length >= 2) {
      // Replace first occurrence
      updatedContent = updatedContent.replace(regex, `class="${firstClass}"`);
      // Replace second occurrence  
      updatedContent = updatedContent.replace(regex, `class="${secondClass}"`);
      
      onContentChange(updatedContent);
    }
  }, [content, onContentChange, isMounted]);

  const ResizableColumn: React.FC<{ children: React.ReactNode; width: number; isFirst: boolean }> = ({ children, width, isFirst }) => {
    const columnRef = useRef(null);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (!isVisualMode || !isMounted()) return;
      
      e.preventDefault();
      setDragState({ isDragging: true, startX: e.clientX, startWidth: width });
      
      if (typeof document !== 'undefined') {
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      }
    }, [isVisualMode, width]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
      if (!dragState.isDragging || !isVisualMode || !isMounted()) return;
      
      const container = document.querySelector('.resize-container');
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const deltaX = e.clientX - dragState.startX;
      const containerWidth = containerRect.width;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.min(Math.max(dragState.startWidth + deltaPercent, 20), 80);
      
      handleColumnResize(newWidth);
    }, [dragState, isVisualMode, handleColumnResize]);

    const handleMouseUp = useCallback(() => {
      setDragState({ isDragging: false, startX: 0, startWidth: 50 });
      if (typeof document !== 'undefined') {
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    }, []);

    useEffect(() => {
      if (dragState.isDragging && typeof document !== 'undefined') {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

    const getWidthClass = (percentage: number) => {
      if (percentage <= 25) return 'w-1/4';
      if (percentage <= 33) return 'w-1/3';
      if (percentage <= 40) return 'w-2/5';
      if (percentage <= 50) return 'w-1/2';
      if (percentage <= 60) return 'w-3/5';
      if (percentage <= 67) return 'w-2/3';
      if (percentage <= 75) return 'w-3/4';
      return 'w-full';
    };

    return (
      <div 
        ref={columnRef}
        className={`relative ${getWidthClass(width)} ${isVisualMode && isMounted() ? 'hover:ring-2 hover:ring-blue-300 transition-all' : ''}`}
      >
        {/* Render children as React components, not HTML */}
        {typeof children === 'string' 
          ? (<div dangerouslySetInnerHTML={{ __html: children }} /> )
          : (<div>{children}</div>)}
          {isVisualMode && !isFirst && isMounted() && (
          <div
            className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500 cursor-col-resize opacity-50 hover:opacity-100 -ml-1 z-10 flex items-center justify-center transition-opacity"
            onMouseDown={handleMouseDown}
            title="Drag to resize columns"
          >
            <div className="w-0.5 h-8 bg-white rounded shadow"></div>
          </div>
        )}
      </div>
    );
  };

  const parseAndRenderContent = useCallback((content: string) => { if (!isMounted()) { return <MDXComponent>{content}</MDXComponent>; }

    // Enhanced parsing to detect two-column layouts
    if (content.includes('class="w-') && content.includes('</div>') && isVisualMode) {
      // More robust regex to capture the flex container and columns
      const flexDivRegex = /<div class="flex[^"]*"[^>]*>([\s\S]*?)<div class="w-\d+\/\d+"[^>]*>([\s\S]*?)<\/div>([\s\S]*?)<div class="w-\d+\/\d+"[^>]*>([\s\S]*?)<\/div>([\s\S]*?)<\/div>/;
      const match = content.match(flexDivRegex);
      
      if (match) {
        const [fullMatch, beforeFirstCol, firstColumn, betweenCols, secondColumn, afterSecondCol] = match;
        const beforeFlex = content.substring(0, content.indexOf(fullMatch));
        const afterFlex = content.substring(content.indexOf(fullMatch) + fullMatch.length);

        return (
          <div>
            {beforeFlex && <MDXComponent>{beforeFlex}</MDXComponent>}
            <div className="flex gap-4 resize-container">
              <ResizableColumn width={50} isFirst={true}>{firstColumn}</ResizableColumn>
              <ResizableColumn width={50} isFirst={false}>{secondColumn}</ResizableColumn>
            </div>
            {afterFlex && <MDXComponent>{afterFlex}</MDXComponent>}
          </div>
        );
      }
    }

    // Use your actual MDXComponent for normal rendering
    return <MDXComponent>{content}</MDXComponent>;
  }, [isVisualMode, isMounted]);

  return (
    <div className="space-y-6 leading-[1.8] dark:text-neutral-300">
      {isVisualMode && isMounted() && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <Mouse className="w-4 h-4" />
            <strong>Visual editing mode:</strong> Hover over elements to see controls, drag the blue column dividers to resize
          </div>
        </div>
      )}
      {parseAndRenderContent(content)}
    </div>
  );
};

const MDXEditor = () => {
  const [content, setContent] = useState(`# Welcome to MDX Editor

This is a **live preview** MDX editor with visual editing capabilities!

<div class="flex gap-4">
<div class="w-1/2"><div class="pb-5 pt-5"><p>Throughout life, we experience what many have coined as "chapters"—distinct segments where:</p></div><div class="ml-2 pb-2"><ul><li><em>one's course shifts</em></li><li><em>the tint of the glasses through which one perceives the world deepens or fades</em></li><li><em>or the circuitry within one's mind gets rewired.</em></li></ul></div><p>These chapters are often marked by major events: some positive, some painful; some planned, others entirely unexpected. But all of them, in their own way, signal transformation.</p></div>
<div class="w-1/2"><div class="pb-2 relative"><img width="500" class="z-10 object-contain rounded-lg shadow-lg" src="https://lucas.untethered4life.com/images/blogid1_chapters.png" alt="Chapters Image"/></div></div>
</div>

## Visual Editing Features

- **Column Resizing**: Click the visual mode button and drag the blue divider between columns
- **Live Preview**: See changes instantly as you edit
- **Code Sync**: Visual changes update the MDX code automatically

### Try It Out

Switch to visual mode using the button in the header, then drag the column divider to resize the text and image sections!

You can write *italic text*, **bold text**, and even \`inline code\`.

> This is a blockquote that will be styled according to your theme.`);

  const [metadata, setMetadata] = useState({ title: '', slug: '', featuredImageUrl: '', sticky: false, tags: '', excerpt: '' });

  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [savedStatus, setSavedStatus] = useState('');
  const [isVisualMode, setIsVisualMode] = useState(false);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = setTimeout(() => {
      setSavedStatus('Auto-saved');
      setTimeout(() => setSavedStatus(''), 2000);
    }, 3000);

    return () => clearTimeout(autoSave);
  }, [content, metadata]);

  const insertMarkdown = useCallback((before: string, after: string = '') => {
    const textarea = document.getElementById('mdx-editor');
    if (!textarea) return;
    
    const start = (textarea as HTMLTextAreaElement).selectionStart;
    const end = (textarea as HTMLTextAreaElement).selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
    setContent(newContent);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      (textarea as HTMLTextAreaElement).setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  }, [content]);

  const toolbarItems = [
    { icon: Heading1, action: () => insertMarkdown('# '), title: 'Heading 1' },
    { icon: Heading2, action: () => insertMarkdown('## '), title: 'Heading 2' },
    { icon: Heading3, action: () => insertMarkdown('### '), title: 'Heading 3' },
    { icon: List, action: () => insertMarkdown('- '), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertMarkdown('1. '), title: 'Numbered List' },
    { icon: Quote, action: () => insertMarkdown('> '), title: 'Blockquote' },
    { icon: Code, action: () => insertMarkdown('```\n', '\n```'), title: 'Code Block' },
    { icon: Link, action: () => insertMarkdown('[', '](url)'), title: 'Link' },
    { icon: Image, action: () => insertMarkdown('![alt](', ')'), title: 'Image' },
    { icon: Table, action: () => insertMarkdown('| Header | Header |\n|--------|--------|\n| Cell   | Cell   |'), title: 'Table' },
  ];

  const handleSave = async () => {
    try {
      setSavedStatus('Saving...');
      
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: metadata.title, slug: metadata.slug,
          contentMarkdown: content, featuredImageUrl: metadata.featuredImageUrl,
          sticky: metadata.sticky, tags: metadata.tags, excerpt: metadata.excerpt})
      });

      if (response.ok) {
        setSavedStatus('Saved successfully!');
        setTimeout(() => setSavedStatus(''), 3000);
      } else { setSavedStatus('Save failed'); }
    
    } catch (error) {
      setSavedStatus('Save failed');
      console.error('Save error:', error);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-neutral-900' : ''} flex flex-col h-screen`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        <h1 className="text-xl font-semibold dark:text-white">MDX Content Editor</h1>
        <div className="flex items-center gap-2">
          {/* TODO-Pending:This waas to the admin route and creating temporary posts over and over again. May use but disabling for now. */}
          {/* {savedStatus && (
            <span className={`text-sm px-2 py-1 rounded ${
              savedStatus.includes('Saving') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              savedStatus.includes('success') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {savedStatus}
            </span>
          )} */}
          <button
            onClick={() => setIsVisualMode(!isVisualMode)}
            className={`p-2 rounded transition-colors ${
              isVisualMode 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600'
            }`}
            title={isVisualMode ? 'Switch to Code Mode' : 'Switch to Visual Mode'}
          >
            {isVisualMode ? <Code /> : <Edit3 />}
          </button>
          <button onClick={() => setIsPreviewVisible(!isPreviewVisible)} className="p-2 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors" title={isPreviewVisible ? 'Hide Preview' : 'Show Preview'} >
            {isPreviewVisible ? <EyeOff /> : <Eye />}
          </button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors" title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'} >
            {isFullscreen ? <Minimize /> : <Maximize />}
          </button>
          {/* TODO-Pending: Will verify this save function at some point, disabled alongside the "auto-save" feature for now */}
          {/* <button onClick={handleSave}className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" >
            <Save />Save Post
          </button> */}
        </div>
      </div>

      {/* Metadata Form */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="text" placeholder="Post Title" value={metadata.title} onChange={(e) => setMetadata({...metadata, title: e.target.value})} className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 dark:text-white" />
          <input type="text" placeholder="Slug" value={metadata.slug} onChange={(e) => setMetadata({...metadata, slug: e.target.value})} className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 dark:text-white" />
          <input type="text" placeholder="Featured Image URL" value={metadata.featuredImageUrl} onChange={(e) => setMetadata({...metadata, featuredImageUrl: e.target.value})} className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 dark:text-white" />
        </div>
        <div className="flex items-center gap-4 mt-3">
          <label className="flex items-center gap-2 text-sm dark:text-neutral-300">
            <input type="checkbox" checked={metadata.sticky} onChange={(e) => setMetadata({...metadata, sticky: e.target.checked})} className="rounded" />Sticky Post
          </label>
          <input type="text" placeholder="Tags (comma separated)" value={metadata.tags} onChange={(e) => setMetadata({...metadata, tags: e.target.value})} className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 dark:text-white" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-x-auto">
        {toolbarItems.map((item, index) => (
          <button key={index} onClick={item.action} className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors" title={item.title} >
            <item.icon className="w-4 h-4 dark:text-neutral-300" />
          </button>
        ))}
      </div>

      {/* Editor and Preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className={`${isPreviewVisible ? 'w-1/2' : 'w-full'} flex flex-col border-r border-neutral-200 dark:border-neutral-700`}>
          <div className="flex-1 relative">
            <textarea
              id="mdx-editor"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full p-4 border-none outline-none resize-none bg-white dark:bg-neutral-900 dark:text-white font-mono text-sm leading-relaxed"
              placeholder="Start writing your MDX content..."
              spellCheck="false"
            />
          </div>
        </div>

        {/* Preview */}
        {isPreviewVisible && (
          <div className="w-1/2 flex flex-col">
            <div className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
              <span className="text-sm font-medium dark:text-neutral-300">
                Live Preview {isVisualMode && <span className="text-blue-600">(Visual Mode)</span>}
              </span>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-neutral-50 dark:bg-neutral-900">
              <div className="max-w-none">
                {metadata.title && (<h1 className="text-3xl font-bold mb-4 dark:text-white">{metadata.title}</h1> )}
                {metadata.featuredImageUrl && ( <img src={metadata.featuredImageUrl} alt={metadata.title} className="w-full max-h-64 object-cover rounded mb-6" /> )}
                <MDXPreview content={content} isVisualMode={isVisualMode} onContentChange={handleContentChange} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-2 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          {content.length} characters | {content.split(/\s+/).length} words
        </div>
        {/* TODO-Pending: Removed alongside the other save functions in this file. */}
        {/* <div className="text-sm text-neutral-500 dark:text-neutral-400">
          Press Ctrl+S to save • {isVisualMode ? 'Visual mode active' : 'Code mode'}
        </div> */}
      </div>
    </div>
  );
};

export default MDXEditor;