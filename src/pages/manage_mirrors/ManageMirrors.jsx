import React, { useContext, useEffect, useState } from 'react'
import Addbutton from '../../components/addbutton/Addbutton'
import SearchBar from '../../components/SearchBar/SearchBar'
import Listitem from '../../components/listitem/Listitem'
import { DELETE_MIRROR, GET_ALL_MIRRORS } from '../../serverRequests/ServerRequests'
import { CookieContext } from '../../Contexts/CookieContext'
import { useNavigate } from 'react-router-dom'

export default function ManageMirrors() {
  const [mirrorlist, setMirrorlist] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [loading, setLoading] = useState(true)
  const { getCookie, setCookie } = useContext(CookieContext)
  const navigate = useNavigate()

  const loadMirrors = () => {
    let login_key = getCookie('login_key') || 'adminpassword'
    setLoading(true)
    GET_ALL_MIRRORS(login_key)
      .then((res) => {
        const data = res?.data || []
        setMirrorlist(data)
        setFilteredList(data)
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
        <Addbutton label='Add New Mirror' goto='/addmirror' className='w-full sm:w-auto justify-center' />
      </div>

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
              <Addbutton label='Create Your First Mirror' goto='/addmirror' />
            )}
          </div>
        ) : (
          <div className='space-y-2'>
            {filteredList.map((data, key) => {
              const details = `${data.mirror_description || 'Mirror Screen'} • Screen ID: ${data.username || '—'} • Key: ${data.password || '—'}`
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
                    onDelete={() => deleteMirror(data._id)}
                    badge={`${data.mirror_width || 1920}x${data.mirror_height || 1080}`}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
