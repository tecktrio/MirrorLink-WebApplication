import React, { useContext, useEffect, useState } from 'react'
import { DELETE_MIRROR, GET_AVAILABLE_MIRRORS_ON_SITE, GET_AVAILABLE_SITES } from '../../serverRequests/ServerRequests'
import Labelwithdescription from '../../components/labelwithdescription/Labelwithdescription'
import Listitem from '../../components/listitem/Listitem'
import { useNavigate } from 'react-router-dom'
import { Navigate_To_Contentlist, Navigate_To_Mirrorlist } from '../../constants'
import { CookieContext } from '../../Contexts/CookieContext'
import Addbutton from '../../components/addbutton/Addbutton'

export default function MirrorListing() {

  const [mirrorlist, setMirrorlist] = useState([])
  const {getCookie, setCookie} = useContext(CookieContext)
  const navigate = useNavigate()

  const deleteMirror =(id)=>{
    let login_key = getCookie("login_key")
    DELETE_MIRROR(login_key,id).then((res)=>{
      navigate('/manage_mirrors')
    })

  }
  useEffect(()=>{
    // console.log('daaa',DATA.SELECTED_SITE_ID)
    let login_key = getCookie('login_key')
    let site_id = getCookie('site_id')
    GET_AVAILABLE_MIRRORS_ON_SITE(login_key, site_id).then((res)=>{
      console.log(res.data)
      setMirrorlist(res.data)
    })

  },[])

  const Handler = (id)=>{
    setCookie('mirror_id',id,1)
    navigate(Navigate_To_Contentlist)
  }
  return (
    <div className='flex justify-center'>
      <div className='w-full'>
        <div className='flex justify-end m-2'>
        <Addbutton label={'Add Mirror'} goto={"/addmirror"}/>

        </div>

        <div className='my-2'>
          <Labelwithdescription label={'Available Mirrors'} description={'List of Mirros that are available in this site.'}/>
        </div>
        <div>
          {mirrorlist?.map((data, key)=>{
            return (
              <div onClick={()=>Handler(data._id)} key={key}>
              <Listitem title={data.mirror_name} description={data.mirror_description}  />

                </div>
            )
          })
        }
          
        </div>
      </div>

    </div>
  )
}
