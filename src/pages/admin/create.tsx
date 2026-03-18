import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { 
  BsEye as Eye, BsEyeSlash as EyeOff, BsCode as Code, BsTypeH1 as Heading1, BsTypeH2 as Heading2, BsTypeH3 as Heading3, 
  BsListUl as List, BsListOl as ListOrdered, BsBlockquoteLeft as Quote, BsLink45Deg as Link, BsImage as Image, 
  BsTable as Table, BsArrowsAngleContract as Minimize, BsArrowsAngleExpand as Maximize,
  BsCheckCircle as Publish, BsX as Cancel
} from 'react-icons/bs';
import prisma from '@/common/libs/prisma';
import MDXComponent from '@/common/components/elements/MDXComponent';
import RawMDComponent from '@/common/components/elements/RawMDComponent';
import MarkdownErrorBoundary from '@/common/components/elements/MarkdownErrorBoundary';
import { BlogDetailProps } from '@/common/types/blog';
import { mapPrismaPostToBlogDetail } from '@/common/libs/blog';

function useIsMounted() {
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true; 
    return () => { isMounted.current = false; }
  }, []);
  return useCallback(() => isMounted.current, []);
}

// Get server side props for edit mode
export async function getServerSideProps(context: any) {
  const { id, type } = context.query;
  
  if (id && type === 'blog') {
    const post = await prisma.blogPost.findUnique({ 
      where: { id: Number(id) }, 
      include: { categories: true, tags: true, author: true }
    });
    if (!post) return { notFound: true };
    const mappedPost = mapPrismaPostToBlogDetail(post);
    return { props: { existingData: mappedPost, type: 'blog', isEdit: true } };
  }
  
  if (id && type === 'project') {
    const project = await prisma.projects.findUnique({ where: { id: Number(id) } });
    if (!project) return { notFound: true };
    
    // Serialize dates to strings
    const serializedProject = {
      ...project,
      updated_at: project.updated_at.toISOString()
    };
    
    return { props: { existingData: serializedProject, type: 'project', isEdit: true } };
  }
  
  // Create mode
  return { props: { existingData: null, type: context.query.type || 'blog', isEdit: false } };
}

interface AdminEditorProps {
  existingData?: any;
  type: 'blog' | 'project';
  isEdit: boolean;
}

