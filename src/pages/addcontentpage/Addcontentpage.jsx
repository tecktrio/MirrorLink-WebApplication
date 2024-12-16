import React, { useContext, useState } from 'react'
import Inputtextbox from '../../components/inputtextbox/Inputtextbox'
import Labelwithdescription from '../../components/labelwithdescription/Labelwithdescription'
import Uploadbutton from '../../components/uploadbutton/Uploadbutton'
import Submitbutton from '../../components/submitbutton/Submitbutton'
import { FormDataContext } from '../../Contexts/FormDataContexts'
import { CREATE_CONTENT } from '../../serverRequests/ServerRequests'
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
  const [ErrorMessage, setErrorMessage] = useState('')
  const [ContentDescription, setcontentdescription] = useState('')
  const [statusText, setStatusText] = useState('')
  const [content, setcontent] = useState(null)
  let navigate = useNavigate()

  const HandleSubmit = (e) => {
    setStatusText("Uploading...")
    // setIsloading(true)
    e.preventDefault()
    let login_key = getCookie('login_key')
    let site_id = getCookie('site_id')
    let mirror_id = getCookie('mirror_id')
    CREATE_CONTENT(login_key, contentTitle, ContentDescription, content).then(() => {
      console.log("UPLOADED SUCCESSFULLY")
      navigate('/manage_contents')
      setErrorMessage('')
      // setIsloading(false)
    })
      .catch((err) => {
        console.log(err)
        setErrorMessage("Only MP4, JPG and PNG is supported.")
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
          <p className='text-red-600'>{ErrorMessage}</p>
          <div className='flex'>
          <Inputtextbox label={'Content Title'} description={'Enter your Content title to identify it in future'} placeholder={'example content'} updatedata={setcontenttitle} />
          <Inputtextbox label={'Content Decription'} description={'Description for your content'} placeholder={'example description'} updatedata={setcontentdescription} />
         
          </div>
           <Labelwithdescription label={'Upload your content'} description={'You can upload your content from here. Supportted format mp4, jpg, png'} />
          <Uploadbutton label={'Upload'} update={HandleFile} />

          <div className='flex justify-end p-2' >
            {EnableSubmitButton ? <Submitbutton text="Add" /> : <Submitbutton text="Add" disabled={true} />}
          </div>
          <p className='text-green-500'>{statusText}</p>
        </form>}

    </>
  )
}
