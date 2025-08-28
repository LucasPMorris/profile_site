import type { NextApiRequest, NextApiResponse } from 'next';
import { BlogItemProps } from '@/common/types/blog';
import { getBlogList } from '@/services/blog';
import prisma from '@/common/libs/prisma';
import { mapPrismaPostToBlogItem } from '@/common/libs/blog';

export default async function handler( req: NextApiRequest, res: NextApiResponse ): Promise<void> {
  const { page = 1, per_page = 6, categories, search } = req.query;

  const skip = (Number(page) - 1) * Number(per_page);

  const whereClause: any = {
    ...(search && {
      OR: [
        { title: { contains: String(search), mode: 'insensitive' } },
        { contentMarkdown: { contains: String(search), mode: 'insensitive' } },
      ],
    }),
    ...(categories && {
      categories: { some: { id: Number(categories) } },
    }),
  };

  const posts = await prisma.blogPost.findMany({
    where: whereClause,
    skip,
    take: Number(per_page),
    include: { categories: true, tags: true },
    orderBy: { date: 'desc' },
  });

  const mappedPosts = posts.map(mapPrismaPostToBlogItem);

  const total_posts = await prisma.blogPost.count({ where: whereClause });
  const total_pages = Math.ceil(total_posts / Number(per_page));

  res.status(200).json({
    posts: mappedPosts,
    page: Number(page),
    per_page: Number(per_page),
    total_pages,
    total_posts,
    categories: categories ? Number(categories) : undefined,
  });


  // try { res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30' );

  //   const { page, per_page, categories, search } = req.query;

  //   const responseData = await getBlogList({ page: Number(page) || 1, per_page: Number(per_page) || 9, categories: categories ? Number(categories) : undefined, search: search ? String(search) : undefined });

  //   const blogItemsWithViews = await Promise.all(
  //     responseData?.data?.posts?.map(async (blogItem: BlogItemProps) => {
  //       const { slug } = blogItem;

  //       const contentMeta = await prisma.contentmeta.findUnique({
  //         where: { slug: slug as string },
  //         select: { views: true },
  //       });

  //       const viewsCount = contentMeta?.views ?? 0;

  //       return {
  //         ...blogItem,
  //         total_views_count: viewsCount,
  //       };
  //     }),
  //   );

  //   const responses = {
  //     status: true,
  //     data: {
  //       total_pages: responseData?.data?.total_pages,
  //       total_posts: responseData?.data?.total_posts,
  //       page: responseData?.data?.page,
  //       per_page: responseData?.data?.per_page,
  //       posts: blogItemsWithViews,
  //       categories: responseData?.data?.categories,
  //     },
  //   };

  //   res.status(200).json(responses);
  // } catch (error) { res.status(200).json({ status: false, error }); }
}
