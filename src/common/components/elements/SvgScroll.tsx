import { useEffect, useId, useRef, useState } from 'react';

interface SvgScrollProps { src: string; width?: number; height?: number; initialScale?: number; }

const SvgScroll = ({ src, width = 1200, height = 800, initialScale = 1 }: SvgScrollProps) => {
  const [scale, setScale] = useState(initialScale);
  const [needsScroll, setNeedsScroll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const componentId = useId();

  useEffect(() => {
    const checkScroll = () => {
      if (containerRef.current) {
        const { scrollWidth, scrollHeight, clientWidth, clientHeight } = containerRef.current;
        setNeedsScroll(scrollWidth > clientWidth || scrollHeight > clientHeight);
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [scale]);

  return (
    <div key={`SvgScroll-${componentId}`} className="relative my-6 border rounded-lg overflow-auto p-4">
      {/* Zoom Controls */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button onClick={() => setScale((s) => Math.max(0.5, s - 0.1))} className="px-2 py-1 text-sm bg-neutral-300 dark:bg-neutral-700 rounded hover:bg-neutral-400 dark:hover:bg-neutral-600">−</button>
        <button onClick={() => setScale((s) => Math.min(3, s + 0.1))} className="px-2 py-1 text-sm bg-neutral-300 dark:bg-neutral-700 rounded hover:bg-neutral-400 dark:hover:bg-neutral-600">+</button>
      </div>

      {/* SVG Container */}
      <div ref={containerRef} className={needsScroll ? "overflow-auto" : "overflow-hidden"}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width, height }}>
          <img src={src} width={width} height={height} style={{ background: 'transparent' }} alt="Full DB Schema" />
        </div>
      </div>
    </div>
  );
};

export default SvgScroll;