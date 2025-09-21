import Card from '@/common/components/elements/Card';
import Heatmap from './Heatmap';

interface HeatmapProps { spotifyStats: any; hourlyMap: Map<string, number[]>; sortedWeekdays: string[]; weekdayMap: Map<string, { start: Date, counts: (number | null)[]}>; monthlyMap: Map<string, (number | null)[]>; maxPlays: number; }
interface SpotifyStatItem { name?: string; value?: string; title?: string; artists?: string; songUrl?: string;   explicit?: boolean; common_album?: { image?: string }; image?: string; artist_url?: string; }

const Overview = ({ spotifyStats, hourlyMap, sortedWeekdays, weekdayMap, monthlyMap, maxPlays }: HeatmapProps) => {
  return (
      <div className='grid grid-cols-8 gap-4 mb-3'>
        {spotifyStats?.[0]?.data?.map((subItem: SpotifyStatItem) => 'value' in subItem ? (
            <Card key={subItem.name} className='flex flex-col col-span-2 h-full space-y-1 rounded-xl px-4 py-3 border border-neutral-400 bg-neutral-100 dark:border-neutral-900 sm:col-span-2'>
              <span className='text-sm dark:text-neutral-400'>{subItem.name}</span>
              <span>{subItem.value || '-'}</span>
            </Card>
          ) : null
        )}
        {/* Heatmap Column */}
        <Heatmap hourlyMap={hourlyMap} sortedWeekdays={sortedWeekdays} weekdayMap={weekdayMap} monthlyMap={monthlyMap} maxPlays={maxPlays} />
      </div>
  )
};

export default Overview;