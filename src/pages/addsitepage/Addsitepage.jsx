import React, { useContext, useState } from 'react'
import Inputtextbox from '../../components/inputtextbox/Inputtextbox'
import Labelwithdescription from '../../components/labelwithdescription/Labelwithdescription'
import Uploadbutton from '../../components/uploadbutton/Uploadbutton'
import Submitbutton from '../../components/submitbutton/Submitbutton'
import { FormDataContext } from '../../Contexts/FormDataContexts'
import { ADD_SITE_IN_ACCOUNT } from '../../serverRequests/ServerRequests'
import { useNavigate } from 'react-router-dom'
import { CookieContext } from '../../Contexts/CookieContext'



export default function Addsitepage() {

  const {formdata, setformdata} = useContext(FormDataContext)
  const {getCookie} = useContext(CookieContext)
  const [sitename, setsitename] = useState(formdata.site_name)
  const [siteDescription, setSiteDescription] = useState(formdata.site_description)
  let navigate = useNavigate()

  const HandleSubmit = (e)=>{
    e.preventDefault()
    setformdata({...formdata, 'site_name':sitename, 'site_description':siteDescription})
    let login_key = getCookie('login_key')
    ADD_SITE_IN_ACCOUNT(login_key, sitename, siteDescription).then((res)=>{
      console.log('Site Added Successfully')
      navigate('/manage_sites')

    })
    .catch((err)=>{
      console.log(err)
    })
  }
  return (
    <form onSubmit={HandleSubmit}>
      <div className='flex'>
      <Inputtextbox label={'Site Name'} description={'Enter your site name to identify it in future'} placeholder={'example site'} updatedata={setsitename}/>
      <Inputtextbox label={'Site Decription'} description={'Description for your site'} placeholder={'example site'} updatedata={setSiteDescription}/>
     
      </div>
      {/* <Labelwithdescription label={'Site Image'} description={'Upload a site image'} />
      <Uploadbutton label={'Upload'} /> */}

      <div className='flex justify-end p-2' >
        <Submitbutton text="Add" />
      </div>
    </form>
  )
}
