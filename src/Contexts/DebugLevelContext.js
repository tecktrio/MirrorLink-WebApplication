
import React, { createContext, useState } from "react";

// Create a context
export const DebugLevelLoginContext = createContext();

// Options- 1 (Low), 2 (Meduim), 3 (High)
const DEFAULT_DEBUG_LEVEL = 3
// Create a provider component
export const DebugLevelContextProvider = ({ children }) => {
  const [DEBUG_LEVEL, SET_DEBUG_LEVEL] = useState(DEFAULT_DEBUG_LEVEL);

  return (
    <DebugLevelLoginContext.Provider value={{ DEBUG_LEVEL, SET_DEBUG_LEVEL}}>
      {children}
    </DebugLevelLoginContext.Provider>
  );
};
