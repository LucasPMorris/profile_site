import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/common/libs/prisma';
import { marked } from 'marked';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);

  if (req.method === 'DELETE') {
    await prisma.blogPost.delete({ where: { id } });
    return res.status(204).end();
  }

  if (req.method === 'PUT') {
    const { title, contentMarkdown } = req.body;
    const contentHtml = await marked(contentMarkdown || '');

    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        slug: title.toLowerCase().replace(/\s+/g, '-'),
        contentMarkdown,
        contentHtml,
        modified: new Date(),
      },
    });

    return res.status(200).json({ post: updatedPost });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
