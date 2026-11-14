import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CookieContext } from '../../Contexts/CookieContext'
import { ASSIGN_CONTENT_TO_MIRROR, CREATE_CONTENT, GET_ALL_CONTENTS, GET_MENUS, RENDER_MENU_PREVIEW } from '../../serverRequests/ServerRequests'
import ImageCropperModal from '../ImageCropperModal/ImageCropperModal'

export default function AddContentModal({ isOpen, onClose, mirrorId, mirrorName = 'Mirror', mirrorWidth = 1920, mirrorHeight = 1080, onContentAdded }) {
  const { getCookie } = useContext(CookieContext)
  const navigate = useNavigate()
  const [items, setItems] = useState([]), [menus, setMenus] = useState([]), [query, setQuery] = useState('')
  const [selected, setSelected] = useState([]), [selectedMenu, setSelectedMenu] = useState(null)
  const [loading, setLoading] = useState(false), [saving, setSaving] = useState(false), [error, setError] = useState(''), [crop, setCrop] = useState(null)
  const loginKey = getCookie('login_key')
  useEffect(() => {
    if (!isOpen) return
    setLoading(true); setError(''); setSelected([]); setSelectedMenu(null); setCrop(null)
    Promise.all([GET_ALL_CONTENTS(loginKey), GET_MENUS(loginKey)]).then(([contentResult, menuResult]) => {
      setItems(contentResult.data || []); setMenus(menuResult.data || [])
    }).catch(e => setError(e.message || 'Could not load content library')).finally(() => setLoading(false))
  }, [isOpen, loginKey])
  const filtered = useMemo(() => items.filter(x => (x.content_title || '').toLowerCase().includes(query.toLowerCase())), [items, query])
  const importSelected = async () => {
    if ((!selected.length && !selectedMenu) || !mirrorId) return
    setSaving(true); setError('')
    try {
      if (selectedMenu) {
        const preview = await RENDER_MENU_PREVIEW(loginKey, selectedMenu._id, mirrorWidth, mirrorHeight)
        setCrop({ menu: selectedMenu, preview: preview.preview_url, width: preview.width, height: preview.height })
        return
      }
      await ASSIGN_CONTENT_TO_MIRROR(loginKey, selected, mirrorId)
      onContentAdded?.(selected.length === 1 ? items.find(x => x._id === selected[0])?.content_title : `${selected.length} items`)
      onClose()
    } catch (e) { setError(e.message || 'Could not import selected content') } finally { setSaving(false) }
  }
  const completeCrop = async file => {
    if (!crop) return
    setSaving(true); setError('')
    try {
      await CREATE_CONTENT(loginKey, crop.menu.title, 'Menu template image', file, mirrorId, null, crop.width, crop.height)
      onContentAdded?.(crop.menu.title); setCrop(null); onClose()
    } catch (e) { setError(e.message || 'Could not import menu image') } finally { setSaving(false) }
  }
  if (!isOpen) return null
  return <>
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <section className="bg-white rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl border border-neutral-200" onClick={e => e.stopPropagation()}>
        <header className="p-5 border-b border-neutral-200 flex justify-between gap-4"><div><h2 className="text-lg font-bold text-black">Import Content</h2><p className="text-sm text-neutral-500">Choose library content or a saved menu to add to {mirrorName}.</p></div><button className="text-neutral-500 hover:text-black" onClick={onClose} aria-label="Close">✕</button></header>
        <div className="p-4 border-b border-neutral-200 flex gap-3"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search videos, images, and menus..." className="flex-1 border border-neutral-300 rounded-xl px-4 py-2.5 outline-none focus:border-black"/><button onClick={() => { onClose(); navigate('/manage_contents') }} className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-semibold text-sm">Create New Content</button></div>
        {error && <p className="mx-5 mt-3 text-sm text-red-600">{error}</p>}
        <div className="p-4 overflow-y-auto flex-1 space-y-6">
          {loading ? <p className="p-10 text-center text-neutral-500">Loading content library…</p> : <>
            <section><h3 className="text-sm font-bold mb-3">Videos and images</h3>{filtered.length ? <div className="grid sm:grid-cols-2 gap-3">{filtered.map(item => <label key={item._id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer ${selected.includes(item._id) ? 'border-black bg-neutral-50' : 'border-neutral-200'}`}><input type="checkbox" checked={selected.includes(item._id)} onChange={e => { setSelectedMenu(null); setSelected(s => e.target.checked ? [...s, item._id] : s.filter(id => id !== item._id)) }}/>{item.content_format === 'mp4' ? <div className="w-16 h-12 bg-neutral-100 rounded flex items-center justify-center">▶</div> : <img src={item.content_url} alt="" className="w-16 h-12 rounded object-cover bg-neutral-100"/>}<span className="min-w-0"><b className="block truncate">{item.content_title}</b><small className="text-neutral-500">{(item.content_format || 'image').toUpperCase()}</small></span></label>)}</div> : <p className="text-sm text-neutral-500">No library content matches your search.</p>}</section>
            <section><h3 className="text-sm font-bold mb-3">Saved menus <span className="font-normal text-neutral-500">(opens crop preview)</span></h3>{menus.length ? <div className="grid sm:grid-cols-2 gap-3">{menus.filter(menu => menu.title.toLowerCase().includes(query.toLowerCase())).map(menu => <label key={menu._id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer ${selectedMenu?._id === menu._id ? 'border-black bg-neutral-50' : 'border-neutral-200'}`}><input type="radio" name="saved-menu" checked={selectedMenu?._id === menu._id} onChange={() => { setSelected([]); setSelectedMenu(menu) }}/><div className="w-16 h-12 rounded flex items-center justify-center bg-neutral-100 text-xs font-bold truncate px-1">{menu.title}</div><span><b className="block">{menu.title}</b><small className="text-neutral-500">Menu template</small></span></label>)}</div> : <p className="text-sm text-neutral-500">No saved menus yet. Create one from Content → Menus.</p>}</section>
          </>}
        </div>
        <footer className="p-4 border-t border-neutral-200 flex justify-between items-center"><span className="text-sm text-neutral-500">{selectedMenu ? `Menu: ${selectedMenu.title}` : `${selected.length} selected`}</span><div className="flex gap-2"><button onClick={onClose} className="px-4 py-2 border border-neutral-300 rounded-xl">Cancel</button><button disabled={(!selected.length && !selectedMenu) || saving} onClick={importSelected} className="px-5 py-2 bg-black text-white rounded-xl disabled:opacity-50">{saving ? 'Preparing…' : 'Import Selected'}</button></div></footer>
      </section>
    </div>
    {crop && <ImageCropperModal isOpen imageFile={crop.preview} targetWidth={crop.width} targetHeight={crop.height} title="Crop Menu for Mirror" onClose={() => setCrop(null)} onCropComplete={completeCrop}/>}
  </>
}
