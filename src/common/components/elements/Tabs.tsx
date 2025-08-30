import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import clsx from 'clsx';

interface TabProps { label: React.ReactNode; children: React.ReactNode; }
interface TabsProps { tabs: TabProps[]; }

export const Tab = ({ children }: TabProps) => { return <>{children}</>; };

export const Tabs = ({ tabs }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === 'dark' || resolvedTheme === 'system';

  const handleTabClick = (index: number) => { setActiveTab(index); };

  return (
    <div className='rounded'>
      <div className='flex flex-col gap-1.5 sm:flex-row md:gap-1'>
        {tabs.map((tab, index) => (
          <button key={index} className={`flex-1 px-4 py-2 text-center font-medium border-x border-t ${isDarkTheme ? 'border-neutral-800' : 'border-neutral-400'} ${
              activeTab === index
                ? 'bg-[rgba(106,106,128)] text-neutral-100 dark:bg-[rgba(106,106,128)] dark:text-neutral-900'
                : 'bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 hover:dark:text-neutral-200'
            } ${ index === 0 ? 'md:rounded-tl' : index === tabs.length - 1 ? 'md:rounded-tr' : '' }`}
            onClick={() => handleTabClick(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={clsx('px-4 py-8 sm:px-8 border-x border-b border-neutral-400', isDarkTheme ? 'bg-white/5 border-neutral-800' : 'bg-white/40')} >
        <AnimatePresence mode='wait'>
          <motion.div key={activeTab} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} transition={{ duration: 0.5 }} >
            {tabs[activeTab].children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
