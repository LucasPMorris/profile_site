import { useEffect, useRef } from "react";

interface HTMLPreviewProps { htmlCode: string; isFullScreen?: boolean; }

export const HTMLPreview = ({ htmlCode, isFullScreen }: HTMLPreviewProps) => {
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
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
              </style>
            </head>
            <body>
              ${htmlCode}
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [htmlCode]);

  return ( <iframe ref={iframeRef} className="w-full h-full border-0 bg-white" style={{ height: isFullScreen ? '70vh' : '500px' }} title="HTML Preview" sandbox="allow-scripts" /> );
};