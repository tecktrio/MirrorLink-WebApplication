import React, { useContext, useEffect, useState } from 'react'
import { CookieContext } from '../../Contexts/CookieContext'
import { GET_CONTENT_DETAILS } from '../../serverRequests/ServerRequests'

export default function UpdateContentpage() {
  const {getCookie} = useContext(CookieContext)
  const [content, setContent] = useState({})
  let content_id = getCookie('content_id')
  let login_key = getCookie('login_key')

  useEffect(()=>{
    GET_CONTENT_DETAILS(login_key, content_id).then((res)=>{
      console.log(res.data)
      setContent(res.data)
    })
  },[])
  
  return (
    <div>
      {content.content_format!='mp4'?<img className='rounded-md' src={content.content_url}/>:
      <video className='rounded-md' src={content.content_url} controls autoPlay/>}
    </div>
  )
}
