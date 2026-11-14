import { useEffect, useState } from "react";
import Cookies from 'js-cookie'
import { Navigate } from "react-router-dom";
import { CHECK_PLAN } from "../serverRequests/ServerRequests";
// export const AuthenticationContext = createContext()


export const AuthenticationContextWrapper = ({children})=>{
    const [state, setState] = useState('checking')
    useEffect(() => {
        const key = Cookies.get('login_key')
        if (!key) { setState('login'); return }
        CHECK_PLAN(key).then(data => setState(data.plan_active ? 'active' : 'inactive')).catch(() => setState('login'))
    }, [])
    if (state === 'checking') return null
    if (state === 'login') return <Navigate to="/login" replace />
    if (state === 'inactive') return <Navigate to="/pricing" replace />
    return children
}
