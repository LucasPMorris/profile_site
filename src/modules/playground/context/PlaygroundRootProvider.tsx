import React from 'react';
import { PlaygroundProvider } from '@/modules/playground/context/PlaygroundContext';

const PlaygroundRootProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <PlaygroundProvider>{children}</PlaygroundProvider>;
};

export default PlaygroundRootProvider;
