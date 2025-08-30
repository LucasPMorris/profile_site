import SpotifyOverviewItem from './SpotifyOverviewItem';

const SpotifyOverview = ({ data }: { data: any }) => {
  // const totalPlays = data?.recentlyPlayed?.length ?? 0;

  // const firstDate = new Date(data?.recentlyPlayed?.at(-1)?.played_at ?? '');
  // const lastDate = new Date(data?.recentlyPlayed?.[0]?.played_at ?? '');
  // const days = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
  // const avgPerDay = (totalPlays / days).toFixed(1);

  // const explicitCount = data?.recentlyPlayed?.filter(track => track.explicit).length ?? 0;
  // const percentExplicit = ((explicitCount / totalPlays) * 100).toFixed(1);

  // return (
  //   <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4'>
  //     <SpotifyOverviewItem label='Total Plays' value={`${totalPlays}`} />
  //     <SpotifyOverviewItem label='Avg Songs/Day' value={`${avgPerDay}`} />
  //     <SpotifyOverviewItem label='Explicit Content' value={`${percentExplicit}%`} />
  //     <SpotifyOverviewItem label='Date Range' value={`${firstDate.toLocaleDateString()} – ${lastDate.toLocaleDateString()}`} />
  //   </div>
  // );
  return (
    <span>Overview PlaceHolder</span>
  )
};


export default SpotifyOverview;