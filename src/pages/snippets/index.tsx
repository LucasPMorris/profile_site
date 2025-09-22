import { NextPage } from 'next';
import { NextSeo } from 'next-seo';


import Container from '@/common/components/elements/Container';
import PageHeading from '@/common/components/elements/PageHeading';
import { SNIPPETS_CONTENTS } from '@/common/constant/snippets';
import SnippetsModule from '@/modules/snippets';

const PAGE_TITLE = 'Snippets';
const PAGE_DESCRIPTION = `Helpful reminders and snippets for you to use.`;

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
