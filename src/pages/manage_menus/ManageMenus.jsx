import React, { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CookieContext } from '../../Contexts/CookieContext'
import { DELETE_MENU, DELETE_MENU_TEMPLATE, GET_MENU_TEMPLATES, GET_MENUS, SAVE_MENU, GET_ALL_MIRRORS, GET_MENU_SHARE_LINK, SET_MENU_ACTIVE, SET_MENU_MIRRORS, CREATE_CONTENT } from '../../serverRequests/ServerRequests'

const prepareCustomMenu = (template, saved = {}, menuId) => {
  const templateBlocks = template.blocks || []
  const savedBlocks = saved.blocks || []
  const savedByKey = {}
  savedBlocks.forEach(b => {
    if (b && b.holder_key) savedByKey[b.holder_key] = b
  })

  // Synchronize with the current template definition so newly added/updated template blocks appear
  const blocks = templateBlocks.map((tblk, index) => {
    const sblk = savedByKey[tblk.holder_key]
    return {
      ...tblk,
      scope: tblk.scope || 'page',
      holder_key: tblk.holder_key || `${tblk.type}-${index + 1}`,
      holder_label: tblk.holder_label || `${tblk.type === 'text' ? 'Text' : 'Image'} ${index + 1}`,
      text: sblk?.text !== undefined ? sblk.text : (tblk.text || ''),
      image_url: sblk?.image_url !== undefined ? sblk.image_url : (tblk.image_url || '')
    }
  })

  const count = Math.max(1, Number(template.item_count || saved.item_count || 1))
  const assignments = template.item_assignments || saved.item_assignments || Array.from({ length: count }, () => blocks.filter(block => block.scope === 'item').map(block => block.holder_key))
  const oldItems = saved.items || []
  return { ...saved, _id: menuId, template_id: template._id, title: saved.title || '', background: template.background, background_image: template.background_image || '', blocks, item_count: count, item_assignments: assignments, item_area: template.item_area, items: Array.from({ length: count }, (_, index) => oldItems[index] || {}) }
}

