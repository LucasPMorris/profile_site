import { NextApiRequest, NextApiResponse } from 'next';

import prisma from '@/common/libs/prisma';

interface ResponseData { views: number; }

export default async function handler( req: NextApiRequest, res: NextApiResponse ) {
  const { slug, type } = req.query;

  if (req.method === 'GET') {
    try {
      const contentMeta = await prisma.contentmeta.findUnique({where: { slug: slug as string }, select: { views: true } });
      const contentViewsCount = contentMeta?.views ?? 0;
      const response: ResponseData = { views: contentViewsCount };

      return res.json(response);
    } catch (error) { return res.status(500).json({ error: 'Failed to fetch content meta' }); }
  } else if (req.method === 'POST') {
    try {
      const contentMeta = await prisma.contentmeta.upsert({ where: { slug: slug as string }, update: { views: { increment: 1} }, create: {slug: slug as string, type: type as string, views: 1 }, select: { views: true } }); 
      return res.json(contentMeta);
    } catch (error) { return res.status(500).json({ error: 'Failed to update views count' }); }
  } else { return res.status(405).json({ error: 'Method not allowed' }); }
}
