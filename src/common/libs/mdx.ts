import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';

interface MdxFileProps { slug: string; frontMatter: Record<string, unknown>; content: string; }

export const loadMdxFiles = async (slug: string): Promise<MdxFileProps[]> => {
  const dirPath = path.join(process.cwd(), 'src', 'contents', 'snippets', slug);

  if (!fs.existsSync(dirPath)) { return []; }

  const files = fs.readdirSync(dirPath);

  const contents = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dirPath, file);
      const source = fs.readFileSync(filePath, 'utf-8');
      const { content, data } = matter(source);
      const mdxCompiler = remark()
        .use(remarkParse)
        .use(remarkGfm)
        .use(rehypeStringify as any);
      const mdxContent = mdxCompiler.processSync(content).toString();
      return { slug: file.replace('.mdx', ''), frontMatter: data, content: mdxContent };
    })
  );

  return contents;
};

export const getMdxFileCount = (slug: string) => {
  const dirPath = path.join(process.cwd(), 'src', 'contents', 'snippets', slug);
  const files = fs.readdirSync(dirPath);
  const mdxFiles = files.filter((file) => file.endsWith('.mdx'));
  return mdxFiles.length;
};
