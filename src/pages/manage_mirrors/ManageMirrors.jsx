import React, { useContext, useEffect, useState } from 'react'
import Addbutton from '../../components/addbutton/Addbutton'
import Labelwithdescription from '../../components/labelwithdescription/Labelwithdescription'
import Listitem from '../../components/listitem/Listitem'
import { DELETE_MIRROR, GET_AVAILABLE_MIRRORS_ON_SITE } from '../../serverRequests/ServerRequests'
import { CookieContext } from '../../Contexts/CookieContext'
import { useNavigate } from 'react-router-dom'

export default function ManageMirrors() {
    const [mirrorlist, setMirrorlist] = useState([])
    const {setCookie, getCookie} = useContext(CookieContext)
    let navigate = useNavigate()

  
    const deleteMirror =(id)=>{
      let login_key = getCookie("login_key")
      DELETE_MIRROR(login_key,id).then((res)=>{
        window.location.reload()
      })

    }

    useEffect(()=>{
      
      let site_id = null
      let login_key = getCookie('login_key')
      GET_AVAILABLE_MIRRORS_ON_SITE(login_key, site_id).then((res)=>{
        console.log(res.data)
        setMirrorlist(res.data)
      }).catch((err)=>{
        console.log(err)
      })
  
    },[])
    return (
        <div className='flex justify-center'>
          <div className='w-full'>
            <div className='flex justify-end m-2'>
            <Addbutton label={'Add Mirror'} goto={"/addmirror"}/>
    
            </div>
    
            <div className='my-2 flex'>
              <Labelwithdescription label={'Available Mirrors'} description={'List of mirrors that are added into your account.'}/>
            </div>
            <div>
              {mirrorlist?.map((data, key)=>{
                let content = `${data.mirror_description}  ( Username : ${data.username}, Password : ${data.password} )`
                return (
                  <div >
                  <Listitem title={data.mirror_name} description={content} onDelete={()=>deleteMirror(data._id)} />
    
                    </div>
                )
              })
            }
              
            </div>
          </div>
    
        </div>
      )
}
