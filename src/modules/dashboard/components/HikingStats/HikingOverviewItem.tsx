import Card from '@/common/components/elements/Card';

interface HikingOverviewItemProps { label: string; value: string; }

const HikingOverviewItem = ({ label, value }: HikingOverviewItemProps) => (
  <Card className='flex flex-col space-y-1 rounded-xl px-4 py-3 border border-neutral-400 bg-neutral-100 dark:border-neutral-900 sm:col-span-1'>
    <span className='text-sm dark:text-neutral-400'>{label}</span>
    <span>{value || '-'}</span>
  </Card>
);

export default HikingOverviewItem;