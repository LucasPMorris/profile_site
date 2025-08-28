import { useState } from 'react';
import { marked } from 'marked';
import { BlogDetailProps } from '@/common/types/blog';

const post = {} as BlogDetailProps;

export default function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [sticky, setSticky] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, slug, contentMarkdown: markdown, featuredImageUrl, sticky }), }); 
    window.location.href = '/admin';
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Create New Post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2 rounded" />
        <textarea placeholder="Markdown content" value={markdown} onChange={(e) => setMarkdown(e.target.value)} className="w-full border p-2 rounded h-40" />
        <label><input type="checkbox" checked={sticky} onChange={(e) => setSticky(e.target.checked)} />Sticky Post</label>
        <input type="text" placeholder="Slug" value={slug}  onChange={(e) => setSlug(e.target.value)} className="w-full border p-2 rounded"/>          
        <input type="text" placeholder="Featured Image URL" value={featuredImageUrl}  onChange={(e) => setFeaturedImageUrl(e.target.value)} className="w-full border p-2 rounded"/>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Publish</button>
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Preview</h2>
          <div className="prose max-w-none bg-neutral-100 dark:bg-neutral-800 p-4 rounded" dangerouslySetInnerHTML={{ __html: marked(markdown || '') }} />
        </div>        
      </form>
    </div>
  );
}
