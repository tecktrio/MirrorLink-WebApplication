import React, { useContext, useEffect, useState } from 'react'
import { CookieContext } from '../../Contexts/CookieContext'
import { DELETE_MENU, GET_MENU_TEMPLATES, GET_MENUS, SAVE_MENU } from '../../serverRequests/ServerRequests'

export default function ManageMenus({ embedded = false }) {
  const { getCookie } = useContext(CookieContext)
  const loginKey = getCookie('login_key')
  const [templates, setTemplates] = useState([])
  const [menus, setMenus] = useState([])
  const [editor, setEditor] = useState(null)
  const [chosen, setChosen] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const reload = () => Promise.all([GET_MENU_TEMPLATES(), GET_MENUS(loginKey)])
    .then(([templateResult, menuResult]) => { setTemplates(templateResult.data || []); setMenus(menuResult.data || []) })
    .catch(e => setError(e.message || 'Could not load menus'))
  useEffect(() => { reload() }, [])

  const start = (menu = null) => {
    setError('')
    if (!menu) { setEditor({}); setChosen(null); return }
    const template = templates.find(item => item._id === menu.template_id)
    if (!template) { setError('This menu template is unavailable.'); return }
    setEditor({ ...menu.data, _id: menu._id, template_id: menu.template_id })
    setChosen(template)
  }
  const selectTemplate = template => {
    const values = {}
    template.components.forEach(component => {
      values[component.key] = component.type === 'items' ? [{ name: '', price: '', description: '', image_url: '' }] : (component.default || '')
    })
    setChosen(template)
    setEditor(values)
  }
  const update = (key, value) => setEditor(current => ({ ...current, [key]: value }))
  const save = async () => {
    if (!editor?.title?.trim()) { setError('Enter a menu title.'); return }
    setBusy(true); setError('')
    try { await SAVE_MENU(loginKey, editor._id, chosen._id, editor); await reload(); setEditor(null); setChosen(null) }
    catch (e) { setError(e.message || 'Could not save menu') }
    finally { setBusy(false) }
  }
  const deleteMenu = async id => {
    if (!window.confirm('Delete this menu?')) return
    try { await DELETE_MENU(loginKey, id); await reload() }
    catch (e) { setError(e.message || 'Could not delete menu') }
  }

  return <div className="space-y-5">
    {!embedded && <div className="bg-white p-5 rounded-2xl border"><h1 className="text-xl font-bold">Menus</h1><p className="text-sm text-neutral-500">Create and manage reusable template based menus.</p></div>}
    {error && <div className="p-3 rounded-xl bg-red-50 text-sm text-red-700">{error}</div>}
    {editor ? <div className="bg-white border rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center"><h2 className="text-lg font-bold">{editor._id ? 'Edit Menu' : chosen ? `New ${chosen.name}` : 'Choose a menu template'}</h2><button onClick={() => { setEditor(null); setChosen(null) }} className="text-sm text-neutral-500">Close</button></div>
      {!chosen ? <div className="grid md:grid-cols-3 gap-4">{templates.map(template => <button key={template._id} onClick={() => selectTemplate(template)} className="text-left border rounded-xl p-4 hover:border-black"><div className="h-28 rounded-lg mb-3" style={{ background: template.background, borderBottom: `8px solid ${template.accent}` }} /><b>{template.name}</b><p className="text-sm text-neutral-500 mt-1">{template.description}</p></button>)}{!templates.length && <p className="text-sm text-neutral-500">No templates are available.</p>}</div> : <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">{chosen.components.map(component => <div key={component.key}>
          <label className="block text-sm font-semibold mb-1">{component.label}</label>
          {component.type === 'items' ? <div className="space-y-3">{(editor.items || []).map((item, index) => <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-xl p-3">
            <input className="border rounded-lg p-2" placeholder="Item name" value={item.name} onChange={e => update('items', editor.items.map((row, i) => i === index ? { ...row, name: e.target.value } : row))} />
            <input className="border rounded-lg p-2" placeholder="Price" value={item.price} onChange={e => update('items', editor.items.map((row, i) => i === index ? { ...row, price: e.target.value } : row))} />
            <input className="border rounded-lg p-2 col-span-2" placeholder="Description" value={item.description} onChange={e => update('items', editor.items.map((row, i) => i === index ? { ...row, description: e.target.value } : row))} />
            <input className="border rounded-lg p-2 col-span-2" placeholder="Image URL (optional)" value={item.image_url} onChange={e => update('items', editor.items.map((row, i) => i === index ? { ...row, image_url: e.target.value } : row))} />
            <button className="text-red-600 text-sm col-span-2 text-left" onClick={() => update('items', editor.items.filter((_, i) => i !== index))}>Remove item</button>
          </div>)}<button className="border rounded-lg px-3 py-2 text-sm" onClick={() => update('items', [...(editor.items || []), { name: '', price: '', description: '', image_url: '' }])}>+ Add item</button></div>
            : component.type === 'color' ? <input type="color" value={editor[component.key] || '#ffffff'} onChange={e => update(component.key, e.target.value)} className="h-10 w-20" />
              : <input value={editor[component.key] || ''} onChange={e => update(component.key, e.target.value)} className="w-full border rounded-lg px-3 py-2" />}
        </div>)}<button disabled={busy} onClick={save} className="bg-black text-white rounded-xl px-5 py-2.5">{busy ? 'Saving…' : 'Save Menu'}</button></div>
        <div className="rounded-xl p-8 min-h-96 overflow-auto" style={{ background: editor.background, color: chosen.layout === 'modern' ? 'white' : '#171717' }}>
          <div className="text-center border-b-2 pb-4 mb-5" style={{ borderColor: editor.accent }}><div className="tracking-[.25em] text-xs sm:text-sm break-words" style={{ color: editor.accent }}>{editor.eyebrow}</div><h2 className="text-2xl sm:text-4xl font-bold mt-2 break-words" style={{ color: editor.accent }}>{editor.title || 'Menu title'}</h2><p className="break-words">{editor.subtitle}</p></div>
          <div className="grid sm:grid-cols-2 gap-4">{(editor.items || []).map((item, index) => <div key={index} className="border-b p-2">{item.image_url && <img src={item.image_url} alt="" className="w-full h-24 object-cover rounded mb-2" />}<b>{item.name || 'Menu item'}</b><strong className="float-right" style={{ color: editor.accent }}>{item.price}</strong><p className="text-sm opacity-70">{item.description}</p></div>)}</div><p className="text-center mt-6" style={{ color: editor.accent }}>{editor.footer}</p>
        </div>
      </div>}
    </div> : <>
      <div className="flex flex-wrap justify-between items-center gap-3"><div><h2 className="text-lg font-bold">Saved menus</h2><p className="text-sm text-neutral-500">Edit saved menus or choose one from Import Content on a mirror.</p></div><button onClick={() => start()} className="bg-black text-white rounded-xl px-4 py-2.5">+ Create New Menu</button></div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{menus.map(menu => <article key={menu._id} className="bg-white border rounded-2xl p-5"><div className="h-32 rounded-xl mb-4 flex items-center justify-center" style={{ background: templates.find(t => t._id === menu.template_id)?.background }}><span className="text-xl font-bold">{menu.title}</span></div><p className="text-xs text-neutral-500">{templates.find(t => t._id === menu.template_id)?.name}</p><div className="flex gap-2 mt-4"><button onClick={() => start(menu)} className="border rounded-lg px-3 py-2 text-sm">Edit</button><button onClick={() => deleteMenu(menu._id)} className="text-red-600 px-2">Delete</button></div></article>)}</div>
      {!menus.length && <div className="bg-white border border-dashed rounded-2xl p-10 text-center text-neutral-500">No menus yet. Create one from a template.</div>}
    </>}
  </div>
}
