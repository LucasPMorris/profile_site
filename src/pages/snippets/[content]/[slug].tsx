import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';

import BackButton from '@/common/components/elements/BackButton';
import Container from '@/common/components/elements/Container';
import { parseUrl } from '@/common/helpers';
import { loadMdxFiles } from '@/common/libs/mdx';
import { MdxFileContentProps } from '@/common/types/snippets';
import ContentDetail from '@/modules/snippets/components/ContentDetail';
import ContentDetailHeader from '@/modules/snippets/components/ContentDetailHeader';

const SnippetsContentDetailPage: NextPage<{ data: MdxFileContentProps }> = ({ data }) => {
  const { content, frontMatter } = data;

  const router = useRouter();
  const currentUrl = router.asPath;
  const { parentSlug } = parseUrl(currentUrl);

  const meta = frontMatter;

  const PAGE_TITLE = meta?.title;
  const PAGE_DESCRIPTION = `Snippets ${meta?.category} - ${PAGE_TITLE} with detailed explanations`;

  return (
    <>
      <NextSeo
        title={`Snippets ${meta?.category} : ${PAGE_TITLE} - Lucas Morris`}
        description={PAGE_DESCRIPTION}
        openGraph={{
          type: 'article',
          article: { publishedTime: meta?.updated_at,  modifiedTime: meta?.updated_at, authors: ['Lucas Morris'] },
          images: [ { url: meta?.cover_url as string }],
          siteName: 'Lucas Morris',
        }}
      />
      <Container data-aos='fade-up' className='mb-10'>
        <BackButton url={`/snippets/${parentSlug}`} />
        <ContentDetailHeader {...meta} />
        <ContentDetail content={content} frontMatter={frontMatter} />
      </Container>
    </>
  );
};

export default SnippetsContentDetailPage;

export const getStaticPaths: GetStaticPaths = async () => { return { paths: [], fallback: 'blocking' }; };

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const parentContent = params?.content as string;
  const slug = params?.slug as string;

  if (!parentContent || !slug) { return { redirect: { destination: '/404', permanent: false } }; }

  const contentList = await loadMdxFiles(parentContent);

  if (!Array.isArray(contentList)) { return { redirect: { destination: '/404', permanent: false } }; }

  const contentData = contentList.find((item) => item.slug === slug);

  if (!contentData || typeof contentData !== 'object') { return { redirect: { destination: '/404', permanent: false } }; }

  return { props: { data: contentData } };
};
