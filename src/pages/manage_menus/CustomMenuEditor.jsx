import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { CookieContext } from '../../Contexts/CookieContext'
import { CREATE_CONTENT, GET_MENU_TEMPLATES, GET_MENUS, SAVE_MENU, SAVE_MENU_TEMPLATE } from '../../serverRequests/ServerRequests'

const freshBlock = (type, scope = 'page') => type === 'text'
  ? { type, scope, text: '', holder_key: `text-${Math.random().toString(36).slice(2, 9)}`, holder_label: scope === 'item' ? 'Item text' : 'Text holder', x: 5, y: 5, width: 90, height: 22, font_size: 24, font_family: 'Arial', bold: false, color: '#171717' }
  : { type, scope, image_url: '', holder_key: `image-${Math.random().toString(36).slice(2, 9)}`, holder_label: scope === 'item' ? 'Item image' : 'Image holder', x: 5, y: 5, width: 90, height: 35, crop: 'cover' }
const defaultItemArea = { x: 5, y: 34, width: 90, height: 60, columns: 2 }
const itemColor = index => `hsl(${(index * 137.508) % 360} 72% 42%)`

export default function CustomMenuEditor() {
  const { getCookie } = useContext(CookieContext)
  const loginKey = getCookie('login_key')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const [templateId, setTemplateId] = useState('')
  const [menuId, setMenuId] = useState('')
  const [name, setName] = useState('My custom menu')
  const [data, setData] = useState({ title: 'My menu', background: '#ffffff', background_image: '', blocks: [], item_count: 1, item_area: defaultItemArea, item_assignments: [[]], items: [{}] })
  const [selected, setSelected] = useState(-1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [responsivePreview, setResponsivePreview] = useState(false)
  const [previewSize, setPreviewSize] = useState({ width: 960, height: 600 })
  const [zoom, setZoom] = useState(100)
  const [activeItem, setActiveItem] = useState(0)
  const [assigningHolders, setAssigningHolders] = useState(false)
  const templateMode = params.get('templateMode') === '1'

  useEffect(() => {
    Promise.all([GET_MENU_TEMPLATES(loginKey), GET_MENUS(loginKey)]).then(([t, m]) => {
      const templates = t.data || []
      const menus = m.data || []
      const requestedMenu = menus.find(x => x._id === params.get('menuId'))
      if (requestedMenu) {
        const template = templates.find(x => x._id === requestedMenu.template_id)
        setTemplateId(template?._id || '')
        setMenuId(requestedMenu._id)
        setName(template?.name || 'My custom menu')
        const savedBlocks = requestedMenu.data?.blocks || template?.blocks || []
        const configuredBlocks = savedBlocks.map((block, i) => ({ ...block, scope: block.scope || 'page', holder_key: block.holder_key || `${block.type}-${i + 1}`, holder_label: block.holder_label || `${block.type === 'text' ? 'Text' : 'Image'} ${i + 1}` }))
        const count = Math.max(1, Number(template?.item_count || requestedMenu.data?.item_count || 1))
        const savedItems = requestedMenu.data?.items || []
        const fallbackAssignments = Array.from({ length: count }, () => configuredBlocks.filter(b => b.scope === 'item').map(b => b.holder_key))
        setData({ ...requestedMenu.data, blocks: configuredBlocks, item_count: count, item_area: template?.item_area || defaultItemArea, item_assignments: requestedMenu.data?.item_assignments || template?.item_assignments || fallbackAssignments, items: Array.from({ length: count }, (_, i) => savedItems[i] || {}) })
      } else {
        const template = templates.find(x => x._id === params.get('templateId') && x.custom_layout)
        if (template) {
          setTemplateId(template._id); setName(template.name)
          setPreviewSize((template.canvas_orientation || 'portrait') === 'portrait' ? { width: 600, height: 960 } : { width: 960, height: 600 })
          const blocks = (template.blocks || []).map((block, i) => ({ ...block, scope: block.scope || 'page', holder_key: block.holder_key || `${block.type}-${i + 1}`, holder_label: block.holder_label || `${block.type === 'text' ? 'Text' : 'Image'} ${i + 1}`, text: '', image_url: '' }))
          const itemCount = Math.max(1, Number(template.item_count || 1))
          const assignments = template.item_assignments || Array.from({ length: itemCount }, () => blocks.filter(b => b.scope === 'item').map(b => b.holder_key))
          setData({ title: 'My menu', background: template.background || '#ffffff', background_image: template.background_image || '', blocks, item_count: itemCount, item_area: template.item_area || defaultItemArea, item_assignments: assignments, items: Array.from({ length: itemCount }, () => ({})) })
        } else {
          setData({ title: 'My menu', background: '#ffffff', background_image: '', blocks: [], item_count: 1, item_area: defaultItemArea, item_assignments: [[]], items: [{}] })
        }
      }
      setLoaded(true)
    }).catch(e => { setError(e.message || 'Could not load menu templates'); setLoaded(true) })
  }, [loginKey, params])

  const changeData = (key, value) => setData(current => ({ ...current, [key]: value }))
  const changeBlock = (index, changes) => changeData('blocks', data.blocks.map((b, i) => i === index ? { ...b, ...changes } : b))
  const changeItemField = (itemIndex, key, value) => setData(current => ({ ...current, items: current.items.map((item, i) => i === itemIndex ? { ...item, [key]: value } : item) }))
  const setItemCount = count => setData(current => ({ ...current, item_count: count, item_assignments: Array.from({ length: count }, (_, i) => current.item_assignments?.[i] || []), items: Array.from({ length: count }, (_, i) => current.items?.[i] || {}) }))
  const toggleItemHolder = blockIndex => {
    const key = data.blocks[blockIndex]?.holder_key
    if (!key) return
    setData(current => {
      const assignments = Array.from({ length: current.item_count }, (_, i) => current.item_assignments?.[i] || [])
      const currentKeys = assignments[activeItem] || []
      assignments[activeItem] = currentKeys.includes(key) ? currentKeys.filter(value => value !== key) : [...currentKeys, key]
      return { ...current, item_assignments: assignments }
    })
  }
  const holdersForItem = itemIndex => {
    const assigned = data.item_assignments?.[itemIndex] || []
    return data.blocks.map((block, index) => ({ block, index })).filter(({ block }) => block.scope === 'item' && assigned.includes(block.holder_key))
  }
  const upload = async (file, target) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Choose an image file.'); return }
    setBusy(true); setError('')
    try {
      const result = await CREATE_CONTENT(loginKey, `${data.title || 'Menu'} ${target === 'background' ? 'background' : 'image'}`, 'Custom menu image asset', file)
      if (!result.content_url) throw new Error('The upload completed without an image URL.')
      if (target === 'background') changeData('background_image', result.content_url)
      else changeBlock(Number(target), { image_url: result.content_url })
    } catch (e) { setError(e.message || 'Could not upload image') }
    finally { setBusy(false) }
  }
  const uploadItemImage = async (file, itemIndex, holderKey) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Choose an image file.'); return }
    setBusy(true); setError('')
    try {
      const result = await CREATE_CONTENT(loginKey, `${data.title || 'Menu'} item ${itemIndex + 1} image`, 'Custom menu item image', file)
      if (!result.content_url) throw new Error('The upload completed without an image URL.')
      changeItemField(itemIndex, holderKey, result.content_url)
    } catch (e) { setError(e.message || 'Could not upload image') }
    finally { setBusy(false) }
  }
  const save = async () => {
    if (templateMode && !name.trim()) { setError('Enter a template name.'); return }
    if (!templateMode && !data.title?.trim()) { setError('Enter a menu title.'); return }
    setBusy(true); setError('')
    try {
      if (templateMode) {
        const result = await SAVE_MENU_TEMPLATE(loginKey, { _id: templateId || undefined, name, background: data.background, background_image: data.background_image, canvas_orientation: previewSize.height > previewSize.width ? 'portrait' : 'landscape', item_count: data.item_count, item_area: data.item_area, item_assignments: data.item_assignments, blocks: data.blocks.map((block, i) => ({ ...block, text: '', image_url: '', holder_key: block.holder_key || `${block.type}-${i + 1}` })) })
        navigate('/manage_menus')
        return
      }
      await SAVE_MENU(loginKey, menuId || undefined, templateId, data)
      navigate('/manage_menus')
    } catch (e) { setError(e.message || 'Could not save menu') }
    finally { setBusy(false) }
  }
  const dragStart = (event, index, resize = false) => {
    event.preventDefault(); event.stopPropagation(); setSelected(index)
    const rect = canvasRef.current.getBoundingClientRect()
    const startX = event.clientX, startY = event.clientY
    const initial = data.blocks[index]
    event.currentTarget.setPointerCapture(event.pointerId)
    const move = ev => {
      const dx = (ev.clientX - startX) / rect.width * 100
      const dy = (ev.clientY - startY) / rect.height * 100
      changeBlock(index, resize
        ? { width: Math.max(5, Math.min(100 - initial.x, initial.width + dx)), height: Math.max(5, Math.min(100 - initial.y, initial.height + dy)) }
        : { x: Math.max(0, Math.min(100 - initial.width, initial.x + dx)), y: Math.max(0, Math.min(100 - initial.height, initial.y + dy)) })
    }
    const done = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', done) }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', done)
  }
  const resizePreview = (event, dimension) => {
    event.preventDefault(); event.stopPropagation()
    const start = dimension === 'width' ? event.clientX : event.clientY
    const initial = previewSize[dimension]
    const move = ev => {
      const delta = dimension === 'width' ? ev.clientX - start : start - ev.clientY
      setPreviewSize(size => ({ ...size, [dimension]: Math.max(300, Math.min(dimension === 'width' ? 1600 : 1200, initial + delta)) }))
    }
    const done = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', done) }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', done)
  }
  const activeBlock = data.blocks[selected]
  const canvasStyle = useMemo(() => ({ backgroundColor: data.background, backgroundImage: data.background_image ? `url("${data.background_image}")` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }), [data.background, data.background_image])
  const itemArea = data.item_area || defaultItemArea
  const renderHolder = (block, index) => {
    const assignedToActive = assigningHolders && block.scope === 'item' && (data.item_assignments?.[activeItem] || []).includes(block.holder_key)
    return <div key={block.holder_key || index} onPointerDown={e => templateMode ? (assigningHolders ? (e.stopPropagation(), block.scope !== 'item' && changeBlock(index, { scope: 'item' }), toggleItemHolder(index)) : dragStart(e, index)) : (e.stopPropagation(), setSelected(index))} className={`absolute touch-none overflow-hidden ${selected === index ? 'outline outline-2 outline-violet-600' : 'hover:outline hover:outline-1 hover:outline-violet-400'}`} style={{ left: `${block.x}%`, top: `${block.y}%`, width: `${block.width}%`, height: `${block.height}%`, cursor: templateMode ? (assigningHolders ? 'pointer' : 'move') : 'default', outline: assignedToActive ? `3px solid ${itemColor(activeItem)}` : undefined, outlineOffset: assignedToActive ? '2px' : undefined }}>{block.type === 'image' ? block.image_url ? <img src={block.image_url} alt="" className="h-full w-full" style={{ objectFit: block.crop || 'cover' }} /> : <div className="grid h-full place-items-center bg-neutral-100 text-sm text-neutral-500">{templateMode ? (block.holder_label || 'Image holder') : block.holder_label}</div> : <div className="h-full w-full whitespace-pre-wrap break-words" style={{ fontSize: `${block.font_size}px`, fontFamily: block.font_family, fontWeight: block.bold ? 700 : 400, color: block.color || '#171717' }}>{templateMode ? (block.holder_label || 'Text holder') : (block.text || block.holder_label)}</div>}{templateMode && !assigningHolders && selected === index && <button aria-label="Resize holder" onPointerDown={e => dragStart(e, index, true)} className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize border-2 border-white bg-violet-600" />}</div>
  }
  const renderMenuItems = () => {
    const columns = Math.max(1, Number(itemArea.columns || 2))
    const rows = Math.ceil(data.item_count / columns)
    const cellWidth = itemArea.width / columns
    const cellHeight = itemArea.height / rows
    return data.items.map((item, itemIndex) => <div key={itemIndex} className="absolute border border-neutral-400/60" style={{ left: `${itemArea.x + (itemIndex % columns) * cellWidth}%`, top: `${itemArea.y + Math.floor(itemIndex / columns) * cellHeight}%`, width: `${cellWidth}%`, height: `${cellHeight}%` }}>{holdersForItem(itemIndex).map(({ block, index }) => <div key={block.holder_key || index} className="absolute overflow-hidden" style={{ left: `${block.x}%`, top: `${block.y}%`, width: `${block.width}%`, height: `${block.height}%` }}>{block.type === 'image' ? item[block.holder_key] ? <img src={item[block.holder_key]} alt="" className="h-full w-full" style={{ objectFit: block.crop || 'cover' }} /> : <div className="grid h-full place-items-center bg-neutral-100 text-[10px] text-neutral-500">{block.holder_label}</div> : <div className="h-full whitespace-pre-wrap break-words" style={{ fontSize: `${block.font_size}px`, fontFamily: block.font_family, fontWeight: block.bold ? 700 : 400, color: block.color || '#171717' }}>{item[block.holder_key] || block.holder_label}</div>}</div>)}</div>)
  }

  if (!templateMode) return <Navigate to="/manage_menus" replace />

  return <div className="fixed inset-0 z-50 flex flex-col bg-[#f4f4f2] text-neutral-900">
    <header className="min-h-14 shrink-0 flex flex-wrap items-center justify-between gap-2 border-b bg-white px-4 py-2"><div className="flex items-center gap-4"><Link to="/manage_menus" className="text-sm text-neutral-600">← Menus</Link><span className="font-bold">{templateMode ? 'Custom template editor' : 'Custom menu editor'}</span><span className="hidden sm:inline text-xs text-neutral-400">{templateMode ? 'Build a reusable layout from holders' : 'Fill in the holders for this menu'}</span></div><div className="flex flex-wrap items-center justify-end gap-2"><div className="flex items-center gap-1 rounded-lg border px-2 py-1" aria-label="Canvas zoom"><button aria-label="Zoom out" onClick={() => setZoom(value => Math.max(40, value - 10))} className="px-1 text-lg leading-none">−</button><input aria-label="Zoom level" type="range" min="40" max="150" step="5" value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-20"/><button aria-label="Zoom in" onClick={() => setZoom(value => Math.min(150, value + 10))} className="px-1 text-lg leading-none">+</button><button onClick={() => setZoom(100)} className="min-w-10 text-xs text-neutral-600">{zoom}%</button></div><div className="flex rounded-lg border p-0.5" aria-label="Canvas orientation"><button onClick={() => setPreviewSize(size => ({ width: Math.min(size.width, size.height), height: Math.max(size.width, size.height) }))} className={`rounded-md px-2 py-1.5 text-xs ${previewSize.height > previewSize.width ? 'bg-violet-100 text-violet-800' : ''}`}>Portrait</button><button onClick={() => setPreviewSize(size => ({ width: Math.max(size.width, size.height), height: Math.min(size.width, size.height) }))} className={`rounded-md px-2 py-1.5 text-xs ${previewSize.width >= previewSize.height ? 'bg-violet-100 text-violet-800' : ''}`}>Landscape</button></div><button onClick={() => setResponsivePreview(value => !value)} className={`rounded-lg border px-3 py-2 text-sm ${responsivePreview ? 'border-violet-700 bg-violet-50 text-violet-800' : ''}`}>{responsivePreview ? 'Exit responsive preview' : 'Check responsiveness'}</button><button onClick={() => navigate('/manage_menus')} className="px-3 py-2 text-sm">Cancel</button><button disabled={busy || !loaded} onClick={save} className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : templateMode ? 'Save template' : 'Save menu'}</button></div></header>
    {error && <div className="mx-4 mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
    <div className="min-h-0 flex-1 grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)_270px]">
      <aside className="order-2 lg:order-1 overflow-auto border-r bg-white p-4 space-y-5"><section><h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">{templateMode ? 'Template design' : 'Menu details'}</h2>{templateMode ? <label className="mt-3 block text-sm">Template name<input className="mt-1 w-full rounded-lg border p-2" value={name} onChange={e => setName(e.target.value)} /></label> : <label className="mt-3 block text-sm">Menu title<input className="mt-1 w-full rounded-lg border p-2" value={data.title || ''} onChange={e => changeData('title', e.target.value)} /></label>}{templateMode && <><label className="mt-3 block text-sm">Background color<input className="mt-1 h-10 w-full rounded border p-1" type="color" value={data.background || '#ffffff'} onChange={e => changeData('background', e.target.value)} /></label><label className="mt-3 block text-sm">Background image URL<input className="mt-1 w-full rounded-lg border p-2 text-xs" value={data.background_image || ''} onChange={e => changeData('background_image', e.target.value)} placeholder="https://…" /></label><label className="mt-2 block cursor-pointer rounded-lg border border-dashed p-3 text-center text-sm hover:bg-neutral-50">Upload background image<input type="file" accept="image/*" className="sr-only" onChange={e => upload(e.target.files?.[0], 'background')} /></label><p className="text-xs text-neutral-500">Background fills the page with a centered cover crop.</p></>}</section>
        {templateMode && <section><h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Menu items</h2><label className="mt-3 block text-sm">Number of items<input type="number" min="1" max="30" className="mt-1 w-full rounded-lg border p-2" value={data.item_count} onChange={e => { const count = Math.max(1, Math.min(30, Number(e.target.value) || 1)); setItemCount(count); setActiveItem(Math.min(activeItem, count - 1)); setAssigningHolders(false) }} /></label><div className="mt-3 grid grid-cols-4 gap-2">{Array.from({ length: data.item_count }, (_, i) => <button key={i} onClick={() => { setActiveItem(i); setAssigningHolders(true); setSelected(-1) }} className={`aspect-square rounded-md border text-xs font-semibold ${activeItem === i ? 'border-[3px]' : 'border'}`} style={{ borderColor: itemColor(i), color: itemColor(i), backgroundColor: activeItem === i ? `hsl(${(i * 137.508) % 360} 72% 42% / 10%)` : '#ffffff' }} title={`Select holders for Item ${i + 1}`}><span className="block">Item</span>{i + 1}<span className="block text-[10px] font-normal">{data.item_assignments?.[i]?.length || 0} fields</span></button>)}</div>{assigningHolders && <div className="mt-3 rounded-lg p-3 text-xs" style={{ backgroundColor: `hsl(${(activeItem * 137.508) % 360} 72% 42% / 10%)`, color: itemColor(activeItem) }}><b>Assign holders to Item {activeItem + 1}</b><p className="mt-1">Click multiple item holders on the canvas. Click a selected holder again to remove it.</p><button className="mt-2 rounded border px-2 py-1" style={{ borderColor: itemColor(activeItem) }} onClick={() => setAssigningHolders(false)}>Done assigning</button></div>}</section>}
        {templateMode && <section><h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Add holders</h2><div className="mt-3 grid grid-cols-2 gap-2"><button className="rounded-lg border p-3 text-sm hover:bg-neutral-50" onClick={() => { changeData('blocks', [...data.blocks, freshBlock('text')]); setSelected(data.blocks.length) }}>＋ Page text</button><button className="rounded-lg border p-3 text-sm hover:bg-neutral-50" onClick={() => { changeData('blocks', [...data.blocks, freshBlock('image')]); setSelected(data.blocks.length) }}>▧ Page image</button><button className="rounded-lg border p-3 text-sm hover:bg-neutral-50" onClick={() => { changeData('blocks', [...data.blocks, freshBlock('text', 'item')]); setSelected(data.blocks.length) }}>＋ Item text</button><button className="rounded-lg border p-3 text-sm hover:bg-neutral-50" onClick={() => { changeData('blocks', [...data.blocks, freshBlock('image', 'item')]); setSelected(data.blocks.length) }}>▧ Item image</button></div><p className="mt-2 text-xs text-neutral-500">Page holders appear once. Item holders repeat for every item. Drag holders to position them and resize from the corner.</p></section>}</aside>
      <main className="order-1 lg:order-2 flex min-h-[50vh] min-w-0 items-center justify-center overflow-auto p-4 sm:p-8">
        <div className="relative shrink-0" style={responsivePreview ? { width: `min(${previewSize.width}px, calc(100vw - 32px))`, height: `${previewSize.height}px`, maxHeight: '78vh' } : { width: '100%', maxWidth: previewSize.width > previewSize.height ? '960px' : '620px', aspectRatio: `${previewSize.width} / ${previewSize.height}` }}>
          <div ref={canvasRef} className="relative h-full w-full overflow-hidden border bg-white shadow-xl" style={{ ...canvasStyle, transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }} onPointerDown={() => setSelected(-1)}>
            {templateMode ? data.blocks.map((block, i) => renderHolder(block, i)) : <>{data.blocks.map((block, i) => block.scope === 'item' ? null : renderHolder(block, i))}{renderMenuItems()}</>}
          </div>
          {responsivePreview && <><button aria-label="Adjust preview height" title={`Preview height: ${previewSize.height}px; drag to resize`} onPointerDown={e => resizePreview(e, 'height')} className="absolute -top-3 left-1/2 z-10 h-2 w-16 -translate-x-1/2 cursor-ns-resize rounded-full bg-violet-600 shadow ring-4 ring-white"/><button aria-label="Adjust preview width" title={`Preview width: ${previewSize.width}px; drag to resize`} onPointerDown={e => resizePreview(e, 'width')} className="absolute -right-3 top-1/2 z-10 h-16 w-2 -translate-y-1/2 cursor-ew-resize rounded-full bg-violet-600 shadow ring-4 ring-white"/><span className="absolute -bottom-6 right-0 text-xs text-neutral-500">{previewSize.width} × {previewSize.height}px</span></>}
        </div>
      </main>
      <aside className="order-3 overflow-auto border-l bg-white p-4">{templateMode ? <>{activeBlock ? <><div className="mb-4 flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">{activeBlock.scope === 'item' ? 'Item ' : 'Page '}{activeBlock.type} holder</h2><button className="text-xs text-red-600" onClick={() => { changeData('blocks', data.blocks.filter((_, i) => i !== selected)); setSelected(-1) }}>Delete</button></div><label className="block text-sm">Assign holder to<select className="mt-1 w-full rounded-lg border p-2" value={activeBlock.scope || 'page'} onChange={e => changeBlock(selected, { scope: e.target.value })}><option value="page">Menu page</option><option value="item">Each item</option></select></label><label className="mt-3 block text-sm">Field label<input className="mt-1 w-full rounded-lg border p-2" value={activeBlock.holder_label || ''} onChange={e => changeBlock(selected, { holder_label: e.target.value })} placeholder={activeBlock.type === 'text' ? 'Text field label' : 'Image field label'} /></label>{activeBlock.type === 'text' ? <><label className="mt-3 block text-sm">Font<select className="mt-1 w-full rounded-lg border p-2" value={activeBlock.font_family} onChange={e => changeBlock(selected, { font_family: e.target.value })}><option>Arial</option><option>Georgia</option><option>Verdana</option><option>Tahoma</option></select></label><label className="mt-3 block text-sm">Font size<input className="mt-1 w-full" type="range" min="12" max="80" value={activeBlock.font_size} onChange={e => changeBlock(selected, { font_size: Number(e.target.value) })}/><span className="text-xs">{activeBlock.font_size}px</span></label><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(activeBlock.bold)} onChange={e => changeBlock(selected, { bold: e.target.checked })}/>Bold</label><label className="mt-3 block text-sm">Text color<input type="color" className="ml-2 h-8 w-10 align-middle" value={activeBlock.color || '#171717'} onChange={e => changeBlock(selected, { color: e.target.value })}/></label></> : <label className="mt-3 block text-sm">Image fit<select className="mt-1 w-full rounded-lg border p-2" value={activeBlock.crop || 'cover'} onChange={e => changeBlock(selected, { crop: e.target.value })}><option value="cover">Cover (crop to fill)</option><option value="contain">Contain (show full image)</option></select></label>}<div className="mt-5 grid grid-cols-2 gap-2">{['x','y','width','height'].map(key => <label key={key} className="text-xs text-neutral-500">{key === 'x' ? 'Left' : key === 'y' ? 'Top' : key === 'width' ? 'Width' : 'Height'} (%)<input className="mt-1 w-full rounded border p-2 text-sm text-neutral-900" type="number" min="0" max="100" value={Math.round(activeBlock[key])} onChange={e => changeBlock(selected, { [key]: Math.max(0, Math.min(100, Number(e.target.value))) })}/></label>)}</div></> : <div className="py-10 text-center text-sm text-neutral-400">Select a holder to edit its label and style.</div>}</> : <><h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Page holders</h2>{data.blocks.map((block, i) => block.scope === 'item' ? null : <div key={block.holder_key || i} className="mb-4 border-b pb-4"><label className="mb-2 block text-sm font-semibold">{block.holder_label || `${block.type} ${i + 1}`}</label>{block.type === 'text' ? <textarea className="w-full rounded-lg border p-2" rows="2" value={block.text || ''} onChange={e => changeBlock(i, { text: e.target.value })} /> : <><input className="w-full rounded-lg border p-2 text-xs" value={block.image_url || ''} onChange={e => changeBlock(i, { image_url: e.target.value })} placeholder="Image URL"/><label className="mt-2 block cursor-pointer rounded-lg border border-dashed p-3 text-center text-sm">Upload image<input type="file" accept="image/*" className="sr-only" onChange={e => upload(e.target.files?.[0], i)} /></label></>}</div>)}<h2 className="mb-3 mt-5 text-xs font-bold uppercase tracking-wider text-neutral-500">Items ({data.item_count} fixed slots)</h2>{data.items.map((item, itemIndex) => <section key={itemIndex} className="mb-4 rounded-xl border p-3"><h3 className="mb-3 text-sm font-bold">Item {itemIndex + 1}</h3>{holdersForItem(itemIndex).map(({ block, index: blockIndex }) => <div key={block.holder_key || blockIndex} className="mb-3"><label className="mb-1 block text-xs font-semibold">{block.holder_label || `${block.type} ${blockIndex + 1}`}</label>{block.type === 'text' ? <textarea className="w-full rounded-lg border p-2 text-sm" rows="2" value={item[block.holder_key] || ''} onChange={e => changeItemField(itemIndex, block.holder_key, e.target.value)} /> : <><input className="w-full rounded-lg border p-2 text-xs" value={item[block.holder_key] || ''} onChange={e => changeItemField(itemIndex, block.holder_key, e.target.value)} placeholder="Image URL"/><label className="mt-2 block cursor-pointer rounded-lg border border-dashed p-2 text-center text-xs">Upload image<input type="file" accept="image/*" className="sr-only" onChange={e => uploadItemImage(e.target.files?.[0], itemIndex, block.holder_key)} /></label></>}</div>)}</section>)}</>}</aside>
    </div>
  </div>
}
