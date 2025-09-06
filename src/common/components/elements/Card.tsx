import styled from '@emotion/styled';
import { ReactNode } from 'react';
import { useTheme } from 'next-themes';
import clsx from 'clsx';

interface CardProps { children: ReactNode; className?: string; [propName: string]: unknown; }

const Card = ({ children, className = '', ...others }: CardProps) => {
  return (
    <div className={clsx('rounded-xl shadow-sm transition-all duration-30 bg-white/60 dark:bg-white/5 ', `${className} `)}
      {...others}>
      {children}
    </div>
  );
};

export default Card;

// const StyledCard = styled.div` box-shadow: inset 0 0 0 1px hsla(0, 0%, 100%, 0.05);`;