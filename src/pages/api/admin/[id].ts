import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/common/libs/prisma';
import { marked } from 'marked';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);
  const { type } = req.query;

  if (req.method === 'DELETE') {
    if (type === 'project') {
      await prisma.projects.delete({ where: { id } });
    } else {
      await prisma.blogPost.delete({ where: { id } });
    }
    return res.status(204).end();
  }

  if (req.method === 'PUT') {
    if (type === 'project') {
      // Update project
      const { title, slug, description, image, stacks, link_demo, link_github, content, is_featured, rawMD } = req.body;

      try {
        const updatedProject = await prisma.projects.update({
          where: { id },
          data: {
            title,
            slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
            description,
            image,
            stacks: stacks || '',
            link_demo: link_demo || null,
            link_github: link_github || null,
            content: content || null,
            is_featured: is_featured || false,
            rawMD: rawMD || false,
            updated_at: new Date()
          }
        });

        return res.status(200).json({ project: updatedProject });
      } catch (error) {
        console.error('Error updating project:', error);
        return res.status(500).json({ error: 'Failed to update project' });
      }
    } else {
      // Update blog post
      const { title, slug, contentMarkdown, featuredImageUrl, sticky, rawMD, tags, excerpt } = req.body;
      const contentHtml = await marked(contentMarkdown || '');

      try {
        const updatedPost = await prisma.blogPost.update({
          where: { id },
          data: {
            title,
            slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
            contentMarkdown,
            contentHtml,
            modified: new Date(),
            featuredImageUrl: featuredImageUrl || '',
            sticky: sticky || false,
            rawMD: rawMD || false,
            excerptHtml: excerpt || ''
          },
        });

        return res.status(200).json({ post: updatedPost });
      } catch (error) {
        console.error('Error updating blog post:', error);
        return res.status(500).json({ error: 'Failed to update blog post' });
      }
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
