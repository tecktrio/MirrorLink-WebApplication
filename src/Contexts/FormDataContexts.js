
import React, { createContext, useState } from "react";

// Create a context
export const FormDataContext = createContext();

// Create a provider component
export const FormDataContextProvider = ({ children }) => {
  const [formdata, setformdata] = useState({
    'username':'',
    'password':'',
    'email':'',
    'contact':'',
    'site_name':'',
    'site_description':''
  });

  return (
    <FormDataContext.Provider value={{ formdata, setformdata}}>
      {children}
    </FormDataContext.Provider>
  );
};
