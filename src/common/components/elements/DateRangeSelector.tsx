import clsx from "clsx";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DateRangeSelectorProps { startDate: string; endDate: string; setStartDate: React.Dispatch<React.SetStateAction<string>>; setEndDate: React.Dispatch<React.SetStateAction<string>>;}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ startDate, endDate, setStartDate, setEndDate }) => {
  const [startInput, setStartInput] = useState(startDate);
  const [endInput, setEndInput] = useState(endDate);
 
  const handleApply = () => { setStartDate(startInput); setEndDate(endInput); };

  return ( // flex-1 px-4 py-2 text-center font-medium border-x border-t border-neutral-800 dark:border-neutral-400'} bg-[rgba(106,106,128)] text-neutral-100 dark:bg-[rgba(106,106,128)] dark:text-neutral-900 md:rounded-tl
    <div className='absolute top-4 right-4 flex gap-2 items-center'>
      <div className="text-neutral-800 dark:text-neutral-400">From:</div>
      <DatePicker selected={new Date(startInput)} onChange={(date: Date | null) => date && setStartInput(date.toISOString().split('T')[0])} 
        className='w-[120px] rounded border px-2 py-1 text-sm border-neutral-400 bg-neutral-100 dark:border-neutral-900 dark:text-neutral-800' placeholderText='Start Date' />
      
      <div className="text-neutral-800 dark:text-neutral-400">To:</div>
      <DatePicker selected={new Date(endInput)} onChange={(date: Date | null) => date && setEndInput(date.toISOString().split('T')[0])} 
        className='w-[120px] rounded border px-2 py-1 text-sm border-neutral-400 bg-neutral-100 dark:border-neutral-900 dark:text-neutral-800' placeholderText='End Date' />
      
      <button type='button' onClick={handleApply} className={clsx('rounded bg-neutral-400 dark:bg-[rgba(106,106,128)] dark:text-neutral-800 text-white hover:bg-neutral-500 hover:dark:bg-[rgba(106, 106, 148)] px-3 py-1 text-sm')}>
        Apply
      </button>
    </div>
  );
};

export default DateRangeSelector;