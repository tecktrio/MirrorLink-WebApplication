import React, { useContext, useEffect, useState } from 'react'
import Addbutton from '../../components/addbutton/Addbutton'
import SearchBar from '../../components/SearchBar/SearchBar'
import Listitem from '../../components/listitem/Listitem'
import { DELETE_CONTENT, GET_ALL_CONTENTS, GET_ALL_MIRRORS } from '../../serverRequests/ServerRequests'
import { CookieContext } from '../../Contexts/CookieContext'
import { useNavigate } from 'react-router-dom'

export default function ManageContents() {
  const [contentlist, setContentlist] = useState([])
  const [searchresult, setSearchResult] = useState([])
  const [mirrors, setMirrors] = useState([])
  const [selectedMirrorFilter, setSelectedMirrorFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { getCookie, setCookie } = useContext(CookieContext)

  const loadContents = () => {
    let login_key = getCookie('login_key') || 'adminpassword'
    setLoading(true)

    Promise.all([
      GET_ALL_CONTENTS(login_key).catch(() => ({ data: [] })),
      GET_ALL_MIRRORS(login_key).catch(() => ({ data: [] }))
    ])
      .then(([contentsRes, mirrorsRes]) => {
        const data = contentsRes?.data || []
        const mirrorData = mirrorsRes?.data || []
        setContentlist(data)
        setSearchResult(data)
        setMirrors(mirrorData)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error loading contents and mirrors:", err)
        setContentlist([])
        setSearchResult([])
        setLoading(false)
      })
  }

  const deleteContent = (id) => {
    if (!window.confirm("Are you sure you want to delete this media item?")) return;
    let login_key = getCookie("login_key") || 'adminpassword'
    DELETE_CONTENT(login_key, id)
      .then(() => {
        setContentlist((prev) => prev.filter((c) => c._id !== id))
        setSearchResult((prev) => prev.filter((c) => c._id !== id))
      })
      .catch((error) => {
        console.error("Error deleting content:", error)
      })
  }

  useEffect(() => {
    loadContents()
  }, [])

  const handleFilterChange = (mirrorId) => {
    setSelectedMirrorFilter(mirrorId)
    if (mirrorId === 'all') {
      setSearchResult(contentlist)
    } else {
      setSearchResult(contentlist.filter((c) => String(c.mirror_id) === String(mirrorId)))
    }
  }

  const mirrorMap = new Map(mirrors.map((m) => [String(m._id), m]))

  return (
    <div className='space-y-6'>
      {/* Top Header */}
      <div className='bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <h2 className='text-xl font-bold text-black tracking-tight'>Manage Contents</h2>
          <p className='text-xs text-neutral-500 mt-1'>
            Contents are tied directly to individual mirrors. Manage and upload content per mirror.
          </p>
        </div>
        <div className='flex items-center gap-2 w-full sm:w-auto'>
          <Addbutton label='Upload Content' goto='/addcontent' className='w-full sm:w-auto justify-center' />
        </div>
      </div>

      {/* Info notice about mirror-specific contents */}
      <div className='p-3.5 bg-neutral-100 border border-neutral-300 rounded-2xl flex items-center justify-between gap-3 flex-wrap'>
        <div className='flex items-center gap-2.5 text-xs text-neutral-700'>
          <svg className='w-4 h-4 text-black shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
          </svg>
          <span>Contents belong directly to each mirror. You can add and order content directly in each mirror's setup.</span>
        </div>
        <button
          onClick={() => navigate('/manage_mirrors')}
          className='text-xs font-semibold text-black hover:underline cursor-pointer'
        >
          Go to Manage Mirrors →
        </button>
      </div>

      {/* Search & Mirror Filter */}
      <div className='flex items-stretch sm:items-center justify-between gap-4 flex-col sm:flex-row'>
        <SearchBar data={contentlist} setSearch={setSearchResult} placeholder='Search content by title...' />
        {mirrors.length > 0 && (
          <div className='flex items-center gap-2 shrink-0'>
            <span className='text-xs font-medium text-neutral-500'>Filter by Mirror:</span>
            <select
              value={selectedMirrorFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className='px-3 py-1.5 bg-white border border-neutral-300 rounded-xl text-xs font-semibold text-black outline-none cursor-pointer'
            >
              <option value='all'>All Mirrors ({contentlist.length})</option>
              {mirrors.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.mirror_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* List */}
      <div>
        {loading ? (
          <div className='p-12 text-center text-neutral-400 bg-white rounded-2xl border border-neutral-200'>
            Loading media library...
          </div>
        ) : searchresult.length === 0 ? (
          <div className='p-12 bg-white rounded-2xl border border-dashed border-neutral-300 text-center flex flex-col items-center justify-center'>
            <div className='w-12 h-12 rounded-xl bg-neutral-100 text-black flex items-center justify-center mb-3'>
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
              </svg>
            </div>
            <h4 className='text-sm font-bold text-black mb-1'>No Media Contents Found</h4>
            <p className='text-xs text-neutral-500 max-w-sm mb-4'>
              {contentlist.length === 0 ? "You have not uploaded any media files yet." : "No content matches your filter keyword."}
            </p>
            {contentlist.length === 0 && (
              <Addbutton label='Upload Content to Mirror' goto='/addcontent' />
            )}
          </div>
        ) : (
          <div className='space-y-2'>
            {searchresult.map((data, key) => {
              const assignedMirror = mirrorMap.get(String(data.mirror_id))
              const mirrorLabel = assignedMirror
                ? `Mirror: ${assignedMirror.mirror_name} (${assignedMirror.mirror_width || 1920} × ${assignedMirror.mirror_height || 1080})`
                : 'Mirror Content'

              return (
                <Listitem
                  key={data._id || key}
                  title={data.content_title}
                  description={`${data.content_description ? data.content_description + ' • ' : ''}${mirrorLabel}`}
                  onDelete={() => deleteContent(data._id)}
                  onPlay={data._id}
                  badge={data.content_format?.toUpperCase() || "IMG"}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
