import type { NextApiRequest, NextApiResponse } from 'next';
import { BlogItemProps } from '@/common/types/blog';
import { getBlogList } from '@/services/blog';
import prisma from '@/common/libs/prisma';
import { mapPrismaPostToBlogItem } from '@/common/libs/blog';

export default async function handler( req: NextApiRequest, res: NextApiResponse ): Promise<void> {
  const { page = 1, per_page = 6, categories, search } = req.query;
  const skip = (Number(page) - 1) * Number(per_page);

  const whereClause: any = {
    ...(search && { OR: [ { title: { contains: String(search), mode: 'insensitive' } }, { contentMarkdown: { contains: String(search), mode: 'insensitive' } } ] }),
    ...(categories && { categories: { some: { id: Number(categories) } } }),
  };

  const posts = await prisma.blogPost.findMany({ where: whereClause, skip, take: Number(per_page), include: { categories: true, tags: true }, orderBy: { date: 'desc' } });

  const mappedPosts = posts.map(mapPrismaPostToBlogItem);

  const total_posts = await prisma.blogPost.count({ where: whereClause });
  const total_pages = Math.ceil(total_posts / Number(per_page));

  res.status(200).json({
    posts: mappedPosts, page: Number(page),
    per_page: Number(per_page), total_pages, total_posts, categories: categories ? Number(categories) : undefined,
  });
}
