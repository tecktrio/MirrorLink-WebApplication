import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CookieContext } from '../../Contexts/CookieContext'
import { ASSIGN_CONTENT_TO_MIRROR, GET_ALL_CONTENTS } from '../../serverRequests/ServerRequests'

export default function AddContentModal({ isOpen, onClose, mirrorId, mirrorName = 'Mirror', onContentAdded }) {
  const { getCookie } = useContext(CookieContext)
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!isOpen) return
    setLoading(true); setError(''); setSelected([])
    GET_ALL_CONTENTS(getCookie('login_key')).then(r => setItems(r.data || [])).catch(e => setError(e.message || 'Could not load content library')).finally(() => setLoading(false))
  }, [isOpen, getCookie])
  const filtered = useMemo(() => items.filter(x => (x.content_title || '').toLowerCase().includes(query.toLowerCase())), [items, query])
  const importSelected = async () => {
    if (!selected.length || !mirrorId) return
    setSaving(true); setError('')
    try {
      await ASSIGN_CONTENT_TO_MIRROR(getCookie('login_key'), selected, mirrorId)
      onContentAdded?.(selected.length === 1 ? items.find(x => x._id === selected[0])?.content_title : `${selected.length} items`)
      onClose()
    } catch (e) { setError(e.message || 'Could not import selected content') } finally { setSaving(false) }
  }
  if (!isOpen) return null
  return <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
    <section className="bg-white rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
      <header className="p-5 border-b flex justify-between gap-4"><div><h2 className="text-lg font-bold">Import Content</h2><p className="text-sm text-neutral-500">Choose library content to add to {mirrorName}.</p></div><button onClick={onClose} aria-label="Close">✕</button></header>
      <div className="p-4 border-b flex gap-3"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search videos and images..." className="flex-1 border rounded-xl px-4 py-2.5"/><button onClick={() => { onClose(); navigate('/manage_contents') }} className="px-4 py-2 bg-neutral-100 rounded-xl font-semibold">Create New Content</button></div>
      {error && <p className="mx-5 mt-3 text-sm text-red-600">{error}</p>}
      <div className="p-4 overflow-y-auto flex-1">
        {loading ? <p className="p-10 text-center text-neutral-500">Loading content library…</p> : filtered.length ? <div className="grid sm:grid-cols-2 gap-3">{filtered.map(item => <label key={item._id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer ${selected.includes(item._id) ? 'border-black bg-neutral-50' : ''}`}><input type="checkbox" checked={selected.includes(item._id)} onChange={e => setSelected(s => e.target.checked ? [...s, item._id] : s.filter(id => id !== item._id))}/>{item.content_format === 'mp4' ? <div className="w-16 h-12 bg-neutral-100 rounded flex items-center justify-center">▶</div> : <img src={item.content_url} alt="" className="w-16 h-12 rounded object-cover bg-neutral-100"/>}<span className="min-w-0"><b className="block truncate">{item.content_title}</b><small className="text-neutral-500">{(item.content_format || 'image').toUpperCase()}</small></span></label>)}</div> : <div className="text-center p-10"><p className="text-neutral-600">Your library is empty or no content matches.</p><button onClick={() => { onClose(); navigate('/manage_contents') }} className="mt-3 underline font-semibold">Upload / Create Content</button></div>}
      </div>
      <footer className="p-4 border-t flex justify-between items-center"><span className="text-sm text-neutral-500">{selected.length} selected</span><div className="flex gap-2"><button onClick={onClose} className="px-4 py-2 border rounded-xl">Cancel</button><button disabled={!selected.length || saving} onClick={importSelected} className="px-5 py-2 bg-black text-white rounded-xl disabled:opacity-50">{saving ? 'Importing…' : 'Import Selected'}</button></div></footer>
    </section>
  </div>
}
