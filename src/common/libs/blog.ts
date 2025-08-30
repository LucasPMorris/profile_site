// src/lib/mappers/blog.ts
import { BlogDetailProps, BlogItemProps } from '@/common/types/blog';
import { blogPost, tag, category, user } from '@prisma/client';

export const mapPrismaPostToBlogItem = ( post: blogPost & { categories: { id: number }[]; tags: tag[] } ): BlogItemProps => {
  return {
    id: post.id,
    date: post.date.toISOString(),
    modified: post.modified.toISOString(),
    slug: post.slug,
    status: post.status,
    link: post.link,
    title: { rendered: post.title },
    content: { rendered: post.contentHtml, markdown: post.contentMarkdown, protected: post.contentProtected },
    excerpt: { rendered: post.excerptHtml, protected: post.excerptProtected },
    author: post.authorId,
    featured_media: post.featuredMediaId ?? 0,
    featured_image_url: post.featuredImageUrl ?? '',
    sticky: post.sticky,
    template: post.template,
    format: post.format,
    meta: { footnotes: post.footnotes },
    categories: post.categories.map((cat) => cat.id),
    tags: post.tags.map((tag) => tag.id),
    tags_list: post.tags.map((tag) => ({
      term_id: tag.id,
      name: tag.name,
      slug: tag.slug,
      term_group: 0,
      term_taxonomy_id: tag.id,
      taxonomy: 'post_tag',
      description: '',
      parent: 0,
      count: 0,
      filter: 'raw',
    })),
    total_views_count: post.totalViewsCount,
    // TODO: The following fields are placeholders and may need proper mapping
    comment_status: 'closed',
    ping_status: 'closed',
    amp_enabled: false,    
  };
};

export const mapPrismaPostToBlogDetail = ( post: blogPost & { categories: category[]; tags: tag[]; author: user; }): BlogDetailProps => {
  return {
    id: post.id,
    date: post.date.toISOString(),
    date_gmt: post.date.toISOString(), // adjust if needed
    modified: post.modified.toISOString(),
    modified_gmt: post.modified.toISOString(), // adjust if needed
    slug: post.slug,
    status: post.status,
    type: 'post',
    link: post.link,
    title: { rendered: post.title },
    content: {
      rendered: post.contentHtml,
      markdown: post.contentMarkdown,
      protected: post.contentProtected,
    },
    excerpt: {
      rendered: post.excerptHtml,
      protected: post.excerptProtected,
    },
    author: post.authorId,
    featured_media: post.featuredMediaId ?? 0,
    sticky: post.sticky,
    template: post.template,
    format: post.format,
    meta: { footnotes: post.footnotes },
    categories: post.categories.map((cat) => cat.id),
    tags: post.tags.map((tag) => tag.id),
    tags_list: post.tags.map((tag) => ({
      term_id: tag.id,
      name: tag.name,
      slug: tag.slug,
      term_group: 0,
      term_taxonomy_id: tag.id,
      taxonomy: 'post_tag',
      description: '',
      parent: 0,
      count: 0,
      filter: 'raw',
    })),
    featured_image_url: post.featuredImageUrl ?? '',
    guid: { rendered: post.link },
    replies: { embeddable: true, href: '' },
    version_history: { count: 0, href: '' },
    predecessor_version: { id: 0, href: '' },
    wp_featuredmedia: { embeddable: true, href: '' },
    wp_attachment: { href: '' },
    wp_term: [],
    curies: [],
    total_views_count: post.totalViewsCount,
    // TODO: The following fields are placeholders and may need proper mapping
    comment_status: 'closed',
    ping_status: 'closed',
    amp_enabled: false,
  };
};