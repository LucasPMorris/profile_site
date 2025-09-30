import { is } from 'date-fns/locale';
import { useLayoutEffect, useState } from 'react';
// import { useWindowSize } from 'usehooks-ts';

// const useIsMobile = () => {
//   const { width } = useWindowSize();
//   const [isMobile, setIsMobile] = useState(width < 769);

//   useEffect(() => {
//     setIsMobile(width < 821);
//   }, [width]);

//   return isMobile;
// };

const MOBILE_WIDTH = 821;

const useIsMobile = (ref: React.RefObject<HTMLElement>) => {
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    console.log("useIsMobile Debug: ref.current =", ref);
    console.log("useIsMobile Debug: window.innerWidth =", window.innerWidth);
    console.log("useIsMobile Debug: window.screen.width =", window.screen.width);

    if (!ref || !ref.current) {
      setIsMobile(window.innerWidth < MOBILE_WIDTH);
      return;
    }

    const updateSize = () => {
      const width = ref.current ? ref.current.offsetWidth : window.innerWidth;
      setIsMobile(width < MOBILE_WIDTH);
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref]);

  return isMobile;
};

export default useIsMobile;
