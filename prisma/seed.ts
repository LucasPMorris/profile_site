import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const author = await prisma.user.create({
    data: { name: 'Lucas Morris', username: 'LucasPMorris',
      twitterUsername: '', githubUsername: 'LucasPMorris',
      websiteUrl: 'https://profile-site-rt4b.onrender.com', profileImage: '/images/luke_avatar.png',
    },
  });

  const category = await prisma.category.create({
    data: { name: 'Engineering', slug: 'engineering' },
  });

  const tag = await prisma.tag.create({ data: { name: 'Next.js', slug: 'nextjs' } });

  await prisma.blogPost.create({
    data: {
      slug: 'refactoring-ui-systems',
      title: 'Refactoring UI Systems for Scalability',
      contentHtml: '<p>This post explores how to normalize template styles...</p>',
      contentMarkdown: 'This post explores how to normalize template styles...',
      excerptHtml: '<p>Learn how to audit Tailwind configs...</p>',
      excerptProtected: false,
      contentProtected: false,
      date: new Date(),
      modified: new Date(),
      status: 'published',
      link: 'https://profile-site-rt4b.onrender.com//blog/refactoring-ui-systems',
      authorId: author.user_id,
      sticky: false,
      template: 'default',
      format: 'standard',
      footnotes: 'None',
      featuredImageUrl: '/images/blog_feature_exit.png',
      totalViewsCount: 42,
      categories: { connect: [{ id: category.id }] },
      tags: { connect: [{ id: tag.id }] },
    },
  });
}

main().catch((e) => console.error(e)).finally(() => prisma.$disconnect());