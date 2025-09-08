import { useEffect, useRef } from "react";

interface CSSPreviewProps { cssCode: string; htmlCode?: string; isFullScreen?: boolean; }

export const CSSPreview = ({ cssCode, htmlCode = '<div>Preview</div>', isFullScreen }: CSSPreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <style>${cssCode}</style>
            </head>
            <body>${htmlCode}</body>
          </html>
        `);
        doc.close();
      }
    }
  }, [cssCode, htmlCode]);

  return (
    <iframe ref={iframeRef} className="w-full h-full border-0" style={{ height: isFullScreen ? '70vh' : '500px' }} title="CSS Preview" />
  );
};