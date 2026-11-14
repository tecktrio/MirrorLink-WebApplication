import React, { createContext } from "react";
import Cookies from "js-cookie";

export const CookieContext = createContext();

export const CookieContextProvider = ({ children }) => {
  function setCookie(name, value, days = 30) {
    Cookies.set(name, value, { expires: days, path: "/" });
  }

  function getCookie(name) {
    const val = Cookies.get(name);
    if (val) return val;
    return undefined;
  }

  function removeCookie(name) {
    Cookies.remove(name, { path: "/" });
  }

  return (
    <CookieContext.Provider value={{ setCookie, getCookie, removeCookie }}>
      {children}
    </CookieContext.Provider>
  );
};