export default function AdminEditor({ existingData, type, isEdit }: AdminEditorProps) {
  const router = useRouter();
  const isMounted = useIsMounted();
  
  // Initialize data based on type and edit mode
  const [content, setContent] = useState(
    existingData?.content?.markdown || existingData?.content || ''
  );
  
  const [metadata, setMetadata] = useState({
    title: existingData?.title?.rendered || existingData?.title || '',
    slug: existingData?.slug || '',
    description: existingData?.description || '',
    image: existingData?.featured_image_url || existingData?.image || '',
    stacks: Array.isArray(existingData?.stacks) ? existingData?.stacks?.join(', ') : (existingData?.stacks || ''),
    link_demo: existingData?.link_demo || '',
    link_github: existingData?.link_github || '',
    sticky: existingData?.sticky || false,
    is_featured: existingData?.is_featured || false,
    rawMD: existingData?.rawMD || false,
    tags: existingData?.tags?.map((t: any) => t.name).join(', ') || '',
    excerpt: existingData?.excerpt?.rendered || ''
  });


  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVisualMode, setIsVisualMode] = useState(false);
  const [publishStatus, setPublishStatus] = useState<{ state: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ state: 'idle', message: '' });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const toolbarButtons = [
    { icon: Heading1, action: () => insertMarkdown('# '), title: 'Heading 1' },
    { icon: Heading2, action: () => insertMarkdown('## '), title: 'Heading 2' },
    { icon: Heading3, action: () => insertMarkdown('### '), title: 'Heading 3' },
    { icon: List, action: () => insertMarkdown('- '), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertMarkdown('1. '), title: 'Numbered List' },
    { icon: Quote, action: () => insertMarkdown('> '), title: 'Blockquote' },
    { icon: Code, action: () => insertMarkdown('```\\n', '\\n```'), title: 'Code Block' },
    { icon: Link, action: () => insertMarkdown('[', '](url)'), title: 'Link' },
    { icon: Image, action: () => insertMarkdown('![alt](', ')'), title: 'Image' },
    { icon: Table, action: () => insertMarkdown('| Header | Header |\\n|--------|--------|\\n| Cell   | Cell   |'), title: 'Table' },
  ];

  const handlePublish = async () => {
    try {
      setPublishStatus({ state: 'loading', message: 'Publishing...' });
      
      const url = isEdit 
        ? `/api/admin/${existingData.id}?type=${type}` 
        : `/api/admin/create?type=${type}`;
      
      const method = isEdit ? 'PUT' : 'POST';
      
      let requestData: any = {};
      
      if (type === 'blog') {
        requestData = {
          title: metadata.title,
          slug: metadata.slug,
          contentMarkdown: content,
          featuredImageUrl: metadata.image,
          sticky: metadata.sticky,
          rawMD: metadata.rawMD,
          tags: metadata.tags,
          excerpt: metadata.excerpt
        };
      } else {
        requestData = {
          title: metadata.title,
          slug: metadata.slug,
          description: metadata.description,
          image: metadata.image,
          stacks: metadata.stacks,
          link_demo: metadata.link_demo,
          link_github: metadata.link_github,
          content: content,
          is_featured: metadata.is_featured,
          rawMD: metadata.rawMD
        };
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        setPublishStatus({ state: 'success', message: isEdit ? 'Changes published!' : 'Published successfully!' });
        setTimeout(() => {
          router.push('/admin');
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        const errorMessage = errorData.error || 'Failed to publish';
        setPublishStatus({ state: 'error', message: errorMessage });
        setTimeout(() => setPublishStatus({ state: 'idle', message: '' }), 5000);
      }
    
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      setPublishStatus({ state: 'error', message: errorMessage });
      console.error('Publish error:', error);
      setTimeout(() => setPublishStatus({ state: 'idle', message: '' }), 5000);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      router.push('/admin');
    }
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-neutral-900' : ''} flex flex-col h-screen`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        <h1 className="text-xl font-semibold dark:text-white">
          {isEdit ? `Edit ${type}` : `Create New ${type}`}: {metadata.title || 'Untitled'}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVisualMode(!isVisualMode)}
            className="p-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
            title={isVisualMode ? 'Switch to Code Mode' : 'Switch to Visual Mode'}
          >
            {isVisualMode ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Metadata Bar */}
      <div className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-end">
          {/* Title and Slug */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium mb-1 dark:text-neutral-300">Title</label>
            <input
              type="text"
              value={metadata.title}
              onChange={(e) => setMetadata({...metadata, title: e.target.value})}
              className="w-full p-2 border rounded dark:bg-neutral-700 dark:border-neutral-600 dark:text-white text-sm"
              placeholder="Enter title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-neutral-300">Slug</label>
            <input
              type="text"
              value={metadata.slug}
              onChange={(e) => setMetadata({...metadata, slug: e.target.value})}
              className="w-full p-2 border rounded dark:bg-neutral-700 dark:border-neutral-600 dark:text-white text-sm"
              placeholder="url-slug"
            />
          </div>

          {/* Type-specific fields */}
          {type === 'project' ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-neutral-300">Tech Stacks</label>
                <input
                  type="text"
                  value={metadata.stacks}
                  onChange={(e) => setMetadata({...metadata, stacks: e.target.value})}
                  className="w-full p-2 border rounded dark:bg-neutral-700 dark:border-neutral-600 dark:text-white text-sm"
                  placeholder="React, TypeScript"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center text-sm dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={metadata.is_featured}
                    onChange={(e) => setMetadata({...metadata, is_featured: e.target.checked})}
                    className="mr-2"
                  />
                  Featured
                </label>
                <label className="flex items-center text-sm dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={metadata.rawMD}
                    onChange={(e) => setMetadata({...metadata, rawMD: e.target.checked})}
                    className="mr-2"
                  />
                  Raw MD
                </label>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-neutral-300">Tags</label>
                <input
                  type="text"
                  value={metadata.tags}
                  onChange={(e) => setMetadata({...metadata, tags: e.target.value})}
                  className="w-full p-2 border rounded dark:bg-neutral-700 dark:border-neutral-600 dark:text-white text-sm"
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center text-sm dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={metadata.sticky}
                    onChange={(e) => setMetadata({...metadata, sticky: e.target.checked})}
                    className="mr-2"
                  />
                  Sticky
                </label>
                <label className="flex items-center text-sm dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={metadata.rawMD}
                    onChange={(e) => setMetadata({...metadata, rawMD: e.target.checked})}
                    className="mr-2"
                  />
                  Raw MD
                </label>
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 flex-col">
            <div className="flex gap-2">
              <button
                onClick={handlePublish}
                disabled={publishStatus.state === 'loading'}
                className={`text-white px-4 py-2 rounded text-sm flex items-center gap-2 font-medium transition-all ${
                  publishStatus.state === 'loading' 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                }`}
              >
                <Publish className="w-4 h-4" />
                {publishStatus.state === 'loading' ? publishStatus.message : (isEdit ? 'Update' : 'Publish')}
              </button>
              <button
                onClick={handleCancel}
                disabled={publishStatus.state === 'loading'}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded text-sm disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
            {publishStatus.state === 'error' && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-medium text-red-900 dark:text-red-200">Publish Failed</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{publishStatus.message}</p>
                </div>
              </div>
            )}
            {publishStatus.state === 'success' && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800 flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">{publishStatus.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Extended metadata (collapsible) */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium dark:text-neutral-300 hover:text-neutral-600 dark:hover:text-neutral-400">
            More Options
          </summary>
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {type === 'project' ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-neutral-300">Description</label>
                  <textarea
                    value={metadata.description}
                    onChange={(e) => setMetadata({...metadata, description: e.target.value})}
                    className="w-full p-2 border rounded dark:bg-neutral-700 dark:border-neutral-600 dark:text-white text-sm"
                    rows={2}
                    placeholder="Project description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-neutral-300">Demo Link</label>
                  <input
                    type="text"
                    value={metadata.link_demo}
                    onChange={(e) => setMetadata({...metadata, link_demo: e.target.value})}
                    className="w-full p-2 border rounded dark:bg-neutral-700 dark:border-neutral-600 dark:text-white text-sm"
                    placeholder="https://demo-url.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-neutral-300">GitHub Link</label>
                  <input
                    type="text"
                    value={metadata.link_github}
                    onChange={(e) => setMetadata({...metadata, link_github: e.target.value})}
                    className="w-full p-2 border rounded dark:bg-neutral-700 dark:border-neutral-600 dark:text-white text-sm"
                    placeholder="https://github.com/user/repo"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-neutral-300">Excerpt</label>
                <textarea
                  value={metadata.excerpt}
                  onChange={(e) => setMetadata({...metadata, excerpt: e.target.value})}
                  className="w-full p-2 border rounded dark:bg-neutral-700 dark:border-neutral-600 dark:text-white text-sm"
                  rows={2}
                  placeholder="Brief description"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-neutral-300">
                {type === 'project' ? 'Image URL' : 'Featured Image URL'}
              </label>
              <input
                type="text"
                value={metadata.image}
                onChange={(e) => setMetadata({...metadata, image: e.target.value})}
                className="w-full p-2 border rounded dark:bg-neutral-700 dark:border-neutral-600 dark:text-white text-sm"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        </details>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2">
          <div className="flex gap-1 flex-wrap">
            {toolbarButtons.map((button, index) => (
              <button
                key={index}
                onClick={button.action}
                className="p-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
                title={button.title}
              >
                <button.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Split Editor/Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor Panel */}
          <div className="w-1/2 border-r border-neutral-200 dark:border-neutral-700 flex flex-col">
            <div className="bg-neutral-100 dark:bg-neutral-800 px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
              <span className="text-sm font-medium dark:text-neutral-300">Editor</span>
            </div>
            <div className="flex-1 flex flex-col p-4 bg-white dark:bg-neutral-900">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 w-full resize-none border-none outline-none bg-transparent dark:text-white font-mono text-sm leading-6"
                placeholder={`Start writing your ${type} content in Markdown...`}
              />
            </div>
          </div>

          {/* Preview Panel */}
          <div className="w-1/2 flex flex-col">
            <div className="bg-neutral-100 dark:bg-neutral-800 px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
              <span className="text-sm font-medium dark:text-neutral-300">Preview</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-neutral-900">
              <div className="max-w-none">
                <MarkdownErrorBoundary>
                  {metadata.rawMD
                    ? <RawMDComponent>{content}</RawMDComponent>
                    : <div className="prose prose-neutral dark:prose-invert"><MDXComponent>{content}</MDXComponent></div>
                  }
                </MarkdownErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
