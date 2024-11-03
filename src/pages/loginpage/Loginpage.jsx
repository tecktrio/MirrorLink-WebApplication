import React, { useContext, useState } from 'react'
import Inputtextbox from '../../components/inputtextbox/Inputtextbox'
import Submitbutton from '../../components/submitbutton/Submitbutton'
import { FormDataContext } from '../../Contexts/FormDataContexts'
import { MAKE_LOGIN } from '../../serverRequests/ServerRequests'
import { useNavigate } from 'react-router-dom'
import { Navigate_To_Dashboard, Navigate_To_Sitelist } from '../../constants'
import { DebugLevelLoginContext } from '../../Contexts/DebugLevelContext'
import { LoadingStateContext } from '../../Contexts/LoadingStateContext'
import Loadinpage from '../loadingpage/Loadinpage'
import Labelwithdescription from '../../components/labelwithdescription/Labelwithdescription'
import { CookieContext } from '../../Contexts/CookieContext'

export default function Loginpage() {
  const { DEBUG_LEVEL, SET_DEBBUG_LEVEL } = useContext(DebugLevelLoginContext)
  const { setCookie } = useContext(CookieContext)
  const { isLoading, setIsLoading } = useContext(LoadingStateContext)
  const { formdata, setformdata } = useContext(FormDataContext)
  const [username, setusername] = useState(formdata.username)
  const [password, setpassword] = useState(formdata.password)
  const [message, setmessage] = useState('')
  

  const navigate = useNavigate()

  const HandleLogin = async (e) => {
    setformdata({ ...formdata, 'username': username, 'password': password })
    setIsLoading(true)
    e.preventDefault();
    // Assuming MAKE_LOGIN is an async function that handles login
    MAKE_LOGIN(username, password).then((key) => {
      if (DEBUG_LEVEL == 3) { console.log('login Successfull') }
        setIsLoading(false)
        setCookie("login_key",key,1)
        navigate(Navigate_To_Dashboard)
      })
      .catch((error) => {
        console.log(error)
        setIsLoading(false)
        setmessage("Invalid Login Credentials")
      })

  };


  return (
    <>
      {isLoading ?
        <Loadinpage /> :
        <div className='flex w-full mt-5'>

          <div className=' w-full'>
            {/* <p className='text-2xl mx'>Login</p> */}
            <form onSubmit={HandleLogin}>
              <div className='text-left'>
                <Inputtextbox icon={'user.png'} label="Administrator Username" description="Kindly Enter Your Valid Administrator Username" placeholder="Enter username" updatedata={setusername} />

                <Inputtextbox icon={'lock.png'} type="password" label="Administrator Password" description="Enter your Secret Password." placeholder="Enter password" updatedata={setpassword} />
                <p className='text-red-600 mx-2'>{message}</p>



                <div className='flex justify-end p-2' >
                  <Submitbutton text="Login" />
                </div>
              </div>


              <input />
            </form>

            <div>
              <Labelwithdescription label={'Create Account'} description={'If you are new here, we will suggest you to create a new account'} goto={'/register'} />
            </div>
          </div>

        </div>
      }
    </>
  )
}
