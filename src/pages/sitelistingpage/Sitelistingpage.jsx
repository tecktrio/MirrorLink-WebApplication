import React, { useContext, useEffect, useState } from 'react'
import { GET_AVAILABLE_SITES } from '../../serverRequests/ServerRequests'
import Labelwithdescription from '../../components/labelwithdescription/Labelwithdescription'
import Listitem from '../../components/listitem/Listitem'
import { useNavigate } from 'react-router-dom'
import { Navigate_To_Mirrorlist } from '../../constants'
import { GlobalContext } from '../../Contexts/GlobalContext'
import { CookieContext } from '../../Contexts/CookieContext'
import Addbutton from '../../components/addbutton/Addbutton'

export default function Sitelistingpage() {

  const [sitelist, setSitelist] = useState([])
  const {setCookie,getCookie} = useContext(CookieContext)
  const navigate = useNavigate()

  useEffect(()=>{
    let login_key = getCookie('login_key')
    GET_AVAILABLE_SITES(login_key).then((res)=>{
      console.log(res.data)
      setSitelist(res.data)
    }).catch((err)=>{
      console.log(err)
    })

  },[])

  const OnSiteSelectHandler =(id)=>{
    console.log(id)
    setCookie('site_id', id, 1)
    navigate(Navigate_To_Mirrorlist)
  }

  return (
    <div className='flex justify-center'>
      <div className='w-full'>
        <div className='flex justify-end m-2'>
        <Addbutton label={'Add Site'} goto={"/addsite"}/>

        </div>

        <div className='my-2 flex'>
          <Labelwithdescription label={'Available Sites'} description={'List of sites that are added into your account.'}/>
        </div>
        <div>
          {sitelist?.map((data, key)=>{
            return (
              <div onClick={()=>OnSiteSelectHandler(data._id)} key={key}>
              <Listitem title={data.site_name} description={data.site_description}/>

                </div>
            )
          })
        }
          
        </div>
      </div>

    </div>
  )
}
