import React, { useContext, useEffect, useState } from 'react'
import { GET_AVAILABLE_CONTENTS_ON_SITE, GET_AVAILABLE_MIRRORS_ON_SITE, GET_AVAILABLE_SITES } from '../../serverRequests/ServerRequests'
import Labelwithdescription from '../../components/labelwithdescription/Labelwithdescription'
import Listitem from '../../components/listitem/Listitem'
import { useNavigate } from 'react-router-dom'
import { Navigate_To_Contentlist, Navigate_To_Mirrorlist, Navigate_To_Update_Content } from '../../constants'
import { GlobalContext } from '../../Contexts/GlobalContext'
import Addbutton from '../../components/addbutton/Addbutton'
import { CookieContext } from '../../Contexts/CookieContext'

export default function Contentlistingpage() {

  const [contentlist, setContentList] = useState([])
  const {getCookie, setCookie} = useContext(CookieContext)
  const navigate = useNavigate()

  useEffect(()=>{
    let login_key = getCookie('login_key')
    let site_id = getCookie('site_id')
    let mirror_id = getCookie('mirror_id')

    GET_AVAILABLE_CONTENTS_ON_SITE(login_key, site_id, mirror_id).then((res)=>{
      console.log(res.data)
      setContentList(res.data)
    })

  },[])
  return (
    <div className='flex justify-center'>
      <div className='w-full'>
        <div className='flex justify-end m-2'>
        <Addbutton label={'Add Content'} goto={"/addcontent"}/>

        </div>

        <div className='my-2'>
          <Labelwithdescription label={'Available Contents'} description={'List of Contents that are available for this Mirror.'}/>
        </div>
        <div>
          {contentlist?.map((data, key)=>{
            return (
              <div onClick={()=>{navigate(Navigate_To_Update_Content);setCookie('content_id', data._id,1)}} key={key}>
              <Listitem title={data.content_title} description={data.content_description}/>
                </div>
            )
          })
        }
          
        </div>
      </div>

    </div>
  )
}
