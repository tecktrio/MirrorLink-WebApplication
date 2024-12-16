import React, { useContext, useState } from 'react'
import Inputtextbox from '../../components/inputtextbox/Inputtextbox'
import Submitbutton from '../../components/submitbutton/Submitbutton'
import { FormDataContext } from '../../Contexts/FormDataContexts'
import { CREATE_MIRROR, ADD_SITE_IN_ACCOUNT } from '../../serverRequests/ServerRequests'
import { useNavigate } from 'react-router-dom'
import { CookieContext } from '../../Contexts/CookieContext'



export default function Addmirrorpage() {

  const { getCookie} = useContext(CookieContext)
  let navigate = useNavigate()
  const [name, setname] = useState('')
  const [description, setdescription] = useState('')
  const [username, setusername] = useState('')
  const [password, setpassword] = useState('')
  const [height, setheight] = useState('')
  const [width, setwidth] = useState('')

  const HandleSubmit = (e)=>{
    e.preventDefault()
    let login_key = getCookie('login_key')
    CREATE_MIRROR(login_key, name, description, username, password, height, width).then((res)=>{
      navigate('/manage_mirrors')
    })
    .catch((err)=>{
      console.log(err)
    })
  }
  return (
    <form onSubmit={HandleSubmit} >
      <div className='flex'>
      <Inputtextbox  label={'Mirror Name'} description={'Enter your site name to identify it in future'} placeholder={'example mirror'} updatedata={setname}/>
      <Inputtextbox label={'Mirror Decription'} description={'Description for your site'} placeholder={'example mirror'} updatedata={setdescription}/>
     
      </div>
      <div className='flex'>
      <Inputtextbox  label={'Mirror Username'} description={'Enter Mirror Username'} placeholder={'example mirror'} updatedata={setusername}/>
      <Inputtextbox label={'Mirror Password'} description={'Enter Mirror Password'} placeholder={'example mirror'} updatedata={setpassword}/>
    
      </div>
      <div className='flex'>
      <Inputtextbox label={'Mirror Height'} description={'Enter Mirror Height'} placeholder={'example height'} updatedata={setheight}/>
      <Inputtextbox label={'Mirror Width'} description={'Enter Mirror Width'} placeholder={'example width'} updatedata={setwidth}/>
     
      </div>
     

      <div className='flex justify-end p-2' >
        <Submitbutton text="Add" />
      </div>
    </form>
  )
}
