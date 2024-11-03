
import React, { createContext, useState } from "react";

// Create a context
export const GlobalContext = createContext();

// Create a provider component
export const GlobalContextProvider = ({ children }) => {
  const [DATA, SETDATA] = useState({
    'SOCKET_KEY':'',
    'SELECTED_SITE_ID':'',
    'SELECTED_MIRROR_ID':'',
    'SELECTED_CONTENT_ID':''
  });

  return (
    <GlobalContext.Provider value={{ DATA, SETDATA}}>
      {children}
    </GlobalContext.Provider>
  );
};
