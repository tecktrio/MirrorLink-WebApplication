import React, { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Addbutton from '../../components/addbutton/Addbutton'
import SearchBar from '../../components/SearchBar/SearchBar'
import Listitem from '../../components/listitem/Listitem'
import { DELETE_MIRROR, GET_ALL_MIRRORS } from '../../serverRequests/ServerRequests'
import { CookieContext } from '../../Contexts/CookieContext'

export default function ManageMirrors() {
  const [mirrorlist, setMirrorlist] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [loading, setLoading] = useState(true)
  const [maxMirrors, setMaxMirrors] = useState(1)
  const [isLimitReached, setIsLimitReached] = useState(false)
  const { getCookie, setCookie } = useContext(CookieContext)
  const navigate = useNavigate()

  const loadMirrors = () => {
    let login_key = getCookie('login_key') || 'adminpassword'
    setLoading(true)
    GET_ALL_MIRRORS(login_key)
      .then((res) => {
        const data = res?.data || []
        const max = res?.max_mirrors || res?.limits?.max_mirrors || 1
        setMirrorlist(data)
        setFilteredList(data)
        setMaxMirrors(max)
        setIsLimitReached(Boolean(res?.limit_reached || data.length >= max))
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error loading mirrors:", err)
        setMirrorlist([])
        setFilteredList([])
        setLoading(false)
      })
  }

  const handleConfigureMirror = (id) => {
    setCookie("mirror_id", id, 1)
    navigate('/contentsformirror')
  }

  const deleteMirror = (id) => {
    if (!window.confirm("Are you sure you want to delete this mirror screen?")) return;
    let login_key = getCookie("login_key") || 'adminpassword'
    DELETE_MIRROR(login_key, id)
      .then(() => {
        setMirrorlist((prev) => prev.filter((m) => m._id !== id))
        setFilteredList((prev) => prev.filter((m) => m._id !== id))
      })
      .catch((error) => {
        console.error("Error deleting mirror:", error)
      })
  }

  useEffect(() => {
    loadMirrors()
  }, [])

  return (
    <div className='space-y-6'>
      {/* Top Header */}
      <div className='bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <h2 className='text-xl font-bold text-slate-800 tracking-tight'>Manage Mirrors</h2>
          <p className='text-xs text-slate-500 mt-1'>
            Configure physical screens, view screen credentials, and monitor display clients
          </p>
        </div>
        <Addbutton
          label='Add New Mirror'
          goto='/addmirror'
          disabled={isLimitReached}
          disabledTooltip={`Plan limit reached (${mirrorlist.length}/${maxMirrors} screens). Upgrade your plan to add more mirrors.`}
          className='w-full sm:w-auto justify-center'
        />
      </div>

      {isLimitReached && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900 gap-3">
          <span><b>Plan limit reached:</b> Your current plan allows up to {maxMirrors} mirror screen{maxMirrors > 1 ? 's' : ''}. Upgrade to connect more displays.</span>
          <Link to="/pricing" className="font-bold underline hover:text-amber-950 shrink-0">Upgrade Plan →</Link>
        </div>
      )}

      {/* Search & Stats Filter */}
      <div className='flex items-stretch sm:items-center justify-between gap-4 flex-col sm:flex-row'>
        <SearchBar data={mirrorlist} setSearch={setFilteredList} placeholder='Search mirrors by name or ID...' />
        <span className='text-xs font-semibold text-slate-500 shrink-0'>
          Showing {filteredList.length} of {mirrorlist.length} screens
        </span>
      </div>

      {/* List */}
      <div>
        {loading ? (
          <div className='p-12 text-center text-neutral-400 bg-white rounded-2xl border border-neutral-200'>
            Loading mirrors...
          </div>
        ) : filteredList.length === 0 ? (
          <div className='p-12 bg-white rounded-2xl border border-dashed border-neutral-300 text-center flex flex-col items-center justify-center'>
            <div className='w-12 h-12 rounded-xl bg-neutral-100 text-black flex items-center justify-center mb-3'>
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
              </svg>
            </div>
            <h4 className='text-sm font-bold text-black mb-1'>No Mirrors Registered</h4>
            <p className='text-xs text-neutral-500 max-w-sm mb-4'>
              {mirrorlist.length === 0 ? "You have not registered any mirror screens yet." : "No mirror matches your search keyword."}
            </p>
            {mirrorlist.length === 0 && (
              <Addbutton
                label='Create Your First Mirror'
                goto='/addmirror'
                disabled={isLimitReached}
                disabledTooltip={`Plan limit reached (${mirrorlist.length}/${maxMirrors} screens). Upgrade your plan to add more mirrors.`}
              />
            )}
          </div>
        ) : (
          <div className='bg-white rounded-2xl border border-neutral-200/90 shadow-2xs overflow-hidden'>
            {/* Google Drive Table Header */}
            <div className='flex items-center justify-between py-2.5 px-3 sm:px-4 border-b border-neutral-200/90 bg-neutral-50/70 text-[11px] font-bold text-neutral-500 uppercase tracking-wider select-none'>
              <div className='flex items-center gap-1.5 flex-1'>
                <span>Screen Name</span>
                <svg className='w-3.5 h-3.5 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7' />
                </svg>
              </div>
              <div className='hidden md:block w-28'>
                <span>Owner</span>
              </div>
              <div className='hidden sm:block w-32'>
                <span>Resolution</span>
              </div>
              <div className='w-20 text-right'>
                <span>Actions</span>
              </div>
            </div>

            {/* Google Drive Table Rows */}
            <div className='divide-y divide-neutral-100'>
              {filteredList.map((data, key) => {
                const details = `${data.mirror_description || 'Mirror Screen'} • ID: ${data.username || '—'} • Key: ${data.password || '—'}`
                return (
                  <div
                    key={data._id || key}
                    onClick={() => handleConfigureMirror(data._id)}
                    className="cursor-pointer"
                    title="Configure this mirror's playlist and settings"
                  >
                    <Listitem
                      title={data.mirror_name}
                      description={details}
                      owner="me"
                      dateModified={`${data.mirror_width || 1920} × ${data.mirror_height || 1080}`}
                      onDelete={() => deleteMirror(data._id)}
                      badge={`${data.mirror_width || 1920}x${data.mirror_height || 1080}`}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
