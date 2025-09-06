import Copyright from "./Copyright";

const Footer = () => {
  return (
    <footer className='relative bottom-0 mx-8 w-[-webkit-fill-available] max-w-[790px] space-y-5 border-t border-gray-500 py-6 text-[15px] dark:border-neutral-700 dark:text-neutral-400'>
      <div className='flex justify-center'>
        <Copyright />
      </div>
    </footer>
  );
};

export default Footer;
