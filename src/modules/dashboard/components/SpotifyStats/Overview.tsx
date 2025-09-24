import React from 'react';
import Card from '@/common/components/elements/Card';
import Heatmap from './Heatmap';

interface OverviewProps {
  spotifyStats: any[];
  hourlyMap: Map<string, Map<string, number[]>>;
  sortedWeekdays: string[];
  weekdayMap: Map<string, {start: Date, counts: (number | null)[]}>;
  monthlyMap: Map<string, (number | null)[]>;
  maxPlays: number;
}

const Overview = ({ spotifyStats, hourlyMap, sortedWeekdays, weekdayMap, monthlyMap, maxPlays }: OverviewProps) => {
  const peakHour = Array.from(hourlyMap.values()).reduce((acc, dayPlays) => { 
      Array.from(dayPlays.entries()).forEach(([hour, plays]) => { acc[Number(hour)] = (acc[Number(hour)] || 0) + plays; });
      return acc;
    }, Array(24).fill(0)).reduce((maxHour, plays, hour, arr) => plays > arr[maxHour] ? hour : maxHour, 0
    );

  const formatHour = (hour: number) => hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`;

  const totalHourlyPlays = Array.from(hourlyMap.values())
    .flatMap(dayMap => Array.from(dayMap.values()).flat())
    .reduce((a, b) => a + b, 0);

  // Find the most active day by iterating through all days in weekdayMap
  let mostActiveDay: Date | null = null;
  let mostActiveDayPlays = 0;
  
  
  // Get the first week's data to determine how many days per week we have
  const firstWeek = Array.from(weekdayMap.values())[0];
  const daysPerWeek = firstWeek ? firstWeek.counts.length : 7; // fallback to 7 days
  
  
  for (let dayOfWeek = 0; dayOfWeek < daysPerWeek; dayOfWeek++) {
    for (const weekData of weekdayMap.values()) {
      if (weekData.counts[dayOfWeek] != null && weekData.counts[dayOfWeek]! > 0) {
        const plays = weekData.counts[dayOfWeek]!; // Non-null assertion since we checked above
        if (plays > mostActiveDayPlays) {
          mostActiveDayPlays = plays;
          // Calculate the actual date for this day
          const date = new Date(weekData.start);
          date.setDate(date.getDate() + dayOfWeek);
          mostActiveDay = date;
        }
      }
    }
  }

  function formatDateLabel(date: Date) {
    if (isNaN(date.getTime())) return 'Invalid Date'; // fallback if invalid
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return (
    <>
      <div className='grid grid-cols-1 md:grid-cols-5 gap-4 mb-4'>
        {/* Top Row Metrics */}
        <div className='md:col-span-5 grid grid-cols-2 md:grid-cols-5 gap-4'>
          {spotifyStats[0].data.map((subItem: any) =>
            'value' in subItem ? (
              <Card key={subItem.name} className='flex flex-col space-y-1 rounded-xl px-4 py-3 border border-neutral-400 bg-neutral-100 dark:border-neutral-900'>
                <span className='text-xs font-medium text-neutral-500 dark:text-neutral-400 tracking-wide uppercase'> {subItem.name} </span>
                <span className='text-lg font-semibold text-neutral-800 dark:text-neutral-100'> {subItem.value || '-'} </span>
              </Card>
            ) : null
          )}
        </div>
        <div className='col-span-4'>
          <Heatmap hourlyMap={hourlyMap} sortedWeekdays={sortedWeekdays} weekdayMap={weekdayMap} monthlyMap={monthlyMap} maxPlays={maxPlays} />
        </div>
        <div className='md:col-span-1 flex flex-col gap-4'>
          <Card className='flex flex-col space-y-1 rounded-xl px-4 py-3 border border-neutral-400 bg-neutral-100 dark:border-neutral-900'>
            <span className='text-xs font-medium text-neutral-500 dark:text-neutral-400 tracking-wide uppercase'>Peak Hour</span>
            <span className='text-lg font-semibold text-neutral-800 dark:text-neutral-100'>
              {formatHour(peakHour)}
            </span>
          </Card>
          <Card className='flex flex-col space-y-1 rounded-xl px-4 py-3 border border-neutral-400 bg-neutral-100 dark:border-neutral-900'>
            <span className='text-xs font-medium text-neutral-500 dark:text-neutral-400 tracking-wide uppercase'>Top Day</span>
            <span className='text-lg font-semibold text-neutral-800 dark:text-neutral-100'>
              {mostActiveDay ? `${formatDateLabel(mostActiveDay)} ${mostActiveDayPlays} Plays` : '-'}
            </span>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Overview;