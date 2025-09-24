import clsx from "clsx";
import { useState } from "react";
import { toast } from 'react-hot-toast';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  setStartDate: React.Dispatch<React.SetStateAction<string>>;
  setEndDate: React.Dispatch<React.SetStateAction<string>>;
  minDate?: string; // ISO string
  maxDate?: string; // ISO string
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ startDate, endDate, setStartDate, setEndDate, minDate, maxDate }) => {
  const [startInput, setStartInput] = useState(startDate);
  const [endInput, setEndInput] = useState(endDate);
 
  // Helper: clamp date to min/max
  const clampDate = (date: string) => {
    const d = new Date(date);
    if (minDate && d < new Date(minDate)) return minDate;
    if (maxDate && d > new Date(maxDate)) return maxDate;
    return date;
  };

  // Helper: check and clamp range, show toast if needed
  const maxRange = 2 * 365; // days
  const checkAndClampRange = (changedField: 'start' | 'end', newValue: string) => {
    let from = changedField === 'start' ? newValue : startInput;
    let to = changedField === 'end' ? newValue : endInput;
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Math.abs((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) > maxRange) {
      toast('Date range cannot exceed 2 years. Adjusted automatically.', { icon: '⚠️' });
      if (changedField === 'start') {
        // Clamp endInput to 2 years after new start
        const limitedTo = new Date(fromDate);
        limitedTo.setDate(limitedTo.getDate() + maxRange);
        setEndInput(limitedTo.toISOString().split('T')[0]);
      } else {
        // Clamp startInput to 2 years before new end
        const limitedFrom = new Date(toDate);
        limitedFrom.setDate(limitedFrom.getDate() - maxRange);
        setStartInput(limitedFrom.toISOString().split('T')[0]);
      }
    }
  };

  // Enforce 2-year range on apply
  const handleApply = () => {
    let from = clampDate(startInput);
    let to = clampDate(endInput);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const maxRange = 2 * 365; // days
    if ((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24) > maxRange) {
      // If range exceeds 2 years, set to to 2 years after from
      const limitedTo = new Date(fromDate);
      limitedTo.setDate(limitedTo.getDate() + maxRange);
      to = limitedTo.toISOString().split('T')[0];
    }
    setStartDate(from);
    setEndDate(to);
  };

  return ( // flex-1 px-4 py-2 text-center font-medium border-x border-t border-neutral-800 dark:border-neutral-400'} bg-[rgba(106,106,128)] text-neutral-100 dark:bg-[rgba(106,106,128)] dark:text-neutral-900 md:rounded-tl
    <div className='absolute top-4 right-4 flex gap-2 items-center'>
      <div className="text-neutral-800 dark:text-neutral-400">From:</div>
      <DatePicker
        selected={new Date(startInput)}
        onChange={(date: Date | null) => {
          if (!date) return;
          let iso = date.toISOString().split('T')[0];
          iso = clampDate(iso);
          setStartInput(iso);
          checkAndClampRange('start', iso);
        }}
        minDate={minDate ? new Date(minDate) : undefined}
        maxDate={maxDate ? new Date(maxDate) : undefined}
        className='w-[120px] rounded border px-2 py-1 text-sm border-neutral-400 bg-neutral-100 dark:border-neutral-900 dark:text-neutral-800'
        placeholderText='Start Date'
      />
      
      <div className="text-neutral-800 dark:text-neutral-400">To:</div>
      <DatePicker
        selected={new Date(endInput)}
        onChange={(date: Date | null) => {
          if (!date) return;
          let iso = date.toISOString().split('T')[0];
          iso = clampDate(iso);
          setEndInput(iso);
          checkAndClampRange('end', iso);
        }}
        minDate={minDate ? new Date(minDate) : undefined}
        maxDate={maxDate ? new Date(maxDate) : undefined}
        className='w-[120px] rounded border px-2 py-1 text-sm border-neutral-400 bg-neutral-100 dark:border-neutral-900 dark:text-neutral-800'
        placeholderText='End Date'
      />
      
      <button type='button' onClick={handleApply} className={clsx('rounded bg-neutral-400 dark:bg-[rgba(106,106,128)] dark:text-neutral-800 text-white hover:bg-neutral-500 hover:dark:bg-[rgba(106, 106, 148)] px-3 py-1 text-sm')}>
        Apply
      </button>
    </div>
  );
};

export default DateRangeSelector;