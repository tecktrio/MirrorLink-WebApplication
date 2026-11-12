import React, { useContext, useState } from 'react'
import Inputtextbox from '../../components/inputtextbox/Inputtextbox'
import Submitbutton from '../../components/submitbutton/Submitbutton'
import { FormDataContext } from '../../Contexts/FormDataContexts'
import { ADD_SITE_IN_ACCOUNT } from '../../serverRequests/ServerRequests'
import { useNavigate } from 'react-router-dom'
import { CookieContext } from '../../Contexts/CookieContext'

export default function Addsitepage() {
  const { formdata, setformdata } = useContext(FormDataContext)
  const { getCookie } = useContext(CookieContext)
  const [sitename, setsitename] = useState(formdata?.site_name || '')
  const [siteDescription, setSiteDescription] = useState(formdata?.site_description || '')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  let navigate = useNavigate()

  const HandleSubmit = (e) => {
    e.preventDefault()
    if (!sitename.trim()) {
      setIsError(true)
      setMessage('Site Name is required.')
      return
    }
    setIsSubmitting(true)
    setMessage('')
    setformdata({ ...formdata, 'site_name': sitename, 'site_description': siteDescription || '' })
    let login_key = getCookie('login_key') || 'adminpassword'

    ADD_SITE_IN_ACCOUNT(login_key, sitename.trim(), siteDescription.trim() || '')
      .then((res) => {
        setIsError(false)
        setMessage('Site Added Successfully! Redirecting...')
        setTimeout(() => {
          navigate('/manage_sites')
        }, 500)
      })
      .catch((err) => {
        console.error('AddSite error:', err)
        setIsError(true)
        setMessage('Failed to add site. Please try again.')
        setIsSubmitting(false)
      })
  }

  return (
    <form onSubmit={HandleSubmit} className='p-4 sm:p-6 md:p-8 max-w-2xl w-full mx-auto bg-white rounded-2xl shadow-xs border border-slate-200/80 my-2 sm:my-4'>
      <h2 className='text-xl sm:text-2xl font-bold text-slate-800 mb-1 sm:mb-2'>Create New Site</h2>
      <p className='text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6'>Add a site to group and organize your mirrors and contents.</p>

      {message && (
        <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message}
        </div>
      )}

      <div className='flex flex-col gap-4'>
        <Inputtextbox
          label='Site Name'
          description='Enter a recognizable name for this site/location'
          placeholder='e.g., Downtown Store, Lobby, Head Office'
          value={sitename}
          updatedata={setsitename}
          required={true}
        />
        <Inputtextbox
          label='Site Description'
          description='Optional details or address about this site'
          placeholder='e.g., 2nd floor main reception area'
          value={siteDescription}
          updatedata={setSiteDescription}
          required={false}
        />
      </div>

      <div className='flex justify-end gap-3 mt-6 pt-4 border-t'>
        <button
          type='button'
          onClick={() => navigate(-1)}
          className='px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors'
        >
          Cancel
        </button>
        <Submitbutton text={isSubmitting ? 'Adding...' : 'Add Site'} disabled={isSubmitting} />
      </div>
    </form>
  )
}
