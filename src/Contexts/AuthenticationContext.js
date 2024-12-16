import { createContext, useState } from "react";
import Cookies from 'js-cookie'
import { Navigate, useNavigate } from "react-router-dom";
import Loginpage from "../pages/loginpage/Loginpage";
// export const AuthenticationContext = createContext()


export const AuthenticationContextWrapper = ({children})=>{


    let nav = useNavigate()
    let key = Cookies.get('login_key')
    if(key)return children
    else nav('/login')
    
   
}
