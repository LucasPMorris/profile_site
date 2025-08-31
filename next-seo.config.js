const canonicalUrl = 'https://lucas.untethered4life.com';
// TODO: Replace with my Image
const metaImage = 'https://lucas.untethered4life.com/public/images/lucas_profilesite.png';
const metaDescription =
  `Seasoned operational leader building, coaching, and inspiring customer facing technical teams. Let's build!`;

const defaultSEOConfig = {
  defaultTitle: 'Lucas Morris - Personal Website',
  description: metaDescription,
  canonical: canonicalUrl,
  openGraph: {
    canonical: canonicalUrl,
    title: 'Lucas Morris - Personal Website',
    description: metaDescription,
    type: 'website',
    images: [
      {
        url: metaImage,
        alt: 'lucasmorris.site og-image',
        width: 800,
        height: 600,
      },
      {
        url: metaImage,
        alt: 'lucasmorris.site og-image',
        width: 1200,
        height: 630,
      },
      {
        url: metaImage,
        alt: 'lucasmorris.site og-image',
        width: 1600,
        height: 900,
      },
    ],
    site_name: 'lucasmorris.site',
  },
  twitter: {
    handle: '@handle',
    site: '@site',
    cardType: 'summary_large_image',
  },
};

export default defaultSEOConfig;
