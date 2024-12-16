import React, { useContext, useEffect, useState } from 'react'
import Addbutton from '../../components/addbutton/Addbutton'
import Labelwithdescription from '../../components/labelwithdescription/Labelwithdescription'
import Listitem from '../../components/listitem/Listitem'
import { DELETE_SITE, GET_AVAILABLE_SITES } from '../../serverRequests/ServerRequests'
import { CookieContext } from '../../Contexts/CookieContext'
import { useNavigate } from 'react-router-dom'

export default function ManageSites() {

    const [sitelist, setSitelist] = useState([])
    const {getCookie, setCookie} = useContext(CookieContext)
    let navigate = useNavigate()

    const deleteSite =(id)=>{
      let login_key = getCookie("login_key")
      DELETE_SITE(login_key,id).then((res)=>{
        window.location.reload()
      }).catch((err)=>{
        console.log(err)
      })

    }
    useEffect(()=>{
      let login_key = getCookie("login_key")
      GET_AVAILABLE_SITES(login_key).then((res)=>{
        console.log(res.data)
        setSitelist(res.data)
      }).catch((err)=>{
        console.log(err)
      })
  
    },[])
    return (
        <div className='flex justify-center'>
          <div className='w-full'>
            <div className='flex justify-end m-2'>
            <Addbutton label={'Add Site'} goto={"/addsite"}/>
    
            </div>
    
            <div className='my-2 flex'>
              <Labelwithdescription label={'Available Sites'} description={'List of sites that are added into your account.'}/>
            </div>
            <div className=''>
              {sitelist?.map((data, key)=>{
                return (
                  <div className='  mr-5'>
                  <Listitem title={data.site_name} description={data.site_description} onDelete={()=>deleteSite(data._id)} />
    
                    </div>
                )
              })
            }
              
            </div>
          </div>
    
        </div>
      )
}
