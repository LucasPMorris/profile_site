interface MarkdownPreviewProps { markdownCode: string; isFullScreen?: boolean; }

export const MDPreview = ({ markdownCode, isFullScreen }: MarkdownPreviewProps) => {
  // You'd typically use a markdown parser like 'marked' or 'remark'
  // For now, just showing the structure
  return (
    <div 
      className="w-full h-full p-4 bg-white text-black overflow-auto prose max-w-none"
      style={{ height: isFullScreen ? '70vh' : '500px' }}
    >
      <pre className="whitespace-pre-wrap font-mono text-sm">
        {markdownCode || 'Markdown preview would go here...'}
      </pre>
    </div>
  );
};