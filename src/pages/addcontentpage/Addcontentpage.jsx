import React, { useContext, useState } from 'react'
import Inputtextbox from '../../components/inputtextbox/Inputtextbox'
import Labelwithdescription from '../../components/labelwithdescription/Labelwithdescription'
import Uploadbutton from '../../components/uploadbutton/Uploadbutton'
import Submitbutton from '../../components/submitbutton/Submitbutton'
import { FormDataContext } from '../../Contexts/FormDataContexts'
import { ADD_CONTENT_IN_MIRROR } from '../../serverRequests/ServerRequests'
import { GlobalContext } from '../../Contexts/GlobalContext'
import { LoadingStateContext } from '../../Contexts/LoadingStateContext'
import Loadinpage from '../loadingpage/Loadinpage'
import { useNavigate } from 'react-router-dom'
import { CookieContext } from '../../Contexts/CookieContext'



export default function Addcontentpage() {

  const {  getCookie } = useContext(CookieContext)
  const { isLoading, setIsloading } = useContext(LoadingStateContext)
  const [contentTitle, setcontenttitle] = useState('')
  const [EnableSubmitButton, setenablesubmitbutton] = useState(false)
  const [ContentDescription, setcontentdescription] = useState('')
  const [content, setcontent] = useState(null)
  let navigate = useNavigate()

  const HandleSubmit = (e) => {
    // setIsloading(true)
    e.preventDefault()
    let login_key = getCookie('login_key')
    let site_id = getCookie('site_id')
    let mirror_id = getCookie('mirror_id')
    ADD_CONTENT_IN_MIRROR(login_key, contentTitle, ContentDescription, mirror_id,site_id, content).then(() => {
      console.log("UPLOADED SUCCESSFULLY")
      navigate('/manage_contents')
      // setIsloading(false)
    })
      .catch((err) => {
        console.log(err)
      })
  }

  const HandleFile = (e) => {
    console.log('file selected', e.target.files[0])
    setcontent(e.target.files[0])
    setenablesubmitbutton(true)
  }

  return (
    <>
      {isLoading ?
        <Loadinpage /> :
        <form onSubmit={HandleSubmit}>
          <Inputtextbox label={'Content Title'} description={'Enter your Content title to identify it in future'} placeholder={'example content'} updatedata={setcontenttitle} />
          <Inputtextbox label={'Content Decription'} description={'Description for your content'} placeholder={'example description'} updatedata={setcontentdescription} />
          <Labelwithdescription label={'Upload your content'} description={'You can upload your content from here. Supportted format mp4, jpg, png'} />
          <Uploadbutton label={'Upload'} update={HandleFile} />

          <div className='flex justify-end p-2' >
            {EnableSubmitButton ? <Submitbutton text="Add" /> : <Submitbutton text="Add" disabled={true} />}
          </div>
        </form>}

    </>
  )
}
