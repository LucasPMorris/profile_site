import { useState } from 'react';

interface SvgScrollProps { src: string; width?: number; height?: number; initialScale?: number; }

const SvgScroll = ({ src, width = 1200, height = 800, initialScale = 1 }: SvgScrollProps) => {
  const [scale, setScale] = useState(initialScale);

  console.log("Rendering SvgScroll with props:", { src, width, height, initialScale, scale });

  return (
    <div className="relative my-6 border rounded-lg overflow-auto bg-neutral-100 dark:bg-neutral-900 p-4">
      {/* Zoom Controls */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button onClick={() => setScale((s) => Math.max(0.5, s - 0.1))} className="px-2 py-1 text-sm bg-neutral-300 dark:bg-neutral-700 rounded hover:bg-neutral-400 dark:hover:bg-neutral-600">−</button>
        <button onClick={() => setScale((s) => Math.min(3, s + 0.1))} className="px-2 py-1 text-sm bg-neutral-300 dark:bg-neutral-700 rounded hover:bg-neutral-400 dark:hover:bg-neutral-600">+</button>
      </div>

      {/* SVG Container */}
      <div className="overflow-auto">
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width, height }}>
          <object type="image/svg+xml" data={src} width={width} height={height} />
        </div>
      </div>
    </div>
  );
};

export default SvgScroll;