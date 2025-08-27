interface GoogleDocsEmbedProps { src: string; width?: string; height?: string; }

const GoogleDocsEmbed: React.FC<GoogleDocsEmbedProps> = ({ src,  width = '100%', height = '800px' }) => {
  return (
    <iframe src={`${src}`} title='Google Docs Viewer' width={width} height={height}>
      This browser does not support embedding Google Docs. Please use a
      compatible browser.
    </iframe>
  );
};

export default GoogleDocsEmbed;
