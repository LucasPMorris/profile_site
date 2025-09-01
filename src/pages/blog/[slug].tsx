import axios from 'axios';
import { GetServerSideProps, NextPage } from 'next';
import dynamic from 'next/dynamic';
import { NextSeo } from 'next-seo';
import { useEffect } from 'react';

import BackButton from '@/common/components/elements/BackButton';
import Container from '@/common/components/elements/Container';
import { formatDate, formatExcerpt } from '@/common/helpers';
import { BlogDetailProps } from '@/common/types/blog';
import BlogDetail from '@/modules/blog/components/BlogDetail';
import { getBlogDetail } from '@/services/blog';
import { mapPrismaPostToBlogDetail } from '@/common/libs/blog';
import prisma from '@/common/libs/prisma';
import Footer from '@/common/components/layouts/partials/Footer';

interface BlogDetailPageProps { post: BlogDetailProps; };

const BlogDetailPage: NextPage<BlogDetailPageProps> = ({ post }) => {
  const slug = `${post?.slug}`;
  const canonicalUrl = `https://lucas.untethered4life.com/blog/${slug}`;
  const description = formatExcerpt(post?.excerpt?.rendered);

  const incrementViews = async () => { await axios.post(`/api/views?&slug=${slug}&type=blog`); };

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') { incrementViews(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <NextSeo
        title={`${post?.title?.rendered} - Blog Lucas Morris`}
        description={description}
        canonical={canonicalUrl}
        openGraph={{
          type: 'article',
          article: { publishedTime: post?.date, modifiedTime: post?.date, authors: ['Lucas Morris', 'LucasPMorris'] },
          url: canonicalUrl,
          images: [ { url: post?.featured_image_url } ],
          siteName: 'Blog by Lucas Morris',
        }}
      />
      <Container data-aos='fade-up'>
        <BackButton url='/blog' />
          {/* Metadata Block */}
        <BlogDetail {...post} />
      </Container>
      <div className='flex justify-center items-center'><Footer /></div>
    </>
  );
};

export default BlogDetailPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };

  const post = await prisma.blogPost.findUnique({where: { slug }, include: { categories: true, tags: true, author: true } });

  if (!post) { return { notFound: true }; }

  const mappedPost: BlogDetailProps = mapPrismaPostToBlogDetail(post);

  return { props: { post: mappedPost } };
};