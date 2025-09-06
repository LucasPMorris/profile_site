import clsx from 'clsx';
import React from 'react';
import Card from '@/common/components/elements/Card';

interface HeatmapProps { spotifyStats: any; weekdayMap: Map<string, number[]>; sortedWeekdays: string[]; weekdayDateMap: Map<string, string[]>; maxPlays: number; }

const Heatmap = ({ spotifyStats, weekdayMap, sortedWeekdays, weekdayDateMap, maxPlays }: HeatmapProps) => {
  const maxHourlyCount = Math.max(...Array.from(weekdayMap.values()).flat());
    
  const getIntensityClass = (count: number) => {
    const ratio = count / maxHourlyCount;
    if (ratio === 0) return 'bg-neutral-200';
    if (ratio < 0.2) return 'bg-rose-200';
    if (ratio < 0.4) return 'bg-rose-400';
    if (ratio < 0.6) return 'bg-rose-500';
    if (ratio < 0.8) return 'bg-rose-700';
    return 'bg-rose-900';
  };

  return (
    <Card className='col-span-6 h-full rounded-xl border border-neutral-400 bg-neutral-100 p-3 pb-2 dark:border-neutral-900 mb-4'>
      <div className='text-sm dark:text-neutral-400 pb-2 mb-2'>Listening Times</div>
      <div className='flex justify-center'>
        <div className='grid grid-cols-[29px_repeat(24,1fr)] gap-[2px]'>
          {/* Header row: empty cell + hour labels */}
          <div></div>
          {[...Array(24)].map((_, hour) => (
            <div key={`hour-${hour}`} className='text-[12px] text-neutral-500 text-center'>
              {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
            </div>
          ))}

          {/* Weekday rows */}
          {sortedWeekdays.map(weekday => {
            const hourly_plays = weekdayMap.get(weekday)!;
            return (
              <React.Fragment key={weekday}>
                <div key={`label-${weekday}`} className='text-[12px] text-neutral-500 text-right pr-1'>{weekday}</div>
                {hourly_plays.map((count, hour) => ( <div key={`${weekday}-${hour}`} className={clsx('h-5 w-5 rounded-sm', getIntensityClass(count))} title={`${weekday} ${hour}:00 : ${count} plays`} /> ))}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default Heatmap;