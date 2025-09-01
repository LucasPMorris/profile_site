const canonicalUrl = 'https://lucas.untethered4life.com';
const metaImage = 'https://lucas.untethered4life.com/images/lucas_profilesite.png';
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
      { url: metaImage, alt: 'lucas.untethered4life.com og-image', width: 800, height: 600 },
      { url: metaImage, alt: 'lucas.untethered4life.com og-image', width: 1200, height: 630 },
      { url: metaImage, alt: 'lucas.untethered4life.com og-image', width: 1600, height: 900, } 
    ],
  site_name: 'lucas.untethered4life.com',
  },
  twitter: { handle: '@handle', site: '@site', cardType: 'summary_large_image' },
};

export default defaultSEOConfig;
