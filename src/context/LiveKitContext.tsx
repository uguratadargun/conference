import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { getTokenFromServer } from '../utils/livekit-token';

interface LiveKitContextType {
  generateToken: (
    username?: string,
    roomName?: string
  ) => Promise<{
    url: string;
    token: string;
    roomId: string;
  }>;
}

const LiveKitContext = createContext<LiveKitContextType | null>(null);

export const LiveKitProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const contextValue: LiveKitContextType = {
    generateToken: getTokenFromServer, // Sunucudan token al
  };

  return (
    <LiveKitContext.Provider value={contextValue}>
      {children}
    </LiveKitContext.Provider>
  );
};

export const useLiveKit = () => {
  const context = useContext(LiveKitContext);
  if (!context) {
    throw new Error('useLiveKit must be used within a LiveKitProvider');
  }
  return context;
};
