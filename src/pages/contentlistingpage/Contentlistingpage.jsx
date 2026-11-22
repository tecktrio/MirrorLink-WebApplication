import React, { useContext, useEffect, useMemo, useState } from 'react'
import {
  GET_AVAILABLE_CONTENTS_ON_SITE,
  REMOVE_CONTENT_FROM_MIRROR,
  UPDATE_MIRROR_PLAYLIST_ORDER,
  GET_MIRROR_LIVE_STATUS,
  UPDATE_PHOTO_SPEED,
  SET_MIRROR_ACTIVE_STATUS,
  DELETE_MIRROR,
  SAVE_TIMESLOT,
  DELETE_TIMESLOT,
  UPDATE_TIMESLOT_ORDER,
  UPDATE_MIRROR_TIMEZONE,
  GET_ALL_CONTENTS,
  GET_MENUS,
  ASSIGN_CONTENT_TO_MIRROR,
  SYNC_CONNECTED_MIRRORS,
  UPDATE_MIRROR_TRANSITIONS
} from '../../serverRequests/ServerRequests'
import VirtualScreen from '../../components/VirtualScreen/VirtualScreen'
import { useNavigate } from 'react-router-dom'
import { CookieContext } from '../../Contexts/CookieContext'
import AddContentModal from '../../components/AddContentModal/AddContentModal'
import Time24Input from '../../components/Time24Input/Time24Input'
import TimelineEditor from '../../components/TimelineEditor/TimelineEditor'
import AvailableMediaLibrary from '../../components/AvailableMediaLibrary/AvailableMediaLibrary'

