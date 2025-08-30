import { useState } from 'react';
import { GetServerSideProps } from 'next';
import prisma from '@/common/libs/prisma';
import { BlogDetailProps } from '@/common/types/blog';
import { mapPrismaPostToBlogDetail } from '@/common/libs/blog';
import { marked } from 'marked';
import clsx from 'clsx';
import Breakline from '@/common/components/elements/Breakline';

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
    await fetch(`/api/admin/${post.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, slug, contentMarkdown: markdown, featuredImageUrl, sticky }) });
    window.location.href = '/admin';
  };

  return (
    <div className="p-8 space-y-6 text-neutral-600 dark:text-neutral-400">
      <h1 className="text-2xl font-bold">Edit Post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2 rounded border-neutral-400 dark:border-neutral-700" />
        <textarea value={markdown} onChange={(e) => setMarkdown(e.target.value)} className="w-full border p-2 rounded h-40 border-neutral-400  dark:border-neutral-700"/>
        <div className='flex-grow'>
          <span>Slug</span>  
          <input type="text" placeholder="Slug" value={slug}  onChange={(e) => setSlug(e.target.value)} className="w-full border p-2 rounded border-neutral-400  dark:border-neutral-700"/>
        </div>   
        <div className='flex-grow m-b-4'>
          <span>Featured Image URL</span>
          <input type="text" placeholder="Featured Image URL" value={featuredImageUrl}  onChange={(e) => setFeaturedImageUrl(e.target.value)} className="w-full border p-2 rounded border-neutral-400  dark:border-neutral-700"/>  
        </div>
        <div className="flex items-center justify-end space-x-2 pb-4">
          <input type="checkbox" checked={sticky} onChange={(e) => setSticky(e.target.checked)} className={clsx('w-6 h-6 bg-[rgba(106,106,128]')} />
          <label>Sticky Post</label>
          <button type="submit" className="bg-[rgba(106,106,128)] text-neutral-100 px-4 py-2 rounded border-neutral-400 dark:border-neutral-700">Save Changes</button>
        </div>
        <Breakline />
        <div className="mt-6cborder-neutral-400">
          <h2 className="text-lg font-semibold mb-2">Preview</h2>
            <div className="prose max-w-none border border-neutral-400  dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-4 rounded" dangerouslySetInnerHTML={{ __html: marked(markdown || '') }} />
        </div>        
      </form>
    </div>
  );
}