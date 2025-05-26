import React, { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { generateToken } from "../utils/livekit-token";

interface LiveKitContextType {
  generateToken: () => Promise<{ url: string; token: string }>;
}

const LiveKitContext = createContext<LiveKitContextType | null>(null);

export const LiveKitProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const contextValue: LiveKitContextType = {
    generateToken,
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
    throw new Error("useLiveKit must be used within a LiveKitProvider");
  }
  return context;
};
