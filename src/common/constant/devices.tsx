import { BsLaptop, BsPhone, BsSpeaker } from 'react-icons/bs';
import { DeviceInfoProps } from '../types/spotify';

const iconSize = 24;
const iconClassName = 'w-auto text-neutral-800 dark:text-neutral-300';

// TODO-Pending: Update with my actual devices
export const PAIR_DEVICES: Record<string, DeviceInfoProps> = {
  Computer: {
    icon: <BsLaptop className={iconClassName} size={iconSize} />,
    model: 'Custom PC',
    id: 'lucasmorris-pc',
  },
  Smartphone: {
    icon: <BsPhone className={iconClassName} size={iconSize} />,
    model: 'Google Pixel 6',
    id: 'lucasmorris-google',
  },
  EchoUpStairs: {
    icon: <BsSpeaker className={iconClassName} size={iconSize} />,
    model: 'EchoDot',
    id: 'lucasmorris-upstairsdot',
  },
  EchoDownStairs: {
    icon: <BsSpeaker className={iconClassName} size={iconSize} />,
    model: 'Echo Dot',
    id: 'lucasmorris-downstairsdot',
  },
};
