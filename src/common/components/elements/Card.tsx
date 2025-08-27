import styled from '@emotion/styled';
import { ReactNode } from 'react';
import { useTheme } from 'next-themes';
import clsx from 'clsx';

interface CardProps { children: ReactNode; className?: string; [propName: string]: unknown; }

const Card = ({ children, className = '', ...others }: CardProps) => {
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === 'dark' || resolvedTheme === 'system';

  return (
    <StyledCard
      className={clsx('rounded-xl shadow-sm transition-all duration-300', isDarkTheme ? 'bg-white/5' : 'bg-white/60', `${className} `)}
      {...others}
    >
      {children}
    </StyledCard>
  );
};

export default Card;

const StyledCard = styled.div`
  box-shadow: inset 0 0 0 1px hsla(0, 0%, 100%, 0.05);
`;