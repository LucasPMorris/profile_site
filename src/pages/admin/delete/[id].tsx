import { GetServerSideProps } from 'next';
import prisma from '@/common/libs/prisma';
import { useRouter } from 'next/router';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = Number(context.params?.id);
  const post = await prisma.blogPost.findUnique({ where: { id } });

  if (!post) return { notFound: true };

  return { props: { post: { id: post.id, title: post.title } } };
};

export default function DeletePostPage({ post }: { post: { id: number; title: string } }) {
  const router = useRouter();

  const handleDelete = async () => {
    await fetch(`/api/admin/${post.id}`, { method: 'DELETE' }); 
    router.push('/admin');
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-red-600">Delete Post</h1>
      <p>Are you sure you want to delete <strong>{post.title}</strong>?</p>
      <div className="space-x-4">
        <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded">
          Yes, Delete
        </button>
        <button onClick={() => router.push('/admin')} className="bg-gray-300 px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </div>
  );
}

