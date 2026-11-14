import React, { useContext, useEffect, useState } from 'react'
import Addbutton from '../../components/addbutton/Addbutton'
import Listitem from '../../components/listitem/Listitem'
import ManageMenus from '../manage_menus/ManageMenus'
import { DELETE_CONTENT, GET_ALL_CONTENTS } from '../../serverRequests/ServerRequests'
import { CookieContext } from '../../Contexts/CookieContext'

export default function ManageContents() {
  const [contentlist, setContentlist] = useState([])
  const [tab, setTab] = useState('videos')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const { getCookie } = useContext(CookieContext)

  const loadContents = () => {
    let login_key = getCookie('login_key') || 'adminpassword'
    setLoading(true)

    GET_ALL_CONTENTS(login_key).catch(() => ({ data: [] }))
      .then((contentsRes) => {
        const data = contentsRes?.data || []
        setContentlist(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error loading contents and mirrors:", err)
        setContentlist([])
        setLoading(false)
      })
  }

  const deleteContent = (id) => {
    if (!window.confirm("Are you sure you want to delete this media item?")) return;
    let login_key = getCookie("login_key") || 'adminpassword'
    DELETE_CONTENT(login_key, id)
      .then(() => {
        setContentlist((prev) => prev.filter((c) => c._id !== id))
      })
      .catch((error) => {
        console.error("Error deleting content:", error)
      })
  }

  useEffect(() => {
    loadContents()
  }, [])

  const isVideo = c => ['mp4','mov','webm','m4v','avi','mkv'].includes((c.content_format || '').toLowerCase()) || (c.content_url || '').match(/\.(mp4|mov|webm|m4v)(\?|$)/i)
  const isImage = c => ['jpg','jpeg','png','webp','gif','bmp'].includes((c.content_format || '').toLowerCase()) || (c.content_url || '').match(/\.(jpg|jpeg|png|webp|gif|bmp)(\?|$)/i)
  const visibleContents = contentlist.filter(c => tab === 'videos' ? isVideo(c) : isImage(c)).filter(c => (c.content_title || '').toLowerCase().includes(query.toLowerCase()))

  return (
    <div className='space-y-6'>
      {/* Top Header */}
      <div className='bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <h2 className='text-xl font-bold text-black tracking-tight'>Manage Contents</h2>
          <p className='text-xs text-neutral-500 mt-1'>
            Manage your shared video, image, and menu library.
          </p>
        </div>
        <div className='flex items-center gap-2 w-full sm:w-auto'>
          {tab !== 'menus' && <Addbutton label='Upload / Create Content' goto='/addcontent' className='w-full sm:w-auto justify-center' />}
        </div>
      </div>

      <div className='bg-white border rounded-2xl p-2 flex gap-2'>{[['videos','Videos'],['images','Images'],['menus','Menus']].map(([id,label])=><button key={id} onClick={()=>{setTab(id);setQuery('')}} className={`px-4 py-2 rounded-xl text-sm font-semibold ${tab===id?'bg-black text-white':'hover:bg-neutral-100'}`}>{label}</button>)}</div>
      {tab === 'menus' ? <ManageMenus embedded /> : <>
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Search ${tab}...`} className='w-full bg-white border rounded-xl px-4 py-3'/>

      {/* List */}
      <div>
        {loading ? (
          <div className='p-12 text-center text-neutral-400 bg-white rounded-2xl border border-neutral-200'>
            Loading media library...
          </div>
        ) : visibleContents.length === 0 ? (
          <div className='p-12 bg-white rounded-2xl border border-dashed border-neutral-300 text-center flex flex-col items-center justify-center'>
            <div className='w-12 h-12 rounded-xl bg-neutral-100 text-black flex items-center justify-center mb-3'>
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
              </svg>
            </div>
            <h4 className='text-sm font-bold text-black mb-1'>No Media Contents Found</h4>
            <p className='text-xs text-neutral-500 max-w-sm mb-4'>
              {contentlist.length === 0 ? "You have not uploaded any media files yet." : `No ${tab} match your search.`}
            </p>
            {contentlist.length === 0 && (
              <Addbutton label='Upload / Create Content' goto='/addcontent' />
            )}
          </div>
        ) : (
          <div className='space-y-2'>
            {visibleContents.map((data, key) => {
              return (
                <Listitem
                  key={data._id || key}
                  title={data.content_title}
                  description={data.content_description || 'Shared library content'}
                  onDelete={() => deleteContent(data._id)}
                  onPlay={data._id}
                  badge={data.content_format?.toUpperCase() || "IMG"}
                />
              )
            })}
          </div>
        )}
      </div>
      </>}
    </div>
  )
}
