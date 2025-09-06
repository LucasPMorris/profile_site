'use client';

import Link from 'next/link';
import prisma from '@/common/libs/prisma';
import { BlogItemProps } from '@/common/types/blog';
import { mapPrismaPostToBlogItem } from '@/common/libs/blog';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { useState } from 'react';
import ImageBrowser from '@/common/components/elements/ImageBrowser';
import { BsTrash as DeleteIcon, BsPencilSquare as EditIcon, BsPlusSquare as NewIcon, BsUpload as UploadIcon } from 'react-icons/bs';

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
      <div className="p-8 space-y-6 text-sm text-neutral-600 dark:text-neutral-400">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Link href="/admin/create" className="text-blue-600 underline">Create New Post</Link>
        <button onClick={handleLogout} className="text-sm text-red-600 underline">Logout</button>
      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.id}
            className="w-full rounded-xl shadow-sm transition-all duration-300 border border-neutral-400 dark:border-neutral-800 bg-white/60 dark:bg-white/5 p-6 space-y-2">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <div>
                <h2 className="font-semibold text-neutral-800 dark:text-neutral-100">{post.title.rendered}</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">{post.date}</p>
              </div>
              <div className="flex gap-4">
                <Link href={`/admin/edit/${post.id}`} className="text-indigo-600 dark:text-indigo-300 hover:underline"><EditIcon size={24}/></Link>
                <Link href={`/admin/delete/${post.id}`} className="text-red-600 dark:text-red-400 hover:underline"><DeleteIcon size={24}/></Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div>
        <div className="rounded-xl shadow-sm transition-all duration-300 border border-neutral-400 dark:border-neutral-800 bg-white/60 dark:bg-white/5 p-4 space-y-2">
          <h2 className="text-lg font-semibold text-neutral-700 dark:text-neutral-100">Available Images</h2>
          <ImageBrowser />
            <div className='relative py-2 pt-4 inline-block'>
              <input type="file" placeholder="" id="uploadImage" accept="image/*" onChange={handleFileChange} className='hidden'/>
              <label htmlFor="uploadImage" className="cursor-pointer px-4 py-2 rounded-lg hover:bg-[rgba(146,146,188)] border border-neutral-400 dark:border-neutral-700 bg-[rgba(106,106,128)] text-white font-medium transition-colors duration-200">
                <UploadIcon className="inline-block mr-2 text-white" />Upload Image
              </label>
            </div>
            {/* <input type="file" placeholder="" accept="image/*" onChange={handleFileChange} className='rgba(106, 106, 128, 1)'/> */}
        </div>        
      </div>      
    </div>
  );
}