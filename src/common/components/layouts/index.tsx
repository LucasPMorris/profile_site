import clsx from 'clsx';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import { ReactNode } from 'react';
import { useWindowSize } from 'usehooks-ts';

import useHasMounted from '@/common/hooks/useHasMounted';
import HeaderSidebar from './header/HeaderSidebar';
import HeaderTop from './header/HeaderTop';

import NowPlayingBar from '../elements/NowPlayingBar';
import NowPlayingCard from '../elements/NowPlayingCard';

interface LayoutProps { children: ReactNode; }

const Layout = ({ children }: LayoutProps) => {
  const { resolvedTheme } = useTheme();
  const hasMounted = useHasMounted();
  const { width } = useWindowSize();
  const isMobile = width < 480;
  const isDarkTheme = hasMounted && (resolvedTheme === 'dark' || resolvedTheme === 'system');

  const router = useRouter();
  const pageName = router.pathname.split('/')[1];
  const isFullPageHeader = pageName === 'playground' || pageName === 'blog' || router.pathname.startsWith('/blog/') || router.pathname.startsWith('/snippets/');
  const isShowChatButton = pageName !== 'guestbook';

  return (
    <>
      {/* TODO: The next two lines make up the background. Consider both light and dark */}
      <div className={clsx('w-full', isDarkTheme ?  '[background-image:url(/gravel.svg)]' : '[background-image:url(/gravel_light.svg)] filter brightness-115 saturate-115')}>
          <div className={clsx(
            'bg-[linear-gradient(to_right,_rgba(197,197,255,0.8),_rgba(230,230,247,0.7),_rgba(197,197,255,0.8))]',
            'dark:bg-[linear-gradient(to_right,_rgba(40,30,60,0.5),_rgba(20,20,40,0.4),_rgba(40,30,60,0.5))]')}>
          <div className={clsx('mx-auto max-w-6xl flex flex-col justify-between', isDarkTheme ? 'dark:text-darkText' : '' )} style={{ minHeight: '100vh' }}>
            {isFullPageHeader ? 
              (<div className='flex flex-col xl:pb-8'>
                <HeaderTop /><main className='transition-all duration-300 flex-grow'>{children}</main>
              </div>) 
              : (<div className='flex flex-col lg:flex-row lg:gap-2 lg:py-4 xl:pb-8 flex-grow'>
                <HeaderSidebar /><main className='max-w-[915px] transition-all duration-300 lg:w-4/5 flex-grow'>{children}</main>
              </div>)}
          </div>
        </div>
      </div>
      {hasMounted && (isMobile ? <NowPlayingCard /> : <NowPlayingBar />)}
    </>
  );
};

export default Layout;
