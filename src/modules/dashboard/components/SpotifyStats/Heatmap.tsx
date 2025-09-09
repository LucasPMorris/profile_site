import clsx from 'clsx';
import React, { useState } from 'react';
import Card from '@/common/components/elements/Card';
import { HeatmapDisplayProps } from '@/common/types/spotify';
import { addDays, format } from 'date-fns';

const Heatmap = ({ hourlyMap, sortedWeekdays, weekdayMap, monthlyMap }: HeatmapDisplayProps) => {
  const [resolution, setResolution] = useState<'Hourly' | 'Daily' | 'Monthly'>('Hourly');
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;

  const maxHourlyCount = Math.max(...Array.from(hourlyMap.values()).flat());
  const maxDailyCount = Math.max(...Array.from(weekdayMap.values()).flatMap(({ counts }) => counts));
  const maxMonthlyCount = Math.max(...Array.from(monthlyMap.values()).flat());

  const getIntensityClass = (count: number) => {
    let ratio = 1;
    switch (resolution) {
      case 'Hourly': 
        ratio = count / maxHourlyCount;
        break;
      case 'Daily': 
        ratio = count / maxDailyCount;
        break;
      case 'Monthly': 
        ratio = count / maxMonthlyCount;
        break;
      default: 'bg-neutral-200';
    }
    if (ratio === 0) return 'bg-neutral-200';
    if (ratio < 0.2) return 'bg-rose-200';
    if (ratio < 0.4) return 'bg-rose-400';
    if (ratio < 0.6) return 'bg-rose-500';
    if (ratio < 0.8) return 'bg-rose-700';
    return 'bg-rose-900';
  };

  const sortedWeeks = [...weekdayMap.entries()].sort(([, a], [, b]) => a.start.getTime() - b.start.getTime());

  const totalPages = Math.ceil(sortedWeeks.length / pageSize);
  const paginatedWeeks = sortedWeeks.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);


  return (
    <Card className='col-span-6 h-full rounded-xl border border-neutral-400 bg-neutral-100 p-3 pb-2 dark:border-neutral-900 mb-4'>
      <div className='flex items-center justify-between mb-1'>
        <div className='text-sm dark:text-neutral-400'>Listening Times</div>
        <div className='flex gap-3 items-center'>
          {['Hourly', 'Daily', 'Monthly'].map(option => (
            <label key={option} className='text-sm text-neutral-600 dark:text-neutral-400 flex items-center'>
              <input
                type='radio'
                name='resolution'
                value={option}
                checked={resolution === option}
                onChange={() => setResolution(option as any)}
                className='mr-1 accent-rose-600'
              />
              {option}
            </label>
          ))}
        </div>
      </div>
      <div className='flex justify-center'>
        {resolution === 'Hourly' && (
          <div className='grid grid-cols-[29px_repeat(24,1fr)] gap-[2px]'>
            <div></div>
            {[...Array(24)].map((_, hour) => (
              <div key={`hour-${hour}`} className='text-[12px] text-neutral-500 text-center'>
                {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
              </div>
            ))}
            {sortedWeekdays.map(weekday => {
              const hourly_plays = hourlyMap.get(weekday)!;
              return (
                <React.Fragment key={weekday}>
                  <div className='text-[12px] text-neutral-500 text-right pr-1'>{weekday}</div>
                  {hourly_plays.map((count, hour) => (
                    <div
                      key={`${weekday}-${hour}`}
                      className={clsx('h-5 w-5 rounded-sm cursor-default', getIntensityClass(count))}
                      title={`${weekday} ${hour}:00 : ${count} plays`}
                    />
                  ))}
                </React.Fragment>
              );
            })}
          </div>
        )}
        {resolution === 'Daily' && (
          <div className='grid grid-cols-[120px_repeat(7,1fr)] gap-[2px]'>
            <div></div>
            {['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'].map(day => (
              <div key={day} className='text-[12px] text-neutral-500 text-center'>{day}</div>
            ))}

            {paginatedWeeks.map(([label, { start, counts }]) => (
              <React.Fragment key={label}>
                <div className='text-[12px] text-neutral-500 text-right pr-1'>{label}</div>
                {counts.map((count, i) => { 
                  const cellDate = addDays(start, i - 1);
                  const dateLabel = format(cellDate, 'EEE, MMM d'); // e.g., "Tue, Jul 30"
                  return ( <div key={`${label}-${i}`} className={clsx('h-5 w-5 rounded-sm cursor-default', getIntensityClass(count))} title={`${dateLabel}: ${count} plays`}/> );
                })}
              </React.Fragment>
            ))}

            {totalPages > 1 && (
              <div className='col-span-8 flex justify-end gap-2 mt-2'>
                <button className='px-2 py-1 text-sm border rounded disabled:opacity-50' onClick={() => setPageIndex(i => Math.max(i - 1, 0))} disabled={pageIndex === 0}>Prev</button>
                <button className='px-2 py-1 text-sm border rounded disabled:opacity-50' onClick={() => setPageIndex(i => Math.min(i + 1, totalPages - 1))} disabled={pageIndex >= totalPages - 1}>Next</button>
              </div>
            )}
          </div>
        )}
        {resolution === 'Monthly' && (
          <div className='grid grid-cols-[40px_repeat(12,1fr)] gap-[2px]'>
            <div></div>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(month => (
              <div key={month} className='text-[12px] text-neutral-500 text-center'>{month}</div>
            ))}

            {[...monthlyMap.entries()]
              .sort(([a], [b]) => parseInt(a) - parseInt(b)) // sort by year label
              .map(([yearLabel, monthlyCounts]) => (
                <React.Fragment key={yearLabel}>
                  <div className='text-[12px] text-neutral-500 text-right pr-1'>{yearLabel}</div>
                  {monthlyCounts.map((count, i) => (
                    <div
                      key={`${yearLabel}-${i}`}
                      className={clsx('h-5 w-5 rounded-sm cursor-default', getIntensityClass(count))}
                      title={`${yearLabel} – ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}: ${count} plays`}
                    />
                  ))}
                </React.Fragment>
              ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default Heatmap;