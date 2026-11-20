import React, { useContext, useEffect, useState } from 'react'
import { GET_AVAILABLE_SITES } from '../../serverRequests/ServerRequests'
import Labelwithdescription from '../../components/labelwithdescription/Labelwithdescription'
import Listitem from '../../components/listitem/Listitem'
import { useNavigate } from 'react-router-dom'
import { Navigate_To_Mirrorlist } from '../../constants'
import { GlobalContext } from '../../Contexts/GlobalContext'
import { CookieContext } from '../../Contexts/CookieContext'
import Addbutton from '../../components/addbutton/Addbutton'

export default function Sitelistingpage() {

  const [sitelist, setSitelist] = useState([])
  const {setCookie,getCookie} = useContext(CookieContext)
  const navigate = useNavigate()

  useEffect(()=>{
    let login_key = getCookie('login_key')
    GET_AVAILABLE_SITES(login_key).then((res)=>{
      console.log(res.data)
      setSitelist(res.data)
    }).catch((err)=>{
      console.log(err)
    })

  },[])

  const OnSiteSelectHandler =(id)=>{
    console.log(id)
    setCookie('site_id', id, 1)
    navigate(Navigate_To_Mirrorlist)
  }

  return (
    <div className='flex justify-center'>
      <div className='w-full'>
        <div className='flex justify-end m-2'>
        <Addbutton label={'Add Site'} goto={"/addsite"}/>

        </div>

        <div className='my-2 flex'>
          <Labelwithdescription label={'Available Sites'} description={'List of sites that are added into your account.'}/>
        </div>
        <div className='bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden'>
          {/* Google Drive Table Header */}
          <div className='flex items-center justify-between py-2.5 px-3 sm:px-4 border-b border-neutral-200/90 bg-neutral-50/70 text-[11px] font-bold text-neutral-500 uppercase tracking-wider select-none'>
            <div className='flex items-center gap-1.5 flex-1'>
              <span>Site Location</span>
              <svg className='w-3.5 h-3.5 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7' />
              </svg>
            </div>
            <div className='hidden md:block w-28'>
              <span>Owner</span>
            </div>
            <div className='hidden sm:block w-32'>
              <span>Type</span>
            </div>
            <div className='w-16 text-right'>
              <span>Open</span>
            </div>
          </div>

          <div className='divide-y divide-neutral-100'>
            {sitelist?.map((data, key) => (
              <div onClick={() => OnSiteSelectHandler(data._id)} key={key} className="cursor-pointer">
                <Listitem
                  title={data.site_name}
                  description={data.site_description || "Site branch"}
                  owner="me"
                  dateModified="Location"
                  badge="Site"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
