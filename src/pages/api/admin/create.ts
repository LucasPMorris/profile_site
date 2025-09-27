import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/common/libs/prisma';
import { marked } from 'marked';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { type } = req.query;

  if (req.method === 'POST') {
    if (type === 'project') {
      // Create project
      const { title, slug, description, image, stacks, link_demo, link_github, content, is_featured } = req.body;

      try {
        const newProject = await prisma.projects.create({
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
            is_show: true,
            updated_at: new Date()
          }
        });

        return res.status(201).json({ project: newProject });
      } catch (error) {
        console.error('Error creating project:', error);
        return res.status(500).json({ error: 'Failed to create project' });
      }
    } else {
      // Create blog post (existing logic)
      const { title, slug, contentMarkdown, excerptHtml, featuredImageUrl, sticky, tags, excerpt } = req.body;
      const contentHtml = await marked(contentMarkdown || '');

      try {
        const newPost = await prisma.blogPost.create({
          data: {
            title,
            slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
            contentMarkdown,
            contentHtml: contentHtml || '',
            excerptHtml: excerpt || excerptHtml || '',
            date: new Date(),
            modified: new Date(),
            status: 'publish',
            authorId: 1,
            link: '',
            template: '',
            format: '',
            footnotes: '',
            featuredImageUrl: featuredImageUrl || '',
            contentProtected: false,
            excerptProtected: false,
            sticky: sticky || false,
            featuredMediaId: 0,
            totalViewsCount: 0,
          }
        });

        return res.status(201).json({ post: newPost });
      } catch (error) {
        console.error('Error creating blog post:', error);
        return res.status(500).json({ error: 'Failed to create blog post' });
      }
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}