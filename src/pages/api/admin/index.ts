import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/common/libs/prisma';
import { marked } from 'marked';

export default async function handler( req: NextApiRequest, res: NextApiResponse ) {
  if (req.method === 'POST') {
    const { title, slug, contentMarkdown, excerptHtml, featuredImageUrl, sticky } = req.body;
    const contentHtml = await marked(contentMarkdown || '');

    const newPost = await prisma.blogPost.create({
      data: {
        title,
        slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
        contentMarkdown,
        contentHtml: contentHtml || '', // You can add markdown-to-HTML conversion later
        excerptHtml: excerptHtml || '', // Required field
        date: new Date(),
        modified: new Date(),
        status: 'publish',
        authorId: 1, // Replace with actual author logic
        link: '', // Required field
        template: '', // Required field
        format: '', // Required field
        footnotes: '', // Required field
        featuredImageUrl: featuredImageUrl || '', // Optional, but safe to include
        contentProtected: false,
        excerptProtected: false,
        sticky: sticky || false,
        featuredMediaId: 0,
        totalViewsCount: 0,
      },
    });

    return res.status(201).json({ post: newPost });
  }

  res.status(405).json({ error: 'Method not allowed' });
}

