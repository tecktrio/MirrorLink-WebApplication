import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CookieContext } from '../../Contexts/CookieContext'
import { ASSIGN_CONTENT_TO_MIRROR, CREATE_CONTENT, GET_ALL_CONTENTS, GET_MENUS, RENDER_MENU_PREVIEW, SAVE_TIMESLOT } from '../../serverRequests/ServerRequests'
import ImageCropperModal from '../ImageCropperModal/ImageCropperModal'
import Time24Input from '../Time24Input/Time24Input'

export default function AddContentModal({
  isOpen,
  onClose,
  mirrorId,
  mirrorName = 'Mirror',
  mirrorWidth = 1920,
  mirrorHeight = 1080,
  timeslots = [],
  activeTimeslotId = 'default',
  insertIndex = null,
  onContentAdded,
  onTimeslotsUpdated
}) {
  const { getCookie } = useContext(CookieContext)
  const navigate = useNavigate()
  const [items, setItems] = useState([]), [menus, setMenus] = useState([]), [query, setQuery] = useState('')
  const [selected, setSelected] = useState([]), [selectedMenu, setSelectedMenu] = useState(null)
  const [loading, setLoading] = useState(false), [saving, setSaving] = useState(false), [error, setError] = useState(''), [crop, setCrop] = useState(null)
  
  // Multi-step modal: 1 = select contents, 2 = select timeslot
  const [step, setStep] = useState(1)
  const [targetTimeslotIds, setTargetTimeslotIds] = useState([activeTimeslotId || 'default'])
  
  // Creating a new timeslot inside the modal
  const [showCreateSlot, setShowCreateSlot] = useState(false)
  const [newSlotName, setNewSlotName] = useState('')
  const [newSlotStart, setNewSlotStart] = useState('09:00')
  const [newSlotEnd, setNewSlotEnd] = useState('17:00')
  const [newSlotDays, setNewSlotDays] = useState(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
  const [creatingSlot, setCreatingSlot] = useState(false)

  const dayOptions = [
    { key: 'sun', label: 'Sun' },
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
  ]

  const loginKey = getCookie('login_key')

  useEffect(() => {
    if (!isOpen) return
    setLoading(true); setError(''); setSelected([]); setSelectedMenu(null); setCrop(null); setStep(1); setShowCreateSlot(false)
    setTargetTimeslotIds([activeTimeslotId || 'default'])
    Promise.all([GET_ALL_CONTENTS(loginKey), GET_MENUS(loginKey)]).then(([contentResult, menuResult]) => {
      setItems(contentResult.data || []); setMenus(menuResult.data || [])
    }).catch(e => setError(e.message || 'Could not load content library')).finally(() => setLoading(false))
  }, [isOpen, loginKey, activeTimeslotId])

  const filtered = useMemo(() => items.filter(x => (x.content_title || '').toLowerCase().includes(query.toLowerCase())), [items, query])

  const handleNextStep = () => {
    if (!selected.length && !selectedMenu) return
    if (selectedMenu) {
      // Menu needs crop first
      importSelected()
      return
    }
    setStep(2)
  }

  const handleCreateSlotInline = async () => {
    if (!newSlotName.trim()) {
      setError('Please provide a name for the timeslot')
      return
    }
    if (!newSlotStart || !newSlotEnd) {
      setError('Please provide start and end times')
      return
    }
    setCreatingSlot(true)
    setError('')
    try {
      const res = await SAVE_TIMESLOT(loginKey, mirrorId, {
        id: 'new',
        name: newSlotName.trim(),
        start_time: newSlotStart,
        end_time: newSlotEnd,
        days: newSlotDays,
        contents: []
      })
      if (res?.timeslots) {
        onTimeslotsUpdated?.(res.timeslots)
        if (res.timeslot?.id) {
          setTargetTimeslotIds(prev => [...prev, res.timeslot.id])
        }
      }
      setShowCreateSlot(false)
      setNewSlotName('')
    } catch (err) {
      setError(err.message || 'Failed to create timeslot')
    } finally {
      setCreatingSlot(false)
    }
  }

  const importSelected = async () => {
    if ((!selected.length && !selectedMenu) || !mirrorId) return
    if (!targetTimeslotIds.length) {
      setError('Please select at least one timeslot')
      return
    }
    setSaving(true); setError('')
    try {
      if (selectedMenu) {
        const preview = await RENDER_MENU_PREVIEW(loginKey, selectedMenu._id, mirrorWidth, mirrorHeight)
        setCrop({ menu: selectedMenu, preview: preview.preview_url, width: preview.width, height: preview.height })
        return
      }
      await ASSIGN_CONTENT_TO_MIRROR(loginKey, selected, mirrorId, targetTimeslotIds, insertIndex)
      onContentAdded?.(selected.length === 1 ? items.find(x => x._id === selected[0])?.content_title : `${selected.length} items`, selected, insertIndex)
      onClose()
    } catch (e) { setError(e.message || 'Could not import selected content') } finally { setSaving(false) }
  }

  const completeCrop = async file => {
    if (!crop) return
    setSaving(true); setError('')
    try {
      await CREATE_CONTENT(loginKey, crop.menu.title, 'Menu template image', file, mirrorId, null, crop.width, crop.height)
      onContentAdded?.(crop.menu.title, null, insertIndex); setCrop(null); onClose()
    } catch (e) { setError(e.message || 'Could not import menu image') } finally { setSaving(false) }
  }

  if (!isOpen) return null

  // Ensure default timeslot exists in list
  const displaySlots = timeslots && timeslots.length > 0 ? timeslots : [
    { id: 'default', name: 'Default Timeslot', is_default: true, days: ['mon','tue','wed','thu','fri','sat','sun'] }
  ]

  return <>
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <section className="bg-white rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col border border-neutral-200" onClick={e => e.stopPropagation()}>
        <header className="p-5 border-b border-neutral-200 flex justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-black font-['Uber_Move']">
                {step === 1 ? (insertIndex !== null ? `Insert Content (Position #${insertIndex + 1})` : 'Import Content') : 'Select Target Timeslot'}
              </h2>
              {insertIndex !== null && step === 1 && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black text-white">
                  Timeline Slot #{insertIndex + 1}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 font-['Uber_Move_Text']">
              {step === 1 
                ? (insertIndex !== null 
                    ? `Choose library media or a menu template to insert directly at position #${insertIndex + 1} in the timeline.`
                    : `Choose library content or a saved menu to add to ${mirrorName}.`)
                : `Choose the timeslot schedule to import ${selected.length} selected item${selected.length > 1 ? 's' : ''} into.`
              }
            </p>
          </div>
          <button className="text-neutral-500 hover:text-black font-bold p-1 cursor-pointer" onClick={onClose} aria-label="Close">✕</button>
        </header>

        {error && <p className="mx-5 mt-3 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</p>}

        {step === 1 ? (
          <>
            <div className="p-4 border-b border-neutral-200 flex gap-3">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search videos, images, and menus..."
                className="flex-1 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-black font-['Uber_Move_Text']"
              />
              <button
                onClick={() => { onClose(); navigate('/manage_contents') }}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-semibold text-xs transition-colors font-['Uber_Move_Text'] cursor-pointer"
              >
                Create New Content
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 space-y-6">
              {loading ? (
                <p className="p-10 text-center text-xs text-neutral-500">Loading content library…</p>
              ) : (
                <>
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 font-['Uber_Move']">Videos and images</h3>
                    {filtered.length ? (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {filtered.map(item => (
                          <label
                            key={item._id}
                            className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${selected.includes(item._id) ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'}`}
                          >
                            <input
                              type="checkbox"
                              checked={selected.includes(item._id)}
                              onChange={e => {
                                setSelectedMenu(null)
                                setSelected(s => e.target.checked ? [...s, item._id] : s.filter(id => id !== item._id))
                              }}
                            />
                            {item.content_format === 'mp4' ? (
                              <div className="w-14 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-xs shrink-0">▶</div>
                            ) : (
                              <img src={item.content_url} alt="" className="w-14 h-10 rounded-lg object-cover bg-neutral-100 shrink-0"/>
                            )}
                            <span className="min-w-0">
                              <b className="block text-xs font-bold text-neutral-900 truncate font-['Uber_Move']">{item.content_title}</b>
                              <small className="text-[11px] text-neutral-500 font-['Uber_Move_Text']">{(item.content_format || 'image').toUpperCase()}</small>
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500">No library content matches your search.</p>
                    )}
                  </section>

                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 font-['Uber_Move']">
                      Saved menus <span className="font-normal text-neutral-400 lowercase">(opens crop preview)</span>
                    </h3>
                    {menus.length ? (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {menus.filter(menu => menu.title.toLowerCase().includes(query.toLowerCase())).map(menu => (
                          <label
                            key={menu._id}
                            className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${selectedMenu?._id === menu._id ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'}`}
                          >
                            <input
                              type="radio"
                              name="saved-menu"
                              checked={selectedMenu?._id === menu._id}
                              onChange={() => { setSelected([]); setSelectedMenu(menu) }}
                            />
                            <div className="w-14 h-10 rounded-lg flex items-center justify-center bg-neutral-100 text-[11px] font-bold truncate px-1 shrink-0">
                              {menu.title}
                            </div>
                            <span className="min-w-0">
                              <b className="block text-xs font-bold truncate font-['Uber_Move']">{menu.title}</b>
                              <small className="text-[11px] text-neutral-500 font-['Uber_Move_Text']">Menu template</small>
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500">No saved menus yet. Create one from Content → Menus.</p>
                    )}
                  </section>
                </>
              )}
            </div>

            <footer className="p-4 border-t border-neutral-200 flex justify-between items-center">
              <span className="text-xs font-medium text-neutral-500 font-['Uber_Move_Text']">
                {selectedMenu ? `Menu: ${selectedMenu.title}` : `${selected.length} selected`}
              </span>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-2 border border-neutral-300 rounded-xl text-xs font-semibold hover:bg-neutral-50 cursor-pointer">
                  Cancel
                </button>
                <button
                  disabled={(!selected.length && !selectedMenu) || saving}
                  onClick={handleNextStep}
                  className="px-5 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer flex items-center gap-1.5 transition-colors font-['Uber_Move_Text']"
                >
                  <span>{selectedMenu ? 'Next: Crop & Import' : 'Next: Choose Timeslot'}</span>
                  <span>→</span>
                </button>
              </div>
            </footer>
          </>
        ) : (
          /* Step 2: Select Timeslot */
          <>
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider font-['Uber_Move']">Choose Target Timeslot</span>
                <button
                  onClick={() => setShowCreateSlot(!showCreateSlot)}
                  className="text-xs font-bold text-black hover:underline cursor-pointer flex items-center gap-1 font-['Uber_Move_Text']"
                >
                  {showCreateSlot ? '✕ Cancel' : '+ Create Timeslot'}
                </button>
              </div>

              {/* Inline Create Timeslot Form */}
              {showCreateSlot && (
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-300 space-y-3">
                  <div className="text-xs font-bold text-black font-['Uber_Move']">New Timeslot Schedule</div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Timeslot Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Morning Rush, Lunch Menu, Evening Promo"
                      value={newSlotName}
                      onChange={e => setNewSlotName(e.target.value)}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-1.5 text-xs bg-white outline-none focus:border-black font-['Uber_Move_Text']"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Time24Input
                      label="Start Time (24h)"
                      value={newSlotStart}
                      onChange={setNewSlotStart}
                    />
                    <Time24Input
                      label="End Time (24h)"
                      value={newSlotEnd}
                      onChange={setNewSlotEnd}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5">Repeat Days (Alarm Style)</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {dayOptions.map(day => {
                        const isChecked = newSlotDays.includes(day.key)
                        return (
                          <button
                            key={day.key}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                if (newSlotDays.length > 1) {
                                  setNewSlotDays(newSlotDays.filter(d => d !== day.key))
                                }
                              } else {
                                setNewSlotDays([...newSlotDays, day.key])
                              }
                            }}
                            className={`w-9 h-8 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer ${
                              isChecked
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-neutral-600 border-neutral-300 hover:border-neutral-400'
                            }`}
                          >
                            {day.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={creatingSlot}
                      onClick={handleCreateSlotInline}
                      className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50 font-['Uber_Move_Text']"
                    >
                      {creatingSlot ? 'Creating…' : 'Save & Select Slot'}
                    </button>
                  </div>
                </div>
              )}

              {/* Timeslots List */}
              <div className="space-y-2">
                {displaySlots.map(slot => {
                  const isSelected = targetTimeslotIds.includes(slot.id)
                  const isDef = slot.is_default || slot.id === 'default'
                  return (
                    <label
                      key={slot.id}
                      className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-colors ${
                        isSelected ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTargetTimeslotIds(prev => [...prev, slot.id])
                            } else {
                              setTargetTimeslotIds(prev => prev.filter(id => id !== slot.id))
                            }
                          }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-black font-['Uber_Move']">{slot.name || (isDef ? 'Default Timeslot' : 'Scheduled Slot')}</span>
                            {isDef && (
                              <span className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Default</span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-500 font-['Uber_Move_Text'] mt-0.5">
                            {isDef ? (
                              'Always plays whenever no other scheduled timeslot is active'
                            ) : (
                              <span>
                                {slot.start_time} - {slot.end_time} • {Array.isArray(slot.days) ? slot.days.map(d => d.toUpperCase()).join(', ') : 'All days'}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-neutral-500">
                        {(slot.contents || []).length} item{(slot.contents || []).length !== 1 ? 's' : ''}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            <footer className="p-4 border-t border-neutral-200 flex justify-between items-center">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-neutral-300 rounded-xl text-xs font-semibold hover:bg-neutral-50 cursor-pointer font-['Uber_Move_Text']"
              >
                ← Back
              </button>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-2 border border-neutral-300 rounded-xl text-xs font-semibold hover:bg-neutral-50 cursor-pointer font-['Uber_Move_Text']">
                  Cancel
                </button>
                <button
                  disabled={saving || !targetTimeslotIds.length}
                  onClick={importSelected}
                  className="px-5 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer transition-colors font-['Uber_Move_Text']"
                >
                  {saving ? 'Importing…' : `Add to ${targetTimeslotIds.length} Timeslot${targetTimeslotIds.length !== 1 ? 's' : ''} (${selected.length} items)`}
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
    {crop && <ImageCropperModal isOpen imageFile={crop.preview} targetWidth={crop.width} targetHeight={crop.height} title="Crop Menu for Mirror" onClose={() => setCrop(null)} onCropComplete={completeCrop}/>}
  </>
}
