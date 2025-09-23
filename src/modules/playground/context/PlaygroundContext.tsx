import React, { createContext, useContext, useState } from 'react';

interface PlaygroundContextType {
  playgroundOpen: boolean;
  setPlaygroundOpen: (open: boolean) => void;
}

const PlaygroundContext = createContext<PlaygroundContextType | undefined>(undefined);

export const PlaygroundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  return (
    <PlaygroundContext.Provider value={{ playgroundOpen, setPlaygroundOpen }}>
      {children}
    </PlaygroundContext.Provider>
  );
};

export function usePlaygroundContext() {
  const ctx = useContext(PlaygroundContext);
  if (!ctx) throw new Error('usePlaygroundContext must be used within PlaygroundProvider');
  return ctx;
}