export default function Contentlistingpage() {
  const [contentlist, setContentList] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [timeslots, setTimeslots] = useState([])
  const [selectedTimeslotId, setSelectedTimeslotId] = useState('default')
  const [mirrorTimezone, setMirrorTimezone] = useState('Asia/Kolkata')
  const [transitions, setTransitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingMirrorStatus, setUpdatingMirrorStatus] = useState(false)
  const [photoSpeed, setPhotoSpeed] = useState(5)
  const [targetInsertIndex, setTargetInsertIndex] = useState(null)
  const [libraryContents, setLibraryContents] = useState([])
  const [loadingLibrary, setLoadingLibrary] = useState(false)
  const [editorPlaying, setEditorPlaying] = useState(false)
  const [editorIndex, setEditorIndex] = useState(0)
  const [isMqttLive, setIsMqttLive] = useState(false)
  const [liveStatus, setLiveStatus] = useState({
    active_content_id: null,
    active_content_index: 0,
    playback_state: 'playing',
    is_active: true,
    is_online: false,
    mirror_width: 1920,
    mirror_height: 1080
  })
  const [message, setMessage] = useState('')
  const [copiedUrl, setCopiedUrl] = useState(false)
  const { getCookie, removeCookie } = useContext(CookieContext)
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Manage timeslot modal
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState(null)
  const [slotName, setSlotName] = useState('')
  const [slotStart, setSlotStart] = useState('04:00')
  const [slotEnd, setSlotEnd] = useState('09:00')
  const [slotDays, setSlotDays] = useState(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
  const [savingSlot, setSavingSlot] = useState(false)
  const [slotModalError, setSlotModalError] = useState('')

  const dayOptions = [
    { key: 'sun', label: 'Sun' },
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
  ]

  const mirror_id = getCookie('mirror_id')
  const viewerBase = (process.env.REACT_APP_VIEWER_URL || "https://screen.bigburry.com").replace(/\/+$/, "")
  const currentMirrorName = liveStatus?.mirror_name || 'Display Screen'
  const mirrorViewerUrl = `${viewerBase}?mirror_name=${encodeURIComponent(currentMirrorName)}`

  const handleCopyUrl = () => {
    try {
      navigator.clipboard.writeText(mirrorViewerUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2500)
    } catch (e) { }
  }

  const openModal = (insertAt = null) => {
    setTargetInsertIndex(typeof insertAt === 'number' ? insertAt : null)
    setIsModalOpen(true)
  }
  const closeModal = () => {
    setIsModalOpen(false)
    setTargetInsertIndex(null)
  }

  const fetchContents = () => {
    let login_key = getCookie('login_key') || 'adminpassword'
    if (mirror_id) {
      setLoading(true)
      GET_AVAILABLE_CONTENTS_ON_SITE(login_key, mirror_id)
        .then((res) => {
          const data = res?.data || []
          if (res?.photo_duration) {
            setPhotoSpeed(res.photo_duration)
          }
          if (res?.timezone) {
            setMirrorTimezone(res.timezone)
          }
          if (res?.transitions && Array.isArray(res.transitions)) {
            setTransitions(res.transitions)
          }
          setContentList(data)
          let loadedSlots = (res?.timeslots && Array.isArray(res.timeslots)) ? [...res.timeslots] : []
          // Ensure Default Timeslot is always present and first
          const hasDefault = loadedSlots.some(s => s.is_default || s.id === 'default')
          if (!hasDefault) {
            loadedSlots.unshift({
              id: 'default',
              name: 'Default Timeslot',
              is_default: true,
              days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
              contents: data.map(d => String(d._id))
            })
          }
          setTimeslots(loadedSlots)
          setLoading(false)
        })
        .catch((error) => {
          console.error('Error fetching contents for mirror:', error)
          setContentList([])
          setTimeslots([])
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }

  // Derive contents belonging to currently selected timeslot
  const currentSlotContents = useMemo(() => {
    const activeSlot = timeslots.find(s => String(s.id) === String(selectedTimeslotId))
    if (!activeSlot) return contentlist
    if (activeSlot.is_default || activeSlot.id === 'default') {
      if (Array.isArray(activeSlot.contents) && activeSlot.contents.length > 0) {
        const slotCids = new Set(activeSlot.contents.map(String))
        return contentlist.filter(item => slotCids.has(String(item._id)))
      }
      return contentlist
    }
    const slotCids = new Set((activeSlot.contents || []).map(String))
    return contentlist.filter(item => slotCids.has(String(item._id)))
  }, [contentlist, timeslots, selectedTimeslotId])

  // Sync filtered list with currentSlotContents
  useEffect(() => {
    setFilteredList(currentSlotContents)
  }, [currentSlotContents])

  // Detect which slot is currently broadcasting right now
  const activeNowSlotId = useMemo(() => {
    let now = new Date()
    let curDay = ''
    let curMins = 0

    try {
      // Format current time in the mirror's target timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: mirrorTimezone || 'Asia/Kolkata',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      })
      const parts = formatter.formatToParts(now)
      const partObj = {}
      for (const p of parts) {
        partObj[p.type] = p.value
      }
      curDay = (partObj.weekday || '').toLowerCase().slice(0, 3)
      const h = Number(partObj.hour) || 0
      const m = Number(partObj.minute) || 0
      curMins = h * 60 + m
    } catch (e) {
      const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
      curDay = dayMap[now.getDay()]
      curMins = now.getHours() * 60 + now.getMinutes()
    }

    const matching = []
    for (const slot of timeslots) {
      if (slot.is_default || slot.id === 'default') continue
      const days = (slot.days || []).map(d => d.toLowerCase())
      if (days.length && !days.includes(curDay)) continue
      if (!slot.start_time || !slot.end_time) continue
      try {
        const [sh, sm] = slot.start_time.split(':').map(Number)
        const [eh, em] = slot.end_time.split(':').map(Number)
        const sMins = sh * 60 + sm
        const eMins = eh * 60 + em
        let span = (eMins - sMins) % 1440
        if (span === 0) span = 1440
        const inSlot = sMins < eMins
          ? (curMins >= sMins && curMins < eMins)
          : (curMins >= sMins || curMins < eMins)
        if (inSlot) {
          matching.push({ span, id: slot.id })
        }
      } catch (e) { }
    }
    if (matching.length) {
      matching.sort((a, b) => a.span - b.span)
      return matching[0].id
    }
    return 'default'
  }, [timeslots, mirrorTimezone])

  // Subscribe the web virtual screen to the MQTT topic only when Live Sync is explicitly enabled
  useEffect(() => {
    if (!isMqttLive || !mirror_id || !window.mqtt) return
    const brokerUrl = process.env.REACT_APP_MQTT_URL || window.MIRRORLINK_MQTT_URL || "wss://screenpilot.bigburry.com/mqtt"
    let client = null
    try {
      client = window.mqtt.connect(brokerUrl, {
        ...(window.MIRRORLINK_MQTT_OPTIONS || {}),
        reconnectPeriod: 3000,
        connectTimeout: 10000
      })
      client.on("connect", () => {
        client.subscribe(`mirror/${mirror_id}`, { qos: 1 })
      })
      client.on("message", (_topic, payload) => {
        try {
          const message = JSON.parse(payload.toString())
          const data = message.data || {}
          if (message.event === "slide_change") {
            const incomingContent = data.content
              ? { ...data.content, _id: data.content._id || data.content_id }
              : null
            if (incomingContent?._id && incomingContent.content_url) {
              setContentList(prev => {
                const existingIndex = prev.findIndex(item => String(item._id) === String(incomingContent._id))
                if (existingIndex >= 0) {
                  const next = [...prev]
                  next[existingIndex] = { ...next[existingIndex], ...incomingContent }
                  return next
                }
                return [...prev, incomingContent]
              })
            }
            const incomingIndex = Number(data.index)
            if (!isNaN(incomingIndex) && incomingIndex >= 0) {
              setEditorIndex(incomingIndex)
            }
            setLiveStatus(prev => ({ ...prev, active_content_index: Number(data.index) || 0, active_content_id: data.content_id || null }))
          } else if (message.event === "playback_control") {
            const isPaused = data.action === "paused"
            setEditorPlaying(!isPaused)
            setLiveStatus(prev => ({ ...prev, playback_state: isPaused ? "paused" : "playing" }))
          } else if (message.event === "update_playlist") {
            fetchContents()
          } else if (message.event === "standby") {
            setLiveStatus(prev => ({ ...prev, active_content_id: null, active_content_index: 0 }))
          } else if (message.event === "eligibility_status" && Number(data.status_code) === 600) {
            setLiveStatus(prev => ({ ...prev, is_active: false }))
          }
        } catch (err) { console.warn("[Virtual Screen MQTT] Invalid event:", err) }
      })
      client.on("error", err => console.warn("[Virtual Screen MQTT] Connection error:", err))
    } catch (err) {
      console.warn("[Virtual Screen MQTT] Initialization error:", err)
    }

    return () => {
      try {
        if (client) {
          client.unsubscribe(`mirror/${mirror_id}`)
          client.removeAllListeners()
          client.end(true)
        }
      } catch (err) {
        console.warn("[Virtual Screen MQTT] Cleanup error:", err)
      }
    }
  }, [isMqttLive, mirror_id])

  // Fetch dimensions and current playback state once; MQTT carries live changes.
  useEffect(() => {
    const login_key = getCookie('login_key') || 'adminpassword'
    if (!mirror_id) return
    GET_MIRROR_LIVE_STATUS(login_key, mirror_id).then((res) => {
      if (res?.data) {
        setLiveStatus(prev => ({ ...prev, ...res.data, playback_state: res.data.playback_state || 'playing' }))
        if (res.data.photo_duration) setPhotoSpeed(res.data.photo_duration)
      }
    }).catch(() => { })
  }, [mirror_id])

  const handleTogglePlayPause = () => {
    setEditorPlaying(prev => !prev)
  }

  const handleToggleMirrorStatus = async () => {
    if (!mirror_id || updatingMirrorStatus) return
    const wasActive = liveStatus.is_active !== false
    setUpdatingMirrorStatus(true)
    setLiveStatus(prev => ({ ...prev, is_active: !wasActive }))
    try {
      const result = await SET_MIRROR_ACTIVE_STATUS(getCookie('login_key'), mirror_id, !wasActive)
      setLiveStatus(prev => ({ ...prev, is_active: result.is_active }))
      setMessage(result.is_active
        ? 'Mirror reactivated. It will resume receiving MQTT playback updates.'
        : 'Mirror deactivated. Playback stopped and new content MQTT updates are blocked.')
      setTimeout(() => setMessage(''), 4500)
    } catch (error) {
      setLiveStatus(prev => ({ ...prev, is_active: wasActive }))
      alert(error.message || 'Could not update mirror status.')
    } finally {
      setUpdatingMirrorStatus(false)
    }
  }

  const handleDeleteMirror = async () => {
    const mirrorName = liveStatus.mirror_name || 'this mirror'
    if (!window.confirm(`Delete mirror "${mirrorName}"? Its display will stop receiving content and this action cannot be undone.`)) return
    try {
      await DELETE_MIRROR(getCookie('login_key'), mirror_id)
      removeCookie('mirror_id')
      navigate('/manage_mirrors')
    } catch (error) {
      alert(error.message || 'Could not delete this mirror.')
    }
  }

  const handleUpdateItemDuration = (contentId, duration, contentTitle) => {
    let login_key = getCookie('login_key') || 'adminpassword'
    if (!mirror_id) return

    setContentList((prev) =>
      prev.map((c) => (c._id === contentId ? { ...c, duration } : c))
    )
    setFilteredList((prev) =>
      prev.map((c) => (c._id === contentId ? { ...c, duration } : c))
    )

    UPDATE_PHOTO_SPEED(login_key, mirror_id, null, contentId, duration)
      .then(() => {
        setMessage(`Time to stay for "${contentTitle || 'Photo'}" set to ${duration}s.`)
        setTimeout(() => setMessage(''), 3000)
      })
      .catch((err) => {
        console.error("Error updating photo duration:", err)
      })
  }

  const handleUpdateTransition = (leftContentId, rightContentId, transitionId) => {
    let login_key = getCookie('login_key') || 'adminpassword'
    if (!mirror_id || !leftContentId || !rightContentId) return

    let nextTransitions = [...transitions]
    const idx = nextTransitions.findIndex(
      t => String(t.left_content_id) === String(leftContentId) && String(t.right_content_id) === String(rightContentId)
    )

    if (!transitionId || transitionId === 'none') {
      if (idx !== -1) {
        nextTransitions.splice(idx, 1)
      }
    } else {
      const entry = {
        transition_id: transitionId,
        left_content_id: String(leftContentId),
        right_content_id: String(rightContentId)
      }
      if (idx !== -1) {
        nextTransitions[idx] = entry
      } else {
        nextTransitions.push(entry)
      }
    }

    setTransitions(nextTransitions)
    UPDATE_MIRROR_TRANSITIONS(login_key, mirror_id, nextTransitions)
      .then(() => {
        const TRANSITION_NAMES = {
          fade: 'Crossfade',
          slide: 'Slide Push',
          zoom: 'Zoom Dissolve',
          wipe: 'Curtain Wipe',
          flip: '3D Flip',
          neon: 'Neon Glow (Colorful)',
          rainbow: 'Rainbow Prism (Colorful)',
          amber: 'Amber Flare (Colorful)'
        }
        const effectName = TRANSITION_NAMES[transitionId] || (transitionId && transitionId !== 'none' ? transitionId : 'None')
        setMessage(transitionId && transitionId !== 'none'
          ? `Transition effect set to "${effectName}".`
          : 'Transition effect removed.')
        setTimeout(() => setMessage(''), 3000)
      })
      .catch((err) => {
        console.error("Failed to update transition:", err)
      })
  }

  const handleRemoveFromMirror = (content_id, content_title) => {
    const isDefault = selectedTimeslotId === 'default'
    const confirmPrompt = isDefault
      ? `Remove "${content_title || 'this media'}" from this mirror? (It will remain in your media library)`
      : `Remove "${content_title || 'this media'}" from this timeslot? (It will remain in your media library)`
    if (!window.confirm(confirmPrompt)) return

    let login_key = getCookie('login_key') || 'adminpassword'
    const targetSlotId = isDefault ? null : selectedTimeslotId
    REMOVE_CONTENT_FROM_MIRROR(login_key, content_id, mirror_id, targetSlotId)
      .then((res) => {
        if (res?.timeslots) {
          setTimeslots(res.timeslots)
        }
        if (isDefault) {
          setContentList((prev) => prev.filter((item) => item._id !== content_id))
        } else {
          setTimeslots(prev => prev.map(s => String(s.id) === String(selectedTimeslotId)
            ? { ...s, contents: (s.contents || []).filter(c => String(c) !== String(content_id)) }
            : s
          ))
        }
        setMessage(`"${content_title || 'Content'}" removed from mirror.`)
        setTimeout(() => setMessage(''), 3500)
      })
      .catch((err) => {
        console.error("Error removing content:", err)
        alert("Failed to remove content. Please try again.")
      })
  }

  const persistReorderedPlaylist = (newItems) => {
    setFilteredList(newItems)
    const orderedIds = newItems.map((item) => String(item._id))
    let login_key = getCookie('login_key') || 'adminpassword'

    if (selectedTimeslotId === 'default') {
      setContentList(newItems)
      UPDATE_MIRROR_PLAYLIST_ORDER(login_key, mirror_id, orderedIds)
        .then(() => {
          setMessage('Playlist sequence updated.')
          setTimeout(() => setMessage(''), 3500)
        })
        .catch((err) => {
          console.error("Error updating playlist order:", err)
          alert("Failed to save playlist order.")
        })
    } else {
      UPDATE_TIMESLOT_ORDER(login_key, mirror_id, selectedTimeslotId, orderedIds)
        .then((res) => {
          if (res?.timeslots) setTimeslots(res.timeslots)
          setMessage('Timeslot sequence updated.')
          setTimeout(() => setMessage(''), 3500)
        })
        .catch((err) => {
          console.error("Error updating timeslot order:", err)
          alert("Failed to save timeslot order.")
        })
    }
  }

  const handleSelectVirtualSlide = (index, contentId) => {
    setEditorIndex(index)
    if (isMqttLive && mirror_id) {
      let login_key = getCookie('login_key') || 'adminpassword'
      const targetId = contentId || filteredList[index]?._id
      if (targetId) {
        SYNC_CONNECTED_MIRRORS(login_key, mirror_id, index, targetId).catch((err) => {
          console.warn("[Live Sync] Failed to sync mirror via MQTT:", err)
        })
      }
    }
  }

  const handleToggleLiveSync = () => {
    const nextLive = !isMqttLive
    setIsMqttLive(nextLive)
    if (nextLive) {
      setEditorPlaying(true)
      const currentSlide = filteredList[editorIndex] || filteredList[0]
      if (currentSlide && mirror_id) {
        let login_key = getCookie('login_key') || 'adminpassword'
        SYNC_CONNECTED_MIRRORS(login_key, mirror_id, editorIndex, currentSlide._id).catch(() => {})
      }
      setMessage("Live MQTT Sync Connected. Connected physical screens will now follow your timeline playback.")
      setTimeout(() => setMessage(''), 4500)
    } else {
      setEditorPlaying(false)
      setMessage("Disconnected from Live MQTT. Timeline and preview are now paused in local editor mode.")
      setTimeout(() => setMessage(''), 4500)
    }
  }

  const fetchLibraryContents = () => {
    let login_key = getCookie('login_key') || 'adminpassword'
    setLoadingLibrary(true)
    Promise.all([
      GET_ALL_CONTENTS(login_key).catch(() => ({ data: [] })),
      GET_MENUS(login_key).catch(() => ({ data: [] }))
    ])
      .then(([contentsRes, menusRes]) => {
        const cData = contentsRes?.data || []
        const mData = (menusRes?.data || []).map(m => ({
          _id: m._id,
          content_title: m.title || 'Menu Template',
          content_description: m.description || 'Menu display',
          content_format: 'menu',
          content_url: m.preview_url || '/logo.png',
          is_menu: true
        }))
        setLibraryContents([...cData, ...mData])
        setLoadingLibrary(false)
      })
      .catch((err) => {
        console.error('Error fetching library contents:', err)
        setLoadingLibrary(false)
      })
  }

  useEffect(() => {
    fetchLibraryContents()
  }, [])

  const handleQuickAddFromLibrary = (item, insertAt = null) => {
    let login_key = getCookie('login_key') || 'adminpassword'
    if (!mirror_id || !item?._id) return

    const targetPos = typeof insertAt === 'number' ? insertAt : filteredList.length
    const targetSlotIds = [selectedTimeslotId || 'default']

    ASSIGN_CONTENT_TO_MIRROR(login_key, [item._id], mirror_id, targetSlotIds, targetPos)
      .then(() => {
        fetchContents()
        fetchLibraryContents()
        setMessage(`Added "${item.content_title || 'Media'}" to timeline.`)
        setTimeout(() => setMessage(''), 3500)
      })
      .catch((err) => {
        console.error("Error adding content to mirror:", err)
        alert(err.message || 'Failed to add content.')
      })
  }

  const assignedContentIds = useMemo(() => {
    return new Set((currentSlotContents || []).map(c => String(c._id)))
  }, [currentSlotContents])

  // Synchronized playback sequencer between VirtualScreen and Timeline Editor
  useEffect(() => {
    if (!editorPlaying || filteredList.length <= 1) return

    const currentSlide = filteredList[editorIndex] || filteredList[0]
    const slideDuration = (Number(currentSlide?.duration) || Number(photoSpeed) || 5) * 1000

    const timer = setTimeout(() => {
      const nextIndex = (editorIndex + 1) % filteredList.length
      setEditorIndex(nextIndex)
      if (isMqttLive && mirror_id) {
        let login_key = getCookie('login_key') || 'adminpassword'
        const nextSlide = filteredList[nextIndex]
        if (nextSlide?._id) {
          SYNC_CONNECTED_MIRRORS(login_key, mirror_id, nextIndex, nextSlide._id).catch(() => {})
        }
      }
    }, Math.max(1000, slideDuration))

    return () => clearTimeout(timer)
  }, [editorPlaying, editorIndex, filteredList, photoSpeed, isMqttLive, mirror_id])

  // Open modal to create or edit timeslot
  const openCreateSlotModal = () => {
    setEditingSlot(null)
    setSlotName('')
    setSlotStart('04:00')
    setSlotEnd('09:00')
    setSlotDays(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
    setSlotModalError('')
    setIsSlotModalOpen(true)
  }

  const openEditSlotModal = (slot) => {
    setEditingSlot(slot)
    setSlotName(slot.name || '')
    setSlotStart(slot.start_time || '04:00')
    setSlotEnd(slot.end_time || '09:00')
    setSlotDays(slot.days || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
    setSlotModalError('')
    setIsSlotModalOpen(true)
  }

  const handleSaveTimeslot = async () => {
    if (!slotName.trim()) {
      setSlotModalError('Please enter a timeslot name')
      return
    }
    if (!slotStart || !slotEnd) {
      setSlotModalError('Please provide start and end times')
      return
    }
    if (!slotDays.length) {
      setSlotModalError('Please select at least one day')
      return
    }
    setSavingSlot(true)
    setSlotModalError('')
    try {
      const login_key = getCookie('login_key') || 'adminpassword'
      const payload = {
        id: editingSlot ? editingSlot.id : 'new',
        name: slotName.trim(),
        start_time: slotStart,
        end_time: slotEnd,
        days: slotDays,
        contents: editingSlot ? editingSlot.contents || [] : []
      }
      const res = await SAVE_TIMESLOT(login_key, mirror_id, payload)
      if (res?.timeslots) {
        let loadedSlots = [...res.timeslots]
        if (!loadedSlots.some(s => s.is_default || s.id === 'default')) {
          loadedSlots.unshift({
            id: 'default',
            name: 'Default Timeslot',
            is_default: true,
            days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
            contents: contentlist.map(d => String(d._id))
          })
        }
        setTimeslots(loadedSlots)
        if (res.timeslot?.id) setSelectedTimeslotId(res.timeslot.id)
      }
      setIsSlotModalOpen(false)
      setMessage(`Timeslot "${slotName}" saved successfully.`)
      setTimeout(() => setMessage(''), 3500)
    } catch (err) {
      setSlotModalError(err.message || 'Failed to save timeslot')
    } finally {
      setSavingSlot(false)
    }
  }

  const handleDeleteTimeslot = async (slotId, sName) => {
    if (slotId === 'default') {
      alert('Default timeslot cannot be deleted.')
      return
    }
    if (!window.confirm(`Delete timeslot "${sName || 'Timeslot'}"? Contents assigned to it will remain in library.`)) return
    try {
      const login_key = getCookie('login_key') || 'adminpassword'
      const res = await DELETE_TIMESLOT(login_key, mirror_id, slotId)
      if (res?.timeslots) {
        let loadedSlots = [...res.timeslots]
        if (!loadedSlots.some(s => s.is_default || s.id === 'default')) {
          loadedSlots.unshift({
            id: 'default',
            name: 'Default Timeslot',
            is_default: true,
            days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
            contents: contentlist.map(d => String(d._id))
          })
        }
        setTimeslots(loadedSlots)
      }
      if (selectedTimeslotId === slotId) setSelectedTimeslotId('default')
      setMessage(`Timeslot "${sName}" deleted.`)
      setTimeout(() => setMessage(''), 3500)
    } catch (err) {
      alert(err.message || 'Failed to delete timeslot')
    }
  }

  useEffect(() => {
    fetchContents()
  }, [mirror_id])

  const resolvedIndex = editorIndex >= 0 && editorIndex < filteredList.length ? editorIndex : 0
  const activeContent = filteredList.length > 0 ? filteredList[resolvedIndex] : null

  return (
    <div className="space-y-3 font-['Uber_Move_Text']">
      {/* Toast Notification */}
      {message && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg animate-fade-in font-['Uber_Move_Text']">
          {message}
        </div>
      )}

      {/* TOP ROW: Timeslot Schedule (Left) | Display Stream URL (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
        {/* Left: Timeslot Schedule Feature Bar */}
        <div className="lg:col-span-7 xl:col-span-7">
          <div className='bg-white p-3 sm:p-3.5 rounded-xl border border-neutral-200 space-y-2 shadow-2xs h-full flex flex-col justify-between'>
            <div className='flex items-center justify-between flex-wrap gap-2'>
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => navigate('/setup')}
                  className='w-7 h-7 rounded-full bg-white hover:bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black transition-colors cursor-pointer shrink-0 shadow-2xs'
                  title='Back to Setup'
                >
                  <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M15 19l-7-7 7-7' />
                  </svg>
                </button>
                <div className='w-5 h-5 rounded-md bg-neutral-100 text-black flex items-center justify-center text-[11px] font-black'>
                  ⏱
                </div>
                <h3 className="text-xs font-black text-black uppercase tracking-wider font-['Uber_Move']">
                  {liveStatus?.mirror_name ? `${liveStatus.mirror_name} • ` : ''}Timeslot Schedule
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-neutral-50 px-2 py-0.5 rounded-lg border border-neutral-200 text-xs">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Timezone:</span>
                  <select
                    value={mirrorTimezone}
                    onChange={async (e) => {
                      const newTz = e.target.value
                      setMirrorTimezone(newTz)
                      try {
                        const login_key = getCookie('login_key') || 'adminpassword'
                        await UPDATE_MIRROR_TIMEZONE(login_key, mirror_id, newTz)
                        setMessage(`Screen timezone updated to ${newTz}`)
                        setTimeout(() => setMessage(''), 3000)
                      } catch (err) {
                        console.error('Failed to update timezone:', err)
                      }
                    }}
                    className="bg-transparent font-semibold text-black outline-none cursor-pointer text-xs pr-1"
                  >
                    <option value="Asia/Kolkata">India (IST, UTC+5:30)</option>
                    <option value="Asia/Dubai">Dubai / UAE (GST, UTC+4)</option>
                    <option value="Asia/Riyadh">Saudi Arabia (AST, UTC+3)</option>
                    <option value="Asia/Singapore">Singapore / Malaysia (SGT, UTC+8)</option>
                    <option value="Asia/Bangkok">Thailand / Vietnam (ICT, UTC+7)</option>
                    <option value="Asia/Tokyo">Japan (JST, UTC+9)</option>
                    <option value="Europe/London">UK / London (GMT/BST)</option>
                    <option value="Europe/Paris">Central Europe (CET/CEST)</option>
                    <option value="America/New_York">US Eastern (EST/EDT)</option>
                    <option value="America/Chicago">US Central (CST/CDT)</option>
                    <option value="America/Denver">US Mountain (MST/MDT)</option>
                    <option value="America/Los_Angeles">US Pacific (PST/PDT)</option>
                    <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
                    <option value="UTC">Universal Coordinated Time (UTC)</option>
                  </select>
                </div>
                <button
                  onClick={openCreateSlotModal}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer font-['Uber_Move_Text']"
                >
                  <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M12 4v16m8-8H4' />
                  </svg>
                  <span>New Timeslot</span>
                </button>
              </div>
            </div>

            {/* Horizontal Tabs for Timeslots */}
            <div className='flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 scrollbar-none'>
              {timeslots.map((slot) => {
                const isSelected = String(slot.id) === String(selectedTimeslotId)
                const isDef = slot.is_default || slot.id === 'default'
                const isCurrentlyBroadcasting = String(slot.id) === String(activeNowSlotId)
                return (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedTimeslotId(slot.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-black text-white border-black'
                        : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    <span className="font-['Uber_Move']">{slot.name || (isDef ? 'Default Slot' : 'Slot')}</span>
                    {isCurrentlyBroadcasting && (
                      <span className={`text-[9px] font-black uppercase px-1 py-0.2 rounded ${
                        isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        Live Now
                      </span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {(slot.contents || []).length}
                    </span>
                    {!isDef && (
                      <div className="flex items-center gap-1 ml-0.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => openEditSlotModal(slot)}
                          className={`p-0.5 hover:opacity-75 ${isSelected ? 'text-neutral-300 hover:text-white' : 'text-neutral-400 hover:text-black'}`}
                          title="Edit Timeslot"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDeleteTimeslot(slot.id, slot.name)}
                          className={`p-0.5 hover:opacity-75 ${isSelected ? 'text-red-300 hover:text-red-100' : 'text-neutral-400 hover:text-red-600'}`}
                          title="Delete Timeslot"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Display Stream URL & Launch Actions */}
        <div className="lg:col-span-5 xl:col-span-5">
          <div className="bg-white border border-neutral-200 rounded-xl p-3 sm:p-3.5 space-y-2 shadow-2xs h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-black px-0.5 gap-2">
              <span className="font-['Uber_Move'] font-bold shrink-0">Display Stream URL</span>
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Active / Inactive Mirror Status Switch */}
                <button
                  type='button'
                  role='switch'
                  aria-checked={liveStatus.is_active !== false}
                  aria-label={liveStatus.is_active === false ? 'Reactivate this mirror' : 'Deactivate this mirror'}
                  onClick={handleToggleMirrorStatus}
                  disabled={updatingMirrorStatus}
                  className='inline-flex items-center gap-1.5 px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 rounded-full text-[11px] font-bold text-black whitespace-nowrap disabled:opacity-60 cursor-pointer'
                  title='When inactive, this mirror stops playback and receives no new content updates.'
                >
                  <span>{liveStatus.is_active === false ? 'Inactive' : 'Active'}</span>
                  <span className={`relative inline-flex h-3.5 w-6 rounded-full transition-colors ${liveStatus.is_active === false ? 'bg-neutral-300' : 'bg-black'}`}>
                    <span className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white shadow transition-transform ${liveStatus.is_active === false ? 'translate-x-0.5' : 'translate-x-[11px]'}`} />
                  </span>
                </button>

                {/* Delete Mirror Button */}
                <button
                  type='button'
                  onClick={handleDeleteMirror}
                  className='p-1 text-neutral-400 hover:text-red-600 rounded-full cursor-pointer transition-colors'
                  title='Delete this mirror display'
                >
                  <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6' />
                  </svg>
                </button>
              </div>
            </div>

            {/* URL input and Copy / Launch buttons on the same line */}
            <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-lg p-1 pl-2.5">
              <div className="flex-1 font-mono text-xs text-black truncate select-all min-w-0" title={mirrorViewerUrl}>
                {mirrorViewerUrl}
              </div>

              <button
                onClick={handleCopyUrl}
                className="py-1 px-2.5 bg-white hover:bg-neutral-100 text-black border border-neutral-200 rounded-md text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 shrink-0 shadow-2xs"
                title="Copy Stream URL"
              >
                {copiedUrl ? (
                  <>
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-black font-black">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 fill-none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy URL</span>
                  </>
                )}
              </button>

              <a
                href={mirrorViewerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1 px-2.5 bg-black hover:bg-neutral-800 text-white rounded-md text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 text-center shrink-0 shadow-xs"
                title="Launch viewer in new browser tab"
              >
                <span>Launch</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW: Available Content Library (Left) | Virtual Screen Player (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* Left: Available Content Library */}
        <div className="lg:col-span-7 xl:col-span-7">
          <AvailableMediaLibrary
            contents={libraryContents}
            loading={loadingLibrary}
            assignedIds={assignedContentIds}
            onAddContent={(item) => handleQuickAddFromLibrary(item)}
            onRefreshLibrary={fetchLibraryContents}
          />
        </div>

        {/* Right: Virtual Screen Player */}
        <div className="lg:col-span-5 xl:col-span-5">
          <VirtualScreen
            mirror={liveStatus}
            activeContent={activeContent}
            contentList={filteredList}
            currentIndex={resolvedIndex}
            playbackState={editorPlaying ? 'playing' : 'paused'}
            isOnline={true}
            isLiveSyncEnabled={isMqttLive}
            transitions={transitions}
            onToggleLiveSync={handleToggleLiveSync}
            onSelectSlide={handleSelectVirtualSlide}
            onTogglePlayPause={handleTogglePlayPause}
            onStartPresentation={() => setEditorPlaying(true)}
          />
        </div>
      </div>

      {/* BOTTOM ROW: Full-Width Sequencer Timeline Editor (Directly Below Virtual Screen) */}
      <div className="w-full">
        {loading ? (
          <div className='p-12 text-center text-xs text-neutral-400 bg-white rounded-2xl border border-neutral-200'>
            Loading mirror contents...
          </div>
        ) : (
          <TimelineEditor
            items={filteredList}
            defaultDuration={photoSpeed}
            liveIndex={resolvedIndex}
            resolvedIndex={resolvedIndex}
            playbackState={editorPlaying ? 'playing' : 'paused'}
            isPlaying={editorPlaying}
            transitions={transitions}
            onUpdateTransition={handleUpdateTransition}
            onTogglePlayPause={handleTogglePlayPause}
            onRewind={() => setEditorIndex(0)}
            onSelectSlide={handleSelectVirtualSlide}
            onInsertAt={(index) => openModal(index)}
            onUpdateDuration={handleUpdateItemDuration}
            onRemoveItem={handleRemoveFromMirror}
            onReorder={persistReorderedPlaylist}
            onDropLibraryItem={(data, targetIndex) => handleQuickAddFromLibrary({ _id: data.contentId, content_title: data.title }, targetIndex)}
          />
        )}
      </div>

      {/* Add Content to Mirror Modal (with Timeslot selection step & timeline insert position) */}
      <AddContentModal
        isOpen={isModalOpen}
        onClose={closeModal}
        mirrorId={mirror_id}
        mirrorName={liveStatus?.mirror_name || 'Mirror Display'}
        mirrorWidth={liveStatus?.mirror_width || 1920}
        mirrorHeight={liveStatus?.mirror_height || 1080}
        timeslots={timeslots}
        activeTimeslotId={selectedTimeslotId}
        insertIndex={targetInsertIndex}
        onTimeslotsUpdated={(updatedSlots) => setTimeslots(updatedSlots)}
        onContentAdded={(newTitle, addedIds, insertedPos) => {
          fetchContents()
          setMessage(typeof insertedPos === 'number'
            ? `Inserted "${newTitle || 'Content'}" into timeline at position #${insertedPos + 1}.`
            : `Imported "${newTitle || 'Content'}" successfully.`)
          setTimeout(() => setMessage(''), 3500)
          setTargetInsertIndex(null)
        }}
      />

      {/* Create / Edit Timeslot Modal */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsSlotModalOpen(false)}>
          <section className="bg-white rounded-2xl w-full max-w-lg flex flex-col border border-neutral-200" onClick={e => e.stopPropagation()}>
            <header className="p-5 border-b border-neutral-200 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-black font-['Uber_Move']">
                  {editingSlot ? 'Edit Timeslot Schedule' : 'Create Timeslot Schedule'}
                </h3>
                <p className="text-xs text-neutral-500 font-['Uber_Move_Text']">
                  Set the broadcast timeframe and active days for this screen.
                </p>
              </div>
              <button className="text-neutral-500 hover:text-black font-bold p-1 cursor-pointer" onClick={() => setIsSlotModalOpen(false)}>✕</button>
            </header>

            {slotModalError && (
              <p className="mx-5 mt-3 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{slotModalError}</p>
            )}

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Timeslot Name</label>
                <input
                  type="text"
                  placeholder="e.g. 4am to 9pm, Lunch Special, Weekend Loop"
                  value={slotName}
                  onChange={e => setSlotName(e.target.value)}
                  className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-black font-['Uber_Move_Text']"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Time24Input
                  label="Start Time (24h)"
                  value={slotStart}
                  onChange={setSlotStart}
                />
                <Time24Input
                  label="End Time (24h)"
                  value={slotEnd}
                  onChange={setSlotEnd}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2">
                  Active Days (Like Setting an Alarm)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {dayOptions.map(day => {
                    const isChecked = slotDays.includes(day.key)
                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            if (slotDays.length > 1) {
                              setSlotDays(slotDays.filter(d => d !== day.key))
                            }
                          } else {
                            setSlotDays([...slotDays, day.key])
                          }
                        }}
                        className={`w-10 h-9 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${isChecked
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-neutral-600 border-neutral-300 hover:border-neutral-400'
                          }`}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[11px] text-neutral-500 mt-1.5">
                  On unselected days or outside this time window, contents from Default Timeslot will broadcast.
                </p>
              </div>

              <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200 text-[11px] text-neutral-600">
                <strong>Priority rule:</strong> If multiple slots match the current time, highest priority is automatically given to the <strong>shortest time duration</strong> slot.
              </div>
            </div>

            <footer className="p-4 border-t border-neutral-200 flex justify-end gap-2">
              <button
                onClick={() => setIsSlotModalOpen(false)}
                className="px-4 py-2 border border-neutral-300 rounded-xl text-xs font-semibold hover:bg-neutral-50 cursor-pointer font-['Uber_Move_Text']"
              >
                Cancel
              </button>
              <button
                disabled={savingSlot}
                onClick={handleSaveTimeslot}
                className="px-5 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer transition-colors font-['Uber_Move_Text']"
              >
                {savingSlot ? 'Saving…' : 'Save Timeslot'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}
