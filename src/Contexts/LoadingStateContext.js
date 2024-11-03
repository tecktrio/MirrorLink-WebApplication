
import React, { createContext, useState } from "react";

// Create a context
export const LoadingStateContext = createContext();

// Create a provider component
export const LoginStateContextProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <LoadingStateContext.Provider value={{ isLoading, setIsLoading}}>
      {children}
    </LoadingStateContext.Provider>
  );
};
