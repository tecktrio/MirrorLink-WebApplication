import React, { useContext, useState } from 'react'
import Inputtextbox from '../../components/inputtextbox/Inputtextbox'
import Submitbutton from '../../components/submitbutton/Submitbutton'
import { FormDataContext } from '../../Contexts/FormDataContexts'
import { ESTABLISH_WEBSOCKET_CONNECTION, MAKE_LOGIN, MAKE_REGISTER } from '../../serverRequests/ServerRequests'
import { useNavigate } from 'react-router-dom'
import { Navigate_To_Dashboard, Navigate_To_Sitelist } from '../../constants'
import { DebugLevelLoginContext } from '../../Contexts/DebugLevelContext'
import { LoadingStateContext } from '../../Contexts/LoadingStateContext'
import Loadinpage from '../loadingpage/Loadinpage'
import Labelwithdescription from '../../components/labelwithdescription/Labelwithdescription'

export default function RegisterPage() {
  const { DEBUG_LEVEL, SET_DEBBUG_LEVEL } = useContext(DebugLevelLoginContext)
  const { isLoading, setIsLoading } = useContext(LoadingStateContext)
  const { formdata, setformdata } = useContext(FormDataContext)
  const [username, setusername] = useState(formdata.username)
  const [password, setpassword] = useState(formdata.password)
  const [email, setemail] = useState(formdata.email)
  const [contact, setcontact] = useState(formdata.contact)
  const [profile_image_url, set_profile_image_url] = useState(formdata.profile_image_url)
  const [address_line_1, set_address_line_1] = useState(formdata.address_line_1)
  const [address_line_2, set_address_line_2] = useState(formdata.address_line_2)
  const [address_line_3, set_address_line_3] = useState(formdata.address_line_3)
  const [message, setmessage] = useState('')

  const navigate = useNavigate()

  const HandleLogin = async (e) => {
    setformdata({
      ...formdata,
      'username': username,
      'password': password,
      'email': email,
      'contact': contact,
      'profile_image_url':profile_image_url,
      'address_line_1':address_line_1,
      'address_line_2':address_line_2,
      'address_line_3':address_line_3,
    })
    setIsLoading(true)
    e.preventDefault();
    // Assuming MAKE_LOGIN is an async function that handles login
    MAKE_REGISTER(username, password, email, contact, profile_image_url, address_line_1, address_line_2, address_line_3).then((data) => {

      if (DEBUG_LEVEL == 3) { console.log('Register Successfull') }
      MAKE_LOGIN(username, password).then((res) => {
        ESTABLISH_WEBSOCKET_CONNECTION().then((data) => {
          if (DEBUG_LEVEL == 3) { console.log('socket is ready to rock') }
          setIsLoading(false)
          navigate(Navigate_To_Sitelist)
        }).catch((error) => {
          setIsLoading(false)
          setmessage("Something Went Wrong, Check your Connection.")
        })
      })
      .catch((err)=>console.log(err))

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
        <div className='flex w-full my-5'>

          <div className=' w-full'>
            {/* <p className='text-2xl mx'>Login</p> */}
            <form onSubmit={HandleLogin}>
              <div className='text-left'>
                <Inputtextbox icon={'user.png'} label="Administrator Username" description="Kindly Enter Your Valid Administrator Username" placeholder="Enter username" updatedata={setusername} />
                <Inputtextbox icon={'lock.png'} label="Administrator Password" description="Enter your Secret Password." placeholder="Enter password" updatedata={setpassword} />
                <p className='text-red-600 mx-2'>{message}</p>
                <Inputtextbox icon={'contact-book.png'} label="Contact" description="Make sure you enter your whatsup number." placeholder="Enter Whatsup Number" updatedata={setcontact} />
                <p className='text-red-600 mx-2'>{message}</p>
                <Inputtextbox icon={'envelope.png'} label="Email ID" description="Enter you business Email Id." placeholder="Enter Email ID" updatedata={setemail} />
                <p className='text-red-600 mx-2'>{message}</p>
                <Inputtextbox icon={'envelope.png'} label="Profile Image URL" description="Enter your profile image url ." placeholder="URL" updatedata={set_profile_image_url} />
                <p className='text-red-600 mx-2'>{message}</p>
                <Inputtextbox icon={'envelope.png'} label="Street/Village" description="Whats your street of village" placeholder="Street/village" updatedata={set_address_line_1} />
                <p className='text-red-600 mx-2'>{message}</p>
                <Inputtextbox icon={'envelope.png'} label="City/Town" description="City or Town neary by." placeholder="City/ Town" updatedata={set_address_line_2} />
                <p className='text-red-600 mx-2'>{message}</p>
                <Inputtextbox icon={'envelope.png'} label="State, Pincode" description="Which is your state and mention the pincode." placeholder="State and Pincode" updatedata={set_address_line_3} />
                <p className='text-red-600 mx-2'>{message}</p>



                <div className='flex justify-end p-2' >
                  <Submitbutton text="Register" />
                </div>
              </div>


              <input />
            </form>

            <div>
              <Labelwithdescription label={'Already a User?'} description={'Click here to login if you are already a user of Mirrorlink'} goto={'/login'} />
            </div>
          </div>

        </div>
      }
    </>
  )
}
