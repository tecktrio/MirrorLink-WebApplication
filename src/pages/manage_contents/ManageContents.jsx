import React, { useContext, useEffect, useState } from 'react'
import Addbutton from '../../components/addbutton/Addbutton'
import Labelwithdescription from '../../components/labelwithdescription/Labelwithdescription'
import Listitem from '../../components/listitem/Listitem'
import { DELETE_CONTENT, GET_ALL_CONTENTS, GET_AVAILABLE_CONTENTS_ON_SITE, GET_AVAILABLE_MIRRORS_ON_SITE } from '../../serverRequests/ServerRequests'
import { CookieContext } from '../../Contexts/CookieContext'
import { useNavigate } from 'react-router-dom'
import { Navigate_To_Update_Content } from '../../constants'
import SearchBar from '../../components/SearchBar/SearchBar'

export default function ManageContents() {
    const [contentlist, setContentlist] = useState([])
    const [searchresult, setSearchResult] = useState([])
    let navigate = useNavigate()
    const {setCookie, getCookie} = useContext(CookieContext)
    const deleteContent =(id)=>{
      let login_key = getCookie("login_key")
      DELETE_CONTENT(login_key,id).then((res)=>{
        window.location.reload()
      }).catch((error)=>{
        console.log(error)
      })

    }
    useEffect(()=>{
      let login_key = getCookie('login_key')
      GET_ALL_CONTENTS(login_key).then((res)=>{
        setContentlist(res.data)
        setSearchResult(res.data)
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
            <SearchBar data={contentlist} setSearch={setSearchResult} />

            <div className='mt-10'>
              {searchresult?.map((data, key)=>{
                return (
                  <div className=' mr-5'  >


                  <Listitem onPlay={data._id} title={data.content_title} description={data.content_description} onDelete={()=>deleteContent(data._id)} />
    
                    </div>
                )
              })
            }
              
            </div>
          </div>
    
        </div>
      )
}
