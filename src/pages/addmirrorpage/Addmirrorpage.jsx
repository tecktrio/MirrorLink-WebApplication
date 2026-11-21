import React, { useContext, useEffect, useState } from 'react'
import Inputtextbox from '../../components/inputtextbox/Inputtextbox'
import Submitbutton from '../../components/submitbutton/Submitbutton'
import { CREATE_MIRROR, GET_ALL_MIRRORS } from '../../serverRequests/ServerRequests'
import { Link, useNavigate } from 'react-router-dom'
import { CookieContext } from '../../Contexts/CookieContext'

export default function Addmirrorpage() {
  const { getCookie } = useContext(CookieContext)
  let navigate = useNavigate()
  const [name, setname] = useState('')
  const [description, setdescription] = useState('')
  const [username, setusername] = useState('')
  const [password, setpassword] = useState('')
  const [height, setheight] = useState('1080')
  const [width, setwidth] = useState('1920')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [maxMirrors, setMaxMirrors] = useState(1)
  const [currentMirrorsCount, setCurrentMirrorsCount] = useState(0)
  const [isLimitReached, setIsLimitReached] = useState(false)

  useEffect(() => {
    let login_key = getCookie('login_key') || 'adminpassword'
    GET_ALL_MIRRORS(login_key)
      .then((res) => {
        const data = res?.data || []
        const max = res?.max_mirrors || res?.limits?.max_mirrors || 1
        setCurrentMirrorsCount(data.length)
        setMaxMirrors(max)
        setIsLimitReached(Boolean(res?.limit_reached || data.length >= max))
      })
      .catch((err) => {
        console.error("Error checking mirror limits:", err)
      })
  }, [])

  const HandleSubmit = (e) => {
    e.preventDefault()
    if (isLimitReached) {
      setIsError(true)
      setMessage(`Plan limit reached (${currentMirrorsCount}/${maxMirrors} screens). Please upgrade your plan to register more screens.`)
      return
    }
    if (!name.trim() || !username.trim() || !password.trim()) {
      setIsError(true)
      setMessage('Mirror Name, Screen ID/Username, and Password are required.')
      return
    }
    setIsSubmitting(true)
    setMessage('')
    let login_key = getCookie('login_key') || 'adminpassword'
    CREATE_MIRROR(login_key, name.trim(), description.trim(), username.trim(), password.trim(), height || '1080', width || '1920')
      .then(() => {
        setIsError(false)
        setMessage('Mirror Screen Registered Successfully! Redirecting...')
        setTimeout(() => {
          navigate('/manage_mirrors')
        }, 500)
      })
      .catch((err) => {
        console.error("Create mirror error:", err)
        setIsError(true)
        setMessage(err?.response?.data?.message || 'Failed to register mirror. Please check credentials and try again.')
        setIsSubmitting(false)
      })
  }

  return (
    <form onSubmit={HandleSubmit} className='p-4 sm:p-6 md:p-8 max-w-2xl w-full mx-auto bg-white rounded-2xl shadow-xs border border-slate-200/80 my-2 sm:my-4 space-y-6'>
      <div>
        <h2 className='text-lg sm:text-xl font-bold text-slate-800 tracking-tight'>Register New Mirror Screen</h2>
        <p className='text-xs text-slate-500 mt-1'>
          Configure physical display credentials for your digital signage viewer application.
        </p>
      </div>

      {/* Plan limit warning */}
      {isLimitReached && (
        <div className='p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4 text-amber-800 text-xs sm:text-sm font-medium'>
          <div className='flex items-center gap-2'>
            <svg className='w-5 h-5 text-amber-600 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>You have reached the maximum allowed mirror screens ({currentMirrorsCount}/${maxMirrors}) on your current plan.</span>
          </div>
          <Link to='/pricing' className='px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition-colors'>
            Upgrade Plan
          </Link>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-xl text-xs font-semibold ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          {message}
        </div>
      )}

      {/* Screen Identification */}
      <div className='space-y-4'>
        <h4 className='text-xs font-bold uppercase tracking-wider text-black'>
          Display Information
        </h4>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <Inputtextbox
            label='Mirror Name'
            description='Identifier for this physical display'
            placeholder='e.g., Reception Video Wall'
            value={name}
            updatedata={setname}
            required={true}
          />
          <Inputtextbox
            label='Mirror Description'
            description='Location details or screen purpose'
            placeholder='e.g., Ground floor main lobby'
            value={description}
            updatedata={setdescription}
            required={false}
          />
        </div>
      </div>

      {/* Screen Login Credentials */}
      <div className='space-y-4 pt-4 border-t border-neutral-100'>
        <h4 className='text-xs font-bold uppercase tracking-wider text-black'>
          Viewer Client Credentials
        </h4>
        <p className='text-xs text-neutral-500 -mt-2'>
          The viewer application will use these credentials to log in and sync its media playlist.
        </p>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <Inputtextbox
            label='Screen ID / Username'
            description='Username for the mirror client'
            placeholder='e.g., lobby_mirror_1'
            value={username}
            updatedata={setusername}
            required={true}
          />
          <Inputtextbox
            label='Access Key / Password'
            description='Secret password for the mirror'
            placeholder='••••••••••••'
            type="password"
            value={password}
            updatedata={setpassword}
            required={true}
          />
        </div>
      </div>

      {/* Screen Dimensions */}
      <div className='space-y-4 pt-4 border-t border-neutral-100'>
        <h4 className='text-xs font-bold uppercase tracking-wider text-black'>
          Display Resolution
        </h4>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <Inputtextbox
            label='Width (pixels)'
            description='Horizontal resolution (default 1920)'
            placeholder='1920'
            value={width}
            updatedata={setwidth}
            required={false}
          />
          <Inputtextbox
            label='Height (pixels)'
            description='Vertical resolution (default 1080)'
            placeholder='1080'
            value={height}
            updatedata={setheight}
            required={false}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className='pt-6 border-t border-slate-100 flex items-center justify-end gap-3'>
        <button
          type='button'
          onClick={() => navigate(-1)}
          className='px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer'
        >
          Cancel
        </button>
        <div className='w-44'>
          <Submitbutton text={isSubmitting ? "Registering..." : isLimitReached ? "Plan Limit Reached" : "Register Screen"} disabled={isSubmitting || isLimitReached} />
        </div>
      </div>
    </form>
  )
}
