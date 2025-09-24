import clsx from 'clsx';
import React, { useId, useState } from 'react';

// Responsive scaling CSS for heatmap
const heatmapResponsiveStyle = `
  @media (max-width: 690px) {
    .heatmap-responsive {
      width: 100vw;
      max-width: 100vw;
      transform: scale(calc(0.85 + 0.15 * ((100vw - 320px) / 370)));
      transform-origin: top left;
    }
  }
`;
import Card from '@/common/components/elements/Card';
import { HeatmapDisplayProps } from '@/common/types/spotify';
import { addDays, endOfWeek, format, setISOWeek, startOfWeek } from 'date-fns';
import { motion } from 'framer-motion';

const Heatmap = ({ hourlyMap, sortedWeekdays, weekdayMap, monthlyMap }: HeatmapDisplayProps) => {
  const [resolution, setResolution] = useState<'Hourly' | 'Daily' | 'Monthly'>('Hourly');
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;
  const uniqueId = useId();

  // Dynamic scale for mobile responsiveness
  const [scale, setScale] = useState(1);
  React.useEffect(() => {
    const handleResize = () => {
      setScale(window.innerWidth < 690 ? 0.7 : 1);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxHourlyCount = Math.max(...Array.from(hourlyMap.entries()).flatMap(([_, weekMap]) => Array.from(weekMap.entries()).flatMap(([_, hourArray]) => hourArray)));
  const maxDailyCount = Math.max(...Array.from(weekdayMap.values()).flatMap(({ counts }) => counts.filter((count): count is number => count !== null)));
  const maxMonthlyCount = Math.max(...Array.from(monthlyMap.values()).flat().filter((count): count is number => count !== null));

  const getIntensityClass = (count: (number | null)) => {
    if(count === null || count === undefined) return 'bg-neutral-700';
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
    if (ratio === 0) return 'bg-neutral-300';
    if (ratio < 0.2) return 'bg-rose-400';
    if (ratio < 0.4) return 'bg-rose-600';
    if (ratio < 0.6) return 'bg-rose-700';
    if (ratio < 0.8) return 'bg-rose-800';
    return 'bg-rose-900';
  };

  const sortedWeeks = [...weekdayMap.entries()].sort(([, a], [, b]) => a.start.getTime() - b.start.getTime());

  const totalPages = Math.ceil(sortedWeeks.length / pageSize);
  const paginatedWeeks = sortedWeeks.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  const weekKeys = Array.from(hourlyMap.keys()).sort();
  const [weekIndex, setWeekIndex] = useState(0);
  const currentWeekKey = weekKeys[weekIndex];

  const safeWeekKey = currentWeekKey ?? '';
  const [yearStr, weekStr] = safeWeekKey.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);

  const currentWeekMap = hourlyMap.get(currentWeekKey) ?? new Map();
  const currentYear = new Date().getFullYear();

  let formattedWeekRange = '';
  if (!isNaN(year) && !isNaN(week)) {
    const baseDate = setISOWeek(new Date(`${year}-01-04`), week); // Jan 4 is always in week 1
    const currentWeekStart = startOfWeek(baseDate, { weekStartsOn: 0 });
    const currentWeekEnd = endOfWeek(baseDate, { weekStartsOn: 0 });
    formattedWeekRange = `${format(currentWeekStart, 'EEE M/d')}/${year-2000} – ${format(currentWeekEnd, 'EEE M/d')}/${year-2000}`;
  }

  return (
    <>
      <style>{heatmapResponsiveStyle}</style>
      <motion.div layout initial={{ opacity: 0.8, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }} className='col-span-6 h-full'>
        <Card className='heatmap-responsive col-span-6 h-full rounded-xl border border-neutral-400 bg-neutral-100 p-3 pb-2 dark:border-neutral-900 mb-4'>
          <div className='flex items-center justify-between mb-1'>
            <div className='text-sm dark:text-neutral-400'>Listening Times</div>
            <div className='flex gap-3 items-center'>
              {['Hourly', 'Daily', 'Monthly'].map(option => (
                <label key={option} className='text-sm text-neutral-600 dark:text-neutral-400 flex items-center'>
                  <input type='radio' name={`resolution-${uniqueId}`} value={option} checked={resolution === option} onChange={() => setResolution(option as any)} className='mr-1 accent-rose-600' />
                  {option}
                </label>
              ))}
            </div>
          </div>
          <div className='flex justify-center'>
            {resolution === 'Hourly' && (
              <div className='space-y-2'>
                {/* Hourly Grid */}
                <div
                  className='grid'
                  style={{
                    gridTemplateColumns: `${29 * scale}px repeat(24, ${20 * scale}px)`,
                    gap: `${2 * scale}px`,
                    width: '100%',
                    maxWidth: '100vw',
                  }}
                >
                  <div></div>
                  {[...Array(24)].map((_, hour) => (
                    <div key={`hour-${hour}`} style={{ fontSize: `${12 * scale}px` }} className='text-neutral-500 text-center'>{hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}</div>
                  ))}

                  {/* Render each weekday row */}
                  {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(weekday => {
                    const hourly_plays = hourlyMap.get(weekKeys[weekIndex])?.get(weekday) ?? Array(24).fill(0);
                    return (
                      <React.Fragment key={weekday}>
                        <div style={{ fontSize: `${12 * scale}px` }} className='text-neutral-500 text-right pr-1'>{weekday.substring(0, 3)}</div>
                        {hourly_plays.map((count, hour) => (
                          <div key={`${weekday}-${hour}`} style={{ height: `${20 * scale}px`, width: `${20 * scale}px` }} className={clsx('rounded-sm cursor-default', getIntensityClass(count))} title={`${weekday} ${hour}:00 : ${count} plays`} />
                        ))}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Arrow Controls - now below heatmap */}
                <div className='flex items-center justify-center gap-4 mt-4 pt-3'>
                  <button disabled={weekIndex === 0} onClick={() => setWeekIndex(i => Math.max(i - 1, 0))} className='flex px-4 py-2 w-24 h-10 items-center justify-center rounded-lg text-3xl
                    bg-gradient-to-tr from-purple-400 to-purple-700 text-neutral-300 shadow-md hover:opacity-85 hover:scale-105 active:scale-95 transition-colors disabled:opacity-50'>
                    ← 
                  </button>
                  <div className='px-4 py-2 text-neutral-800 dark:text-neutral-300'>
                    {formattedWeekRange}
                  </div>
                  <button disabled={weekIndex === weekKeys.length - 1} onClick={() => setWeekIndex(i => Math.min(i + 1, weekKeys.length - 1))} className='flex px-4 py-2 w-24 h-10 items-center justify-center rounded-lg text-3xl
                    bg-gradient-to-tr from-purple-400 to-purple-700 text-neutral-300 shadow-md hover:opacity-85 hover:scale-105 active:scale-95 transition-colors disabled:opacity-50'>
                     → </button>
                </div>
              </div>
            )}
            {resolution === 'Daily' && (
              <div
                className='grid'
                style={{
                  gridTemplateColumns: `${120 * scale}px repeat(7, ${20 * scale}px)`,
                  gap: `${2 * scale}px`,
                  width: '100%',
                  maxWidth: '100vw',
                }}
              >
                <div></div>
                {['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'].map(day => (
                  <div key={day} style={{ fontSize: `${12 * scale}px` }} className='text-neutral-500 text-center'>{day}</div>
                ))}
                {paginatedWeeks.map(([label, { start, counts }]) => (
                  <React.Fragment key={label}>
                    <div style={{ fontSize: `${12 * scale}px` }} className='text-neutral-500 text-right pr-1'>{format(start, "MMM d ''yy")}</div>
                    {counts.map((count, i) => { 
                      const cellDate = addDays(start, i);
                      const dateLabel = format(cellDate, 'EEE, MMM d', { weekStartsOn: 0 }); // e.g., "Tue, Jul 30"
                      const title = count === null || count === undefined ? `${dateLabel}: No data` : `${dateLabel}: ${count} plays`;
                      return ( <div key={`${label}-${i}`} style={{ height: `${20 * scale}px`, width: `${20 * scale}px` }} className={clsx('rounded-sm cursor-default', getIntensityClass(count))} title={title} /> );
                    })}
                  </React.Fragment>
                ))}

                {totalPages > 1 && (
                  <div className='col-span-8 flex justify-end gap-2 mt-2'>
                    <button className='flex px-4 py-2 w-24 h-10 items-center justify-center rounded-lg text-3xl
                    bg-gradient-to-tr from-purple-400 to-purple-700 text-neutral-300 shadow-md hover:opacity-85 hover:scale-105 active:scale-95 transition-colors disabled:opacity-50' onClick={() => setPageIndex(i => Math.max(i - 1, 0))} disabled={pageIndex === 0}>←</button>
                    <button className='flex px-4 py-2 w-24 h-10 items-center justify-center rounded-lg text-3xl
                    bg-gradient-to-tr from-purple-400 to-purple-700 text-neutral-300 shadow-md hover:opacity-85 hover:scale-105 active:scale-95 transition-colors disabled:opacity-50' onClick={() => setPageIndex(i => Math.min(i + 1, totalPages - 1))} disabled={pageIndex >= totalPages - 1}>→</button>
                  </div>
                )}
              </div>
            )}
            {resolution === 'Monthly' && (
              <div
                className='grid'
                style={{
                  gridTemplateColumns: `${40 * scale}px repeat(12, ${20 * scale}px)`,
                  gap: `${2 * scale}px`,
                  width: '100%',
                  maxWidth: '100vw',
                }}
              >
                <div></div>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(month => (
                  <div key={month} style={{ fontSize: `${12 * scale}px` }} className='text-neutral-500 text-center'>{month}</div>
                ))}

                {[...monthlyMap.entries()]
                  .sort(([a], [b]) => parseInt(a) - parseInt(b)) // sort by year label
                  .map(([yearLabel, monthlyCounts]) => (
                    <React.Fragment key={yearLabel}>
                      <div style={{ fontSize: `${12 * scale}px` }} className='text-neutral-500 text-right pr-1'>{yearLabel}</div>
                      {monthlyCounts.map((count, i) => {
                        const monthName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i];
                        const title = count === null ? `${monthName}: No data` : `${monthName}: ${count} plays`;
                        return (
                          <div
                            key={`${yearLabel}-${i}`}
                            style={{ height: `${20 * scale}px`, width: `${20 * scale}px` }}
                            className={clsx('rounded-sm cursor-default', getIntensityClass(count))}
                            title={title}
                          />
                        )
                      })}
                    </React.Fragment>
                  ))}
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </>
  );
};

export default Heatmap;