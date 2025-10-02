import clsx from 'clsx';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import { ReactNode, useRef } from 'react';
import useHasMounted from '@/common/hooks/useHasMounted';
import HeaderSidebar from './header/HeaderSidebar';
import HeaderTop from './header/HeaderTop';
import NowPlayingBar from '../elements/NowPlayingBar';
import NowPlayingCard from '../elements/NowPlayingCard';
import useIsMobile from '@/common/hooks/useIsMobile';

interface LayoutProps { children: ReactNode; }

const Layout = ({ children }: LayoutProps) => {
  const ref = useRef<HTMLElement>(null!) as React.RefObject<HTMLElement>;
  const isMobile = useIsMobile(ref);
  const { resolvedTheme } = useTheme();
  const hasMounted = useHasMounted();

  const isDarkTheme = hasMounted && (resolvedTheme === 'dark' || resolvedTheme === 'system');

  const router = useRouter();
  const pageName = router.pathname.split('/')[1];
  const isFullPageHeader = pageName === 'playground' || pageName === 'blog' || router.pathname.startsWith('/blog/') || router.pathname.startsWith('/snippets/') || router.pathname.startsWith('/projects/');

  return (
    <>
      <div className={clsx('w-full', isDarkTheme ?  '[background-image:url(/gravel.svg)]' : '[background-image:url(/gravel_light.svg)] filter brightness-115 saturate-115')}>
        <div className={clsx(
          'bg-[linear-gradient(to_right,_rgba(197,197,255,0.8),_rgba(230,230,247,0.7),_rgba(197,197,255,0.8))]',
          'dark:bg-[linear-gradient(to_right,_rgba(40,30,60,0.5),_rgba(20,20,40,0.4),_rgba(40,30,60,0.5))]')}>
        <div className={clsx('flex flex-col justify-between mx-auto w-full max-w-6xl', isDarkTheme && 'dark:text-darkText')} style={{ minHeight: '100vh'}}>
          {isFullPageHeader ?
            (<div className='flex flex-col xl:pb-8'>
              <HeaderTop />
              <main className="transition-all duration-300 flex-grow">
                {children}
              </main>
            </div>)
            : (<div className='flex flex-col lg:flex-row lg:gap-2 lg:py-4 xl:pb-8 flex-grow'>
              <HeaderSidebar />
              <main className="transition-all duration-300 lg:w-4/5 flex-grow">
                {children}
              </main>
            </div>)}
        </div>
        </div>
      </div>
      {hasMounted && (isMobile ? <NowPlayingCard /> : <NowPlayingBar />)}
    </>
  );
};

export default Layout;
