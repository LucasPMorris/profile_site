import { NextPage } from 'next';
import { NextSeo } from 'next-seo';

import Container from '@/common/components/elements/Container';
import PageHeading from '@/common/components/elements/PageHeading';
import { SNIPPETS_CONTENTS } from '@/common/constant/snippets';
import SnippetsModule from '@/modules/snippets';

const PAGE_TITLE = 'Snippets';
const PAGE_DESCRIPTION = `It's not a course, it's my personal learning notes. But if you are interested, let's learn together.`;

const SnippetsPage: NextPage = () => {
  const filteredContents = SNIPPETS_CONTENTS.filter((content) => content.is_show) || [];

  return (
    <>
      <NextSeo title={`${PAGE_TITLE} - Lucas Morris`} />
      <Container data-aos='fade-up'>
        <PageHeading title={PAGE_TITLE} description={PAGE_DESCRIPTION} />
        <SnippetsModule contents={filteredContents} />
      </Container>
    </>
  );
};

export default SnippetsPage;
