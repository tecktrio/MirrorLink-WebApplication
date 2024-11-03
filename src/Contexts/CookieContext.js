
import React, { createContext, useState } from "react";

// Create a context
export const CookieContext = createContext();

// Create a provider component
export const CookieContextProvider = ({ children }) => {


    function setCookie(name, value, days) {
        console.log('setting')
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
    }
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    }
        

  return (
    <CookieContext.Provider value={{ setCookie, getCookie}}>
      {children}
    </CookieContext.Provider>
  );
};
