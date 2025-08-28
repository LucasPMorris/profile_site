import { useState } from 'react';
import { GetServerSideProps } from 'next';
import prisma from '@/common/libs/prisma';
import { BlogDetailProps } from '@/common/types/blog';
import { mapPrismaPostToBlogDetail } from '@/common/libs/blog';
import { marked } from 'marked';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = Number(context.params?.id);
  const post = await prisma.blogPost.findUnique({ where: { id }, include: { categories: true, tags: true, author: true },});

  if (!post) return { notFound: true };

  const mappedPost = mapPrismaPostToBlogDetail(post);
  return { props: { post: mappedPost } };
};

export default function EditPostPage({ post }: { post: BlogDetailProps }) {
  const [title, setTitle] = useState(post.title.rendered);
  const [markdown, setMarkdown] = useState(post.content.markdown);
  const [featuredImageUrl, setFeaturedImageUrl] = useState(post?.featured_image_url || '');
  const [slug, setSlug] = useState(post.slug || '');
  const [data, setData] = useState({ title, slug, contentMarkdown: markdown, featuredImageUrl });
  const [sticky, setSticky] = useState(post.sticky || false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting data:', data);
    await fetch(`/api/admin/${post.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, slug, contentMarkdown: markdown, featuredImageUrl, sticky }) });
    window.location.href = '/admin';
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Edit Post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2 rounded" />
        <textarea value={markdown} onChange={(e) => setMarkdown(e.target.value)} className="w-full border p-2 rounded h-40"/>
        <label><input type="checkbox" checked={sticky} onChange={(e) => setSticky(e.target.checked)} />Sticky Post</label>
        <input type="text" placeholder="Slug" value={slug}  onChange={(e) => setSlug(e.target.value)} className="w-full border p-2 rounded"/>   
        <input type="text" placeholder="Featured Image URL" value={featuredImageUrl}  onChange={(e) => setFeaturedImageUrl(e.target.value)} className="w-full border p-2 rounded"/>  
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save Changes</button>
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Preview</h2>
          <div className="prose max-w-none bg-neutral-100 dark:bg-neutral-800 p-4 rounded" dangerouslySetInnerHTML={{ __html: marked(markdown || '') }} />
        </div>        
      </form>
    </div>
  );
}