const Introduction = () => {
  // TODO-Pending: Replace waving hand, I don't like it. Commented out for now.
  return (
    <section className='bg-cover bg-no-repeat '>
      <div className='space-y-3'>
        <div className='flex gap-2  text-2xl  text-neutral-700 dark:text-neutral-300 font-medium lg:text-3xl'>
          <h1>Hi, I&apos;m Luke</h1>{' '}
          {/* <div className='ml-1 animate-waving-hand'>👋</div> */}
        </div>
        <div className='space-y-4'>
          <ul className='ml-5 flex list-disc flex-col gap-1 text-neutral-800 dark:text-neutral-400 lg:flex-row lg:gap-10'>
            <li>Broomfield, Colorado<sup className='ml-1'>USA</sup></li>
            <li>Seeking Opportunities</li>
          </ul>
        </div>
      </div>

      <p className='mt-6 leading-[1.8] text-neutral-700 dark:text-neutral-300 md:leading-loose'>
        <strong>Leader. Explorer. Tinkerer. Gamer. Lifelong learner.</strong> Often, I'm spending time building an app, optimizing my smart home 
        AV distribution system, or fiddling with some new gadget. When I&apos;m not deep in a technical rabbit hole, you&apos;ll find me off-grid
        in the Colorado Rockies hiking, dancing unapologetically to live music, or passing through customs on the start of my next adventure!
      </p>
    </section>
  );
};

export default Introduction;
