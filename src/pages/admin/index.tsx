import Link from 'next/link';
import prisma from '@/common/libs/prisma';
import { BlogItemProps } from '@/common/types/blog';
import { mapPrismaPostToBlogItem } from '@/common/libs/blog';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { useState } from 'react';
import useSWR from 'swr';
import ImageBrowser from '@/common/components/elements/ImageBrowser';

export async function getServerSideProps() {
  const posts = await prisma.blogPost.findMany({ orderBy: { date: 'desc' }, include: { categories: true, tags: true } });
  const mappedPosts = posts.map(mapPrismaPostToBlogItem);
  return { props: { posts: mappedPosts } };
}

export default function AdminDashboard({ posts }: { posts: BlogItemProps[] }) {
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  
  const router = useRouter();
  const handleLogout = () => { Cookies.remove('admin_token'); router.push('/'); };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];    
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setUploadedImageUrls((prev) => [...prev, data.url]);}  
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button onClick={handleLogout} className="text-sm text-red-600 underline">Logout</button>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <ImageBrowser />        
      </div>
      <Link href="/admin/create" className="text-blue-600 underline">Create New Post</Link>

      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.id} className="border p-4 rounded-md">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold">{post.title.rendered}</h2>
                <p className="text-sm text-gray-500">{post.date}</p>
              </div>
              <div className="space-x-4">
                <Link href={`/admin/edit/${post.id}`} className="text-blue-500">Edit</Link>
                <Link href={`/admin/delete/${post.id}`} className="text-red-500">Delete</Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}