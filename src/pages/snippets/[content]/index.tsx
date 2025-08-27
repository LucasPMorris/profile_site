import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';

import BackButton from '@/common/components/elements/BackButton';
import Container from '@/common/components/elements/Container';
import Loading from '@/common/components/elements/Loading';
import PageHeading from '@/common/components/elements/PageHeading';
import { SNIPPETS_CONTENTS } from '@/common/constant/snippets';
import { loadMdxFiles } from '@/common/libs/mdx';
import { ContentProps, MdxFileContentProps } from '@/common/types/snippets';
import ContentList from '@/modules/snippets/components/ContentList';

interface ContentPageProps { content: ContentProps | null; subContents: MdxFileContentProps[]; }

const SnippetsContentPage: NextPage<ContentPageProps> = ({ content, subContents }) => {
  const router = useRouter();

  if (router.isFallback) { return <Loading /> }

  if (!content) { return null; }

  const { title, description } = content;

  const sortedSubContents = subContents.sort((a, b) => a.frontMatter.id - b.frontMatter.id);

  const canonicalUrl = `https://lucasmorris.site/snippets/${content?.slug}`;

  return (
    <>
      <NextSeo
        title={`Snippets ${title} - Lucas Morris`}
        description={description}
        canonical={canonicalUrl}
        openGraph={{ url: canonicalUrl, images: [{ url: content?.image }], siteName: 'Lucas Morris' }}
      />
      <Container data-aos='fade-up'>
        <BackButton url='/snippets' />
        <PageHeading title={title} description={description} />
        <ContentList sortedSubContents={sortedSubContents} content={content} title={title} />
      </Container>
    </>
  );
};

export default SnippetsContentPage;

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = SNIPPETS_CONTENTS.map((content) => ({ params: { content: content.slug } }));
  return { paths, fallback: true };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const contentSlug = params?.content as string;

  const content = SNIPPETS_CONTENTS.find((item) => item?.slug === contentSlug) || null;

  if (!content) { return { redirect: { destination: '/404', permanent: false } }; }

  const subContentList = await loadMdxFiles(content?.slug);

  return {
    props: {content, subContents: subContentList },
  };
};
