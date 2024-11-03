import React, { useContext, useEffect, useState } from 'react'
import Addbutton from '../../components/addbutton/Addbutton'
import Labelwithdescription from '../../components/labelwithdescription/Labelwithdescription'
import Listitem from '../../components/listitem/Listitem'
import { DELETE_CONTENT, GET_AVAILABLE_CONTENTS_ON_SITE, GET_AVAILABLE_MIRRORS_ON_SITE } from '../../serverRequests/ServerRequests'
import { CookieContext } from '../../Contexts/CookieContext'
import { useNavigate } from 'react-router-dom'

export default function ManageContents() {
    const [contentlist, setContentlist] = useState([])
    let navigate = useNavigate()
    const {setCookie, getCookie} = useContext(CookieContext)
    const deleteContent =(id)=>{
      let login_key = getCookie("login_key")
      DELETE_CONTENT(login_key,id).then((res)=>{
        window.location.reload()
      })

    }
    useEffect(()=>{
      let login_key = getCookie('login_key')
      GET_AVAILABLE_CONTENTS_ON_SITE(login_key).then((res)=>{
        setContentlist(res.data)
        console.log(res)
      }).catch((err)=>{
        console.log(err)
      })
  
    },[])
    return (
        <div className='flex justify-center'>
          <div className='w-full'>
            <div className='flex justify-end m-2'>
            <Addbutton label={'Add Content'} goto={"/addcontent"}/>
    
            </div>
    
            <div className='my-2 flex'>
              <Labelwithdescription label={'Available Contents'} description={'List of contents that are added into your account.'}/>
            </div>
            <div>
              {contentlist?.map((data, key)=>{
                return (
                  <div >
                  <Listitem title={data.content_title} description={data.content_description} onDelete={()=>deleteContent(data._id)} />
    
                    </div>
                )
              })
            }
              
            </div>
          </div>
    
        </div>
      )
}
