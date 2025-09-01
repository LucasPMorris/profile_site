import { NextPage } from 'next';
import { NextSeo } from 'next-seo';

import Container from '@/common/components/elements/Container';
import BlogListNew from '@/modules/blog';
import Footer from '@/common/components/layouts/partials/Footer';

const PAGE_TITLE = 'Blog';

const BlogPage: NextPage = () => {
  return (
    <>
      <NextSeo title={`${PAGE_TITLE} - Lucas Morris`} />
      <Container className='xl:!-mt-5' data-aos='fade-up'>
        <BlogListNew />
      </Container>
      <div className='flex justify-center items-center'><Footer /></div>
    </>
  );
};

export default BlogPage;
