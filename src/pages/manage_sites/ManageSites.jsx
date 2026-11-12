import React, { useContext, useEffect, useState } from 'react'
import Addbutton from '../../components/addbutton/Addbutton'
import SearchBar from '../../components/SearchBar/SearchBar'
import Listitem from '../../components/listitem/Listitem'
import { DELETE_SITE, GET_AVAILABLE_SITES } from '../../serverRequests/ServerRequests'
import { CookieContext } from '../../Contexts/CookieContext'
import { useNavigate } from 'react-router-dom'

export default function ManageSites() {
  const [sitelist, setSitelist] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [loading, setLoading] = useState(true)
  const { getCookie } = useContext(CookieContext)
  const navigate = useNavigate()

  const loadSites = () => {
    let login_key = getCookie("login_key") || 'adminpassword'
    setLoading(true)
    GET_AVAILABLE_SITES(login_key)
      .then((res) => {
        const data = res?.data || []
        setSitelist(data)
        setFilteredList(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setSitelist([])
        setFilteredList([])
        setLoading(false)
      })
  }

  const deleteSite = (id) => {
    if (!window.confirm("Are you sure you want to delete this site?")) return;
    let login_key = getCookie("login_key") || 'adminpassword'
    DELETE_SITE(login_key, id)
      .then(() => {
        setSitelist((prev) => prev.filter((s) => s._id !== id))
        setFilteredList((prev) => prev.filter((s) => s._id !== id))
      })
      .catch((err) => {
        console.error("Error deleting site:", err)
      })
  }

  useEffect(() => {
    loadSites()
  }, [])

  return (
    <div className='space-y-6'>
      {/* Top Header */}
      <div className='bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <h2 className='text-xl font-bold text-slate-800 tracking-tight'>Manage Sites</h2>
          <p className='text-xs text-slate-500 mt-1'>
            Organize mirror screens and media distributions by location or branch
          </p>
        </div>
        <Addbutton label='Add New Site' goto='/addsite' className='w-full sm:w-auto justify-center' />
      </div>

      {/* Search & Stats Filter */}
      <div className='flex items-stretch sm:items-center justify-between gap-4 flex-col sm:flex-row'>
        <SearchBar data={sitelist} setSearch={setFilteredList} placeholder='Search sites by name or description...' />
        <span className='text-xs font-semibold text-slate-500 shrink-0'>
          Showing {filteredList.length} of {sitelist.length} sites
        </span>
      </div>

      {/* List */}
      <div>
        {loading ? (
          <div className='p-12 text-center text-neutral-400 bg-white rounded-2xl border border-neutral-200'>
            Loading sites...
          </div>
        ) : filteredList.length === 0 ? (
          <div className='p-12 bg-white rounded-2xl border border-dashed border-neutral-300 text-center flex flex-col items-center justify-center'>
            <div className='w-12 h-12 rounded-xl bg-neutral-100 text-black flex items-center justify-center mb-3'>
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
              </svg>
            </div>
            <h4 className='text-sm font-bold text-black mb-1'>No Sites Found</h4>
            <p className='text-xs text-neutral-500 max-w-sm mb-4'>
              {sitelist.length === 0 ? "You have not added any site yet." : "No site matches your search keyword."}
            </p>
            {sitelist.length === 0 && (
              <Addbutton label='Create Your First Site' goto='/addsite' />
            )}
          </div>
        ) : (
          <div className='space-y-2'>
            {filteredList.map((data, key) => (
              <Listitem
                key={data._id || key}
                title={data.site_name}
                description={data.site_description || "No description provided"}
                onDelete={() => deleteSite(data._id)}
                badge='Site'
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
