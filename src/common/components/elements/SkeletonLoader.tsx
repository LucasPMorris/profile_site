import { useTheme } from 'next-themes';
import { ReactNode, useEffect } from 'react';
import { SkeletonTheme } from 'react-loading-skeleton';

import 'react-loading-skeleton/dist/skeleton.css';

type SkeletonLoaderProps = {
  children: ReactNode;
};

const SkeletonLoader = ({ children }: SkeletonLoaderProps) => {
  const { resolvedTheme } = useTheme();
  const [ mounted, setMounted ] = require('react').useState(false);

  useEffect(() => { setMounted(true); }, []);

  const baseColor = mounted && resolvedTheme === 'light' ? '#ebebeb' : '#202020';
  const highlightColor = mounted && resolvedTheme === 'light' ? '#f5f5f5' : '#2e2e2e';

  return (
    <SkeletonTheme baseColor={baseColor} highlightColor={highlightColor}>
      {children}
    </SkeletonTheme>
  );
};

export default SkeletonLoader;
