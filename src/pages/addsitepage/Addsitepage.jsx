import React, { useContext, useEffect, useState } from 'react'
import Inputtextbox from '../../components/inputtextbox/Inputtextbox'
import Submitbutton from '../../components/submitbutton/Submitbutton'
import { FormDataContext } from '../../Contexts/FormDataContexts'
import { ADD_SITE_IN_ACCOUNT, GET_AVAILABLE_SITES } from '../../serverRequests/ServerRequests'
import { Link, useNavigate } from 'react-router-dom'
import { CookieContext } from '../../Contexts/CookieContext'

export default function Addsitepage() {
  const { formdata, setformdata } = useContext(FormDataContext)
  const { getCookie } = useContext(CookieContext)
  const [sitename, setsitename] = useState(formdata?.site_name || '')
  const [siteDescription, setSiteDescription] = useState(formdata?.site_description || '')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [maxSites, setMaxSites] = useState(1)
  const [currentSitesCount, setCurrentSitesCount] = useState(0)
  const [isLimitReached, setIsLimitReached] = useState(false)
  let navigate = useNavigate()

  useEffect(() => {
    let login_key = getCookie('login_key') || 'adminpassword'
    GET_AVAILABLE_SITES(login_key)
      .then((res) => {
        const data = res?.data || []
        const max = res?.max_sites || res?.limits?.sites || 1
        setCurrentSitesCount(data.length)
        setMaxSites(max)
        setIsLimitReached(Boolean(res?.limit_reached || data.length >= max))
      })
      .catch((err) => {
        console.error('Error checking site limits:', err)
      })
  }, [])

  const HandleSubmit = (e) => {
    e.preventDefault()
    if (isLimitReached) {
      setIsError(true)
      setMessage(`Plan limit reached (${currentSitesCount}/${maxSites} sites). Please upgrade your plan to create more sites.`)
      return
    }
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
        setMessage(err?.response?.data?.message || 'Failed to add site. Please try again.')
        setIsSubmitting(false)
      })
  }

  return (
    <form onSubmit={HandleSubmit} className='p-4 sm:p-6 md:p-8 max-w-2xl w-full mx-auto bg-white rounded-2xl shadow-xs border border-slate-200/80 my-2 sm:my-4'>
      <h2 className='text-xl sm:text-2xl font-bold text-slate-800 mb-1 sm:mb-2'>Create New Site</h2>
      <p className='text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6'>Add a site to group and organize your mirrors and contents.</p>

      {/* Plan limit reached warning */}
      {isLimitReached && (
        <div className='p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4 text-amber-800 text-xs sm:text-sm font-medium mb-6'>
          <div className='flex items-center gap-2'>
            <svg className='w-5 h-5 text-amber-600 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>You have reached the maximum allowed sites ({currentSitesCount}/{maxSites}) on your current plan.</span>
          </div>
          <Link to='/pricing' className='px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-colors'>
            Upgrade Plan
          </Link>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message}
        </div>
      )}

      <div className='flex flex-col gap-4'>
        <Inputtextbox
          label='Location / Site Name'
          description='Enter a recognizable name for this location, branch, or area'
          placeholder='e.g., Downtown Location, Reception, 2nd Floor'
          value={sitename}
          updatedata={setsitename}
          required={true}
        />
        <Inputtextbox
          label='Location Description'
          description='Optional details, room number, or physical placement details'
          placeholder='e.g., Room 102, 2nd floor retail display, lobby screens'
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
        <Submitbutton text={isSubmitting ? 'Adding...' : isLimitReached ? 'Plan Limit Reached' : 'Add Site'} disabled={isSubmitting || isLimitReached} />
      </div>
    </form>
  )
}
