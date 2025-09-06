import Image from './Image';

// TODO-Pending: Keep for potential use
const TopBar = () => {
  return (
    <div className='hidden items-center justify-center gap-x-2 bg-cover bg-no-repeat p-2.5 text-sm shadow-lg backdrop-blur-2xl dark:border-b dark:border-neutral-800 dark:text-neutral-300 xl:flex'>
      <span>🚀</span>
      <span>Just launched my landing page website. check it out :</span>
      <a href='https://lucasmorris.com/?utm_source=lucas.untethered4life.com&utm_medium=referral&ref=lucas.untethered4life.com' target='_blank' className='ml-0.5 underline'> lucasmorris.com</a>
      <Image src='/images/dot_new_animated.svg' width={30} height={30} alt='new' />
    </div>
  );
};

export default TopBar;