export default function ManageMenus({ embedded = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { getCookie } = useContext(CookieContext)
  const loginKey = getCookie('login_key')
  const [templates, setTemplates] = useState([])
  const [menus, setMenus] = useState([])
  const [loadingMenus, setLoadingMenus] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [editor, setEditor] = useState(null)
  const [chosen, setChosen] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [mirrors, setMirrors] = useState([])
  const [selectedMirror, setSelectedMirror] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [menuPreviewOrientation, setMenuPreviewOrientation] = useState('landscape')

  const fetchTemplates = async () => {
    if (templates.length > 0) return templates
    setLoadingTemplates(true)
    try {
      const templateResult = await GET_MENU_TEMPLATES(loginKey)
      const data = templateResult.data || []
      setTemplates(data)
      return data
    } catch (e) {
      setError(e.message || 'Could not load menu templates')
      return []
    } finally {
      setLoadingTemplates(false)
    }
  }

  const reload = () => {
    setLoadingMenus(true)
    return GET_MENUS(loginKey)
      .then(menuResult => { setMenus(menuResult.data || []) })
      .catch(e => setError(e.message || 'Could not load menus'))
      .finally(() => setLoadingMenus(false))
  }

  useEffect(() => {
    reload()
    GET_ALL_MIRRORS(loginKey).then(result => {
      const available = result.data || []
      setMirrors(available)
      const initial = getCookie('mirror_id') || available[0]?._id || ''
      setSelectedMirror(initial)
    }).catch(e => setError(e.message || 'Could not load mirrors'))
  }, [])

  useEffect(() => {
    if (!location.state?.openTemplateChooser) return
    setEditor({})
    setChosen(null)
    fetchTemplates()
    reload()
    navigate(location.pathname, { replace: true, state: null })
  }, [location.key])

  useEffect(() => {
    if (!selectedMirror) { setShareUrl(''); return }
    GET_MENU_SHARE_LINK(loginKey, selectedMirror)
      .then(result => setShareUrl(`${window.location.origin}/menu/${result.share_token}`))
      .catch(e => setError(e.message || 'Could not create menu QR link'))
  }, [selectedMirror, loginKey])

  const start = async (menu = null) => {
    setError('')
    const currentTemplates = await fetchTemplates()
    if (!menu) { setEditor({}); setChosen(null); return }
    const template = currentTemplates.find(item => item._id === menu.template_id)
    if (!template) { setError('This menu template is unavailable.'); return }
    if (template.custom_layout) { setEditor(prepareCustomMenu(template, menu.data || {}, menu._id)); setChosen(template); setMenuPreviewOrientation(template.canvas_orientation || 'portrait'); return }
    setEditor({ ...menu.data, _id: menu._id, template_id: menu.template_id, template_name: template.name })
    setChosen(template)
  }
  const selectTemplate = template => {
    if (template.custom_layout) {
      setChosen(template)
      setEditor(prepareCustomMenu(template))
      setMenuPreviewOrientation(template.canvas_orientation || 'portrait')
      return
    }
    const values = {}
    template.components.forEach(component => {
      values[component.key] = component.type === 'items' ? [{ name: '', price: '', description: '', image_url: '' }] : (component.default || '')
    })
    setChosen(template)
    setEditor(values)
  }
  const update = (key, value) => setEditor(current => ({ ...current, [key]: value }))
  const uploadItemImage = async (file, index) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Choose an image file.'); return }
    const priorUrl = editor.items?.[index]?.image_url || ''
    const localUrl = URL.createObjectURL(file)
    setEditor(current => ({ ...current, items: current.items.map((item, i) => i === index ? { ...item, image_url: localUrl } : item) }))
    setBusy(true); setError('')
    try {
      const uploaded = await CREATE_CONTENT(loginKey, `${editor.title || 'Menu'} item ${index + 1}`, 'Menu item image asset', file)
      setEditor(current => ({ ...current, items: current.items.map((item, i) => i === index ? { ...item, image_url: uploaded.content_url } : item) }))
      URL.revokeObjectURL(localUrl)
    } catch (e) {
      setEditor(current => ({ ...current, items: current.items.map((item, i) => i === index ? { ...item, image_url: priorUrl } : item) }))
      URL.revokeObjectURL(localUrl)
      setError(e.message || 'Could not upload menu image')
    } finally { setBusy(false) }
  }
  const uploadCustomImage = async (file, target) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Choose an image file.'); return }
    setBusy(true); setError('')
    try {
      const uploaded = await CREATE_CONTENT(loginKey, `${editor.title || 'Menu'} image`, 'Custom menu holder image', file)
      if (target.scope === 'page') update('blocks', editor.blocks.map((block, i) => i === target.blockIndex ? { ...block, image_url: uploaded.content_url } : block))
      else update('items', editor.items.map((item, i) => i === target.itemIndex ? { ...item, [target.holderKey]: uploaded.content_url } : item))
    } catch (e) { setError(e.message || 'Could not upload menu image') }
    finally { setBusy(false) }
  }
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
  const deleteTemplate = async template => {
    if (!window.confirm(`Delete the custom template “${template.name}”?`)) return
    setError('')
    try { await DELETE_MENU_TEMPLATE(loginKey, template._id); await reload() }
    catch (e) { setError(e.message || 'Could not delete custom template') }
  }
  const toggleActive = async menu => {
    const next = menu.is_active === false
    setMenus(current => current.map(item => item._id === menu._id ? { ...item, is_active: next } : item))
    try { await SET_MENU_ACTIVE(loginKey, menu._id, next) }
    catch (e) { setMenus(current => current.map(item => item._id === menu._id ? { ...item, is_active: !next } : item)); setError(e.message || 'Could not update menu status') }
  }
  const toggleMirror = async (menu, assigned) => {
    if (!selectedMirror) return
    const oldIds = menu.mirror_ids || []
    const nextIds = assigned ? [...oldIds, selectedMirror] : oldIds.filter(id => String(id) !== String(selectedMirror))
    setMenus(current => current.map(item => item._id === menu._id ? { ...item, mirror_ids: nextIds } : item))
    try { await SET_MENU_MIRRORS(loginKey, menu._id, selectedMirror, assigned) }
    catch (e) { setMenus(current => current.map(item => item._id === menu._id ? { ...item, mirror_ids: oldIds } : item)); setError(e.message || 'Could not update mirror assignment') }
  }

  const customPreview = chosen?.custom_layout && editor ? (() => {
    const holderStyle = block => ({ position: 'absolute', left: `${block.x}%`, top: `${block.y}%`, width: `${block.width}%`, height: `${block.height}%`, overflow: 'hidden' })
    const renderField = (block, value, key) => <div key={key} style={holderStyle(block)}>{block.type === 'image' ? value ? <img src={value} alt="" className="h-full w-full" style={{ objectFit: block.crop || 'cover' }} /> : <div className="grid h-full place-items-center bg-neutral-100/80 text-[10px] text-neutral-500">{block.holder_label}</div> : <div className="h-full whitespace-pre-wrap break-words" style={{ fontSize: `${(Number(block.font_size) || 24) / 10}cqw`, lineHeight: block.line_height ? `${block.line_height}` : '1.2', fontFamily: block.font_family, fontWeight: block.bold ? 700 : 400, fontStyle: block.italic ? 'italic' : 'normal', textAlign: block.text_align || 'left', textDecoration: block.underline ? 'underline' : 'none', textTransform: block.text_transform || 'none', letterSpacing: block.letter_spacing ? `${(Number(block.letter_spacing) || 0) / 10}cqw` : 'normal', color: block.color || '#171717' }}>{value || block.holder_label}</div>}</div>
    return <div className="rounded-xl border bg-neutral-50 p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">Live preview</h3><div className="flex rounded-lg border bg-white p-0.5"><button onClick={() => setMenuPreviewOrientation('portrait')} className={`rounded-md px-2 py-1 text-xs ${menuPreviewOrientation === 'portrait' ? 'bg-violet-100 text-violet-800' : ''}`}>Portrait</button><button onClick={() => setMenuPreviewOrientation('landscape')} className={`rounded-md px-2 py-1 text-xs ${menuPreviewOrientation === 'landscape' ? 'bg-violet-100 text-violet-800' : ''}`}>Landscape</button></div></div><div className="relative mx-auto w-full overflow-hidden border bg-white shadow-sm transition-all" style={{ containerType: 'inline-size', aspectRatio: menuPreviewOrientation === 'portrait' ? '10 / 16' : '16 / 10', maxWidth: menuPreviewOrientation === 'portrait' ? '440px' : '960px', backgroundColor: editor.background, backgroundImage: editor.background_image ? `url(${editor.background_image})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>{editor.blocks.map((block, i) => block.scope === 'item' ? null : renderField(block, block.type === 'text' ? block.text : block.image_url, block.holder_key || i))}{editor.items.flatMap((item, itemIndex) => { const assigned = editor.item_assignments?.[itemIndex] || []; return editor.blocks.map((block, i) => block.scope === 'item' && assigned.includes(block.holder_key) ? renderField(block, item[block.holder_key], `${itemIndex}-${block.holder_key || i}`) : null)})}</div><p className="mt-2 text-center text-xs text-neutral-500">{editor.title || 'Menu title'} · updates as you fill the form</p></div>
  })() : null

  return <div className="space-y-5">
    {!embedded && <div className="bg-white p-5 rounded-2xl border"><h1 className="text-xl font-bold">Menus</h1><p className="text-sm text-neutral-500">Create and manage reusable template based menus.</p></div>}
    {error && <div className="p-3 rounded-xl bg-red-50 text-sm text-red-700">{error}</div>}
    {!editor && <section className="bg-white border rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-bold">Menu QR Code</h2><p className="text-sm text-neutral-500">Each mirror has its own link and shows only its active menus.</p><select value={selectedMirror} onChange={e => setSelectedMirror(e.target.value)} className="mt-3 border rounded-lg px-3 py-2" aria-label="Choose mirror for menu QR">{mirrors.map(mirror => <option key={mirror._id} value={mirror._id}>{mirror.mirror_name}</option>)}</select></div>{selectedMirror && shareUrl ? <div className="flex items-center gap-4"><a href={shareUrl} target="_blank" rel="noreferrer" className="text-sm underline break-all">Open menu page</a><img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&data=${encodeURIComponent(shareUrl)}`} alt="QR code for this mirror's menu page" className="w-32 h-32 border rounded-lg"/><button onClick={() => navigator.clipboard.writeText(shareUrl)} className="border rounded-lg px-3 py-2 text-sm">Copy link</button></div> : <p className="text-sm text-neutral-500">Create a mirror to get its menu QR code.</p>}</section>}
    {editor ? <div className="bg-white border rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-center"><h2 className="text-lg font-bold">{editor._id ? 'Edit Menu' : chosen ? `New ${chosen.name}` : 'Choose a menu template'}</h2><button onClick={() => { setEditor(null); setChosen(null) }} className="text-sm text-neutral-500">Close</button></div>
      {!chosen ? (
        loadingTemplates ? (
          <div className="p-12 text-center text-neutral-400">Loading templates...</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {templates.map(template => template.custom_layout ? (
              <article key={template._id} className="border rounded-xl p-4">
                <button onClick={() => selectTemplate(template)} className="block w-full text-left hover:text-violet-700">
                  <div className="h-28 rounded-lg mb-3" style={{ background: template.background, borderBottom: `8px solid ${template.accent || '#6d28d9'}` }} />
                  <b>{template.name}</b>
                  <p className="text-sm text-neutral-500 mt-1">{template.description}</p>
                  <span className="mt-3 inline-block rounded-lg bg-black px-3 py-2 text-sm text-white">Use template</span>
                </button>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => navigate(`/custom-menu?templateId=${encodeURIComponent(template._id)}&templateMode=1`, { state: { returnToTemplateSelection: true } })} className="rounded-lg border px-3 py-2 text-sm">Edit template</button>
                  <button onClick={() => deleteTemplate(template)} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600">Delete template</button>
                </div>
              </article>
            ) : (
              <button key={template._id} onClick={() => selectTemplate(template)} className="text-left border rounded-xl p-4 hover:border-black">
                <div className="h-28 rounded-lg mb-3" style={{ background: template.background, borderBottom: `8px solid ${template.accent}` }} />
                <b>{template.name}</b>
                <p className="text-sm text-neutral-500 mt-1">{template.description}</p>
              </button>
            ))}
            <button onClick={() => navigate('/custom-menu?templateMode=1', { state: { returnToTemplateSelection: true } })} className="text-left border-2 border-dashed rounded-xl p-4 hover:border-black">
              <div className="h-28 rounded-lg mb-3 bg-neutral-50 flex items-center justify-center text-3xl">＋</div>
              <b>Custom template</b>
              <p className="text-sm text-neutral-500 mt-1">Create a layout with your own text and image holders.</p>
            </button>
            {!templates.length && <p className="text-sm text-neutral-500">No templates are available.</p>}
          </div>
        )
      ) : chosen.custom_layout ? <div className="grid lg:grid-cols-2 gap-6"><div className="space-y-5">
        <label className="block text-sm font-semibold">Menu title<input className="mt-1 w-full rounded-lg border px-3 py-2" value={editor.title || ''} onChange={e => update('title', e.target.value)} placeholder="Enter a menu title" /></label>
        <p className="text-sm text-neutral-500">Fill the fields defined by “{chosen.name}”. The template design is managed separately.</p>
        {editor.blocks.filter(block => block.scope !== 'item').length > 0 && <section className="rounded-xl border p-4"><h3 className="mb-3 font-bold">Menu page</h3><div className="space-y-4">{editor.blocks.map((block, index) => block.scope === 'item' ? null : <div key={block.holder_key || index}><label className="mb-1 block text-sm font-medium">{block.holder_label}</label>{block.type === 'text' ? <textarea className="w-full rounded-lg border p-2" rows="2" value={block.text || ''} onChange={e => update('blocks', editor.blocks.map((current, i) => i === index ? { ...current, text: e.target.value } : current))} /> : <><input className="w-full rounded-lg border p-2 text-sm" value={block.image_url || ''} onChange={e => update('blocks', editor.blocks.map((current, i) => i === index ? { ...current, image_url: e.target.value } : current))} placeholder="Image URL"/><label className="mt-2 inline-flex cursor-pointer rounded-lg border px-3 py-2 text-sm">Upload image<input type="file" accept="image/*" className="sr-only" onChange={e => uploadCustomImage(e.target.files?.[0], { scope: 'page', blockIndex: index })}/></label></>}</div>)}</div></section>}
        <section className="space-y-4"><h3 className="font-bold">Menu items ({editor.item_count})</h3>{editor.items.map((item, itemIndex) => { const assigned = editor.item_assignments?.[itemIndex] || []; const fields = editor.blocks.map((block, blockIndex) => ({ block, blockIndex })).filter(({ block }) => block.scope === 'item' && assigned.includes(block.holder_key)); return <div key={itemIndex} className="rounded-xl border p-4"><h4 className="mb-3 font-semibold">Item {itemIndex + 1}</h4>{fields.length ? <div className="grid gap-4 sm:grid-cols-2">{fields.map(({ block, blockIndex }) => <div key={block.holder_key || blockIndex}><label className="mb-1 block text-sm font-medium">{block.holder_label}</label>{block.type === 'text' ? <textarea className="w-full rounded-lg border p-2" rows="2" value={item[block.holder_key] || ''} onChange={e => update('items', editor.items.map((current, i) => i === itemIndex ? { ...current, [block.holder_key]: e.target.value } : current))} /> : <><input className="w-full rounded-lg border p-2 text-sm" value={item[block.holder_key] || ''} onChange={e => update('items', editor.items.map((current, i) => i === itemIndex ? { ...current, [block.holder_key]: e.target.value } : current))} placeholder="Image URL"/><label className="mt-2 inline-flex cursor-pointer rounded-lg border px-3 py-2 text-sm">Upload image<input type="file" accept="image/*" className="sr-only" onChange={e => uploadCustomImage(e.target.files?.[0], { scope: 'item', itemIndex, holderKey: block.holder_key })}/></label></>}</div>)}</div> : <p className="text-sm text-neutral-500">No holders assigned to this item.</p>}</div>})}</section>
        <button disabled={busy} onClick={save} className="rounded-xl bg-black px-5 py-2.5 text-white">{busy ? 'Saving…' : 'Save Menu'}</button>
      </div>{customPreview}</div> : <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">{chosen.components.map(component => <div key={component.key}>
          <label className="block text-sm font-semibold mb-1">{component.label}</label>
          {component.type === 'items' ? <div className="space-y-3">{(editor.items || []).map((item, index) => <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-xl p-3">
            <input className="border rounded-lg p-2" placeholder="Item name" value={item.name} onChange={e => update('items', editor.items.map((row, i) => i === index ? { ...row, name: e.target.value } : row))} />
            <input className="border rounded-lg p-2" placeholder="Price" value={item.price} onChange={e => update('items', editor.items.map((row, i) => i === index ? { ...row, price: e.target.value } : row))} />
            <input className="border rounded-lg p-2 col-span-2" placeholder="Description" value={item.description} onChange={e => update('items', editor.items.map((row, i) => i === index ? { ...row, description: e.target.value } : row))} />
            <input className="border rounded-lg p-2 col-span-2" placeholder="Image URL (optional)" value={item.image_url?.startsWith('blob:') ? '' : (item.image_url || '')} onChange={e => update('items', editor.items.map((row, i) => i === index ? { ...row, image_url: e.target.value } : row))} />
            <label className="col-span-2 flex flex-wrap items-center gap-2 text-xs text-neutral-600">Upload image asset<input type="file" accept="image/*" onChange={e => uploadItemImage(e.target.files?.[0], index)} className="max-w-full text-xs" />{item.image_url && !item.image_url.startsWith('blob:') && <span className="text-emerald-700">Image linked</span>}</label>
            <button className="text-red-600 text-sm col-span-2 text-left" onClick={() => update('items', editor.items.filter((_, i) => i !== index))}>Remove item</button>
          </div>)}<button className="border rounded-lg px-3 py-2 text-sm" onClick={() => update('items', [...(editor.items || []), { name: '', price: '', description: '', image_url: '' }])}>+ Add item</button></div>
            : component.type === 'color' ? <input type="color" value={editor[component.key] || '#ffffff'} onChange={e => update(component.key, e.target.value)} className="h-10 w-20" />
              : <input value={editor[component.key] || ''} onChange={e => update(component.key, e.target.value)} className="w-full border rounded-lg px-3 py-2" />}
        </div>)}<button disabled={busy} onClick={save} className="bg-black text-white rounded-xl px-5 py-2.5">{busy ? 'Saving…' : 'Save Menu'}</button></div>
        <div className="space-y-3"><div className="flex justify-end"><div className="flex rounded-lg border bg-white p-0.5"><button onClick={() => setMenuPreviewOrientation('portrait')} className={`rounded-md px-2 py-1 text-xs ${menuPreviewOrientation === 'portrait' ? 'bg-violet-100 text-violet-800' : ''}`}>Portrait</button><button onClick={() => setMenuPreviewOrientation('landscape')} className={`rounded-md px-2 py-1 text-xs ${menuPreviewOrientation === 'landscape' ? 'bg-violet-100 text-violet-800' : ''}`}>Landscape</button></div></div><div className="mx-auto w-full min-h-96 overflow-auto rounded-xl p-6" style={{ background: editor.background, color: chosen.layout === 'modern' ? 'white' : '#171717', aspectRatio: menuPreviewOrientation === 'portrait' ? '10 / 16' : '16 / 10', maxWidth: menuPreviewOrientation === 'portrait' ? '440px' : '960px' }}>
          <div className="text-center border-b-2 pb-4 mb-5" style={{ borderColor: editor.accent }}><div className="tracking-[.25em] text-xs sm:text-sm break-words" style={{ color: editor.accent }}>{editor.eyebrow}</div><h2 className="text-2xl sm:text-4xl font-bold mt-2 break-words" style={{ color: editor.accent }}>{editor.title || 'Menu title'}</h2><p className="break-words">{editor.subtitle}</p></div>
          <div className="grid sm:grid-cols-2 gap-4">{(editor.items || []).map((item, index) => <div key={index} className="border-b p-2">{item.image_url && <img src={item.image_url} alt="" className="w-full h-24 object-cover rounded mb-2" />}<b>{item.name || 'Menu item'}</b><strong className="float-right" style={{ color: editor.accent }}>{item.price}</strong><p className="text-sm opacity-70">{item.description}</p></div>)}</div><p className="text-center mt-6" style={{ color: editor.accent }}>{editor.footer}</p>
        </div></div>
      </div>}
    </div> : <>
      <div className="flex flex-wrap justify-between items-center gap-3"><div><h2 className="text-lg font-bold">Saved menus</h2><p className="text-sm text-neutral-500">Edit saved menus or choose one from Import Content on a mirror.</p></div><button onClick={() => start()} className="bg-black text-white rounded-xl px-4 py-2.5">+ Create New Menu</button></div>
      {loadingMenus ? (
        <div className="p-12 text-center text-neutral-400 bg-white rounded-2xl border border-neutral-200">
          Loading menus...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {menus.map(menu => {
            const assigned = (menu.mirror_ids || []).some(id => String(id) === String(selectedMirror));
            const bg = menu.template_background || templates.find(t => t._id === menu.template_id)?.background || '#1e1b4b';
            const tName = menu.template_name || templates.find(t => t._id === menu.template_id)?.name || 'Menu';

            return (
              <div
                key={menu._id}
                onClick={() => start(menu)}
                className="group relative w-full aspect-[3/4] sm:aspect-[4/5] bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-200/80 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer select-none flex items-center justify-center"
              >
                {/* Menu Image / Thumbnail */}
                {menu.image_url ? (
                  <img
                    src={menu.image_url}
                    alt={`${menu.title || 'Menu'} preview`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center p-4 text-center group-hover:scale-105 transition-transform duration-300"
                    style={{ background: bg }}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-2 shadow-xs">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-white font-bold text-sm line-clamp-2 font-['Uber_Move'] drop-shadow-sm">
                      {menu.title || 'Custom Menu'}
                    </h3>
                    <span className="text-[10px] text-white/70 mt-1 uppercase font-mono tracking-wider">
                      {tName}
                    </span>
                  </div>
                )}

                {/* Action Icons Floating Directly on the Image */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
                  {/* Edit Icon Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      start(menu);
                    }}
                    className="w-8 h-8 rounded-full bg-black/65 hover:bg-black text-white backdrop-blur-md border border-white/25 shadow-md flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
                    title="Edit this menu"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>

                  {/* Delete Icon Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMenu(menu._id);
                    }}
                    className="w-8 h-8 rounded-full bg-red-600/80 hover:bg-red-600 text-white backdrop-blur-md border border-white/25 shadow-md flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
                    title="Delete this menu"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Active QR Badge (Top-Left on Image) */}
                <div className="absolute top-2.5 left-2.5 z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActive(menu);
                    }}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md border border-white/20 shadow-xs flex items-center gap-1 cursor-pointer transition-all ${
                      menu.is_active !== false
                        ? 'bg-emerald-500/90 hover:bg-emerald-600 text-white'
                        : 'bg-black/60 hover:bg-black/80 text-neutral-300'
                    }`}
                    title="Click to toggle Active status in Menu QR"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${menu.is_active !== false ? 'bg-white' : 'bg-neutral-400'}`} />
                    <span>{menu.is_active !== false ? 'Active' : 'Inactive'}</span>
                  </button>
                </div>

                {/* Title & Metadata Overlay (Bottom of Image) */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end pointer-events-none z-10">
                  <h4 className="text-white font-bold text-xs sm:text-sm truncate font-['Uber_Move'] drop-shadow-sm">
                    {menu.title || 'Untitled Menu'}
                  </h4>
                  <div className="flex items-center justify-between gap-1.5 mt-0.5 pointer-events-auto">
                    <span className="text-[10px] text-neutral-300 truncate">
                      {tName}
                    </span>
                    {selectedMirror && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMirror(menu, !assigned);
                        }}
                        className={`text-[8px] font-bold font-mono px-1.5 py-0.2 rounded border shrink-0 transition-all cursor-pointer ${
                          assigned
                            ? 'text-emerald-300 bg-emerald-950/80 border-emerald-500/40 hover:bg-emerald-900'
                            : 'text-neutral-400 bg-black/60 border-neutral-700 hover:text-white'
                        }`}
                        title={`Click to ${assigned ? 'remove from' : 'assign to'} ${mirrors.find(m => String(m._id) === String(selectedMirror))?.mirror_name || 'selected mirror'}`}
                      >
                        {assigned ? '✓ On Mirror' : '+ Mirror'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!loadingMenus && !menus.length && <div className="bg-white border border-dashed rounded-2xl p-10 text-center text-neutral-500">No menus yet. Create one from a template.</div>}
    </>}
  </div>
}
