import React, { useContext, useEffect, useState } from 'react'
import {
  GET_AVAILABLE_CONTENTS_ON_SITE,
  REMOVE_CONTENT_FROM_MIRROR,
  UPDATE_MIRROR_PLAYLIST_ORDER,
  CONTROL_PLAYBACK,
  GET_MIRROR_LIVE_STATUS,
  SYNC_CONNECTED_MIRRORS,
  TOGGLE_CONTENT_STATUS_ON_MIRROR,
  UPDATE_PHOTO_SPEED,
  SET_MIRROR_ACTIVE_STATUS,
  DELETE_MIRROR
} from '../../serverRequests/ServerRequests'
import Listitem from '../../components/listitem/Listitem'
import SearchBar from '../../components/SearchBar/SearchBar'
import VirtualScreen from '../../components/VirtualScreen/VirtualScreen'
import { useNavigate } from 'react-router-dom'
import { CookieContext } from '../../Contexts/CookieContext'
import AddContentModal from '../../components/AddContentModal/AddContentModal'

export default function Contentlistingpage() {
  const [contentlist, setContentList] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [loading, setLoading] = useState(true)
  const [controllingPlayback, setControllingPlayback] = useState(false)
  const [updatingMirrorStatus, setUpdatingMirrorStatus] = useState(false)
  const [photoSpeed, setPhotoSpeed] = useState(5)
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
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const { getCookie, removeCookie } = useContext(CookieContext)
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const mirror_id = getCookie('mirror_id')
  const viewerBase = (process.env.REACT_APP_VIEWER_URL || "https://mirror.bigburry.com").replace(/\/+$/, "")
  const currentMirrorName = liveStatus?.mirror_name || 'Display Screen'
  const mirrorViewerUrl = `${viewerBase}?mirror_name=${encodeURIComponent(currentMirrorName)}`

  const handleCopyUrl = () => {
    try {
      navigator.clipboard.writeText(mirrorViewerUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2500)
    } catch (e) {}
  }

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

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
          setContentList(data)
          setFilteredList(data)
          setLoading(false)
        })
        .catch((error) => {
          console.error('Error fetching contents for mirror:', error)
          setContentList([])
          setFilteredList([])
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }

  // Subscribe the web virtual screen to the same MQTT topic as physical displays.
  useEffect(() => {
    if (!mirror_id || !window.mqtt) return
    const brokerUrl = process.env.REACT_APP_MQTT_URL || window.MIRRORLINK_MQTT_URL || "wss://mirrorlink.bigburry.com/mqtt"
    const client = window.mqtt.connect(brokerUrl, {
      ...(window.MIRRORLINK_MQTT_OPTIONS || {}),
      reconnectPeriod: 3000,
      connectTimeout: 10000
    })
    client.on("connect", () => client.subscribe(`mirror/${mirror_id}`, { qos: 1 }))
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
          setLiveStatus(prev => ({ ...prev, active_content_index: Number(data.index) || 0, active_content_id: data.content_id || null }))
        } else if (message.event === "playback_control") {
          setLiveStatus(prev => ({ ...prev, playback_state: data.action === "paused" ? "paused" : "playing" }))
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
    return () => { client.end(true) }
  }, [mirror_id])

  // Fetch dimensions and current playback state once; MQTT carries live changes.
  useEffect(() => {
    const login_key = getCookie('login_key') || 'adminpassword'
    if (!mirror_id) return
    GET_MIRROR_LIVE_STATUS(login_key, mirror_id).then((res) => {
      if (res?.data) {
        setLiveStatus(prev => ({ ...prev, ...res.data, playback_state: res.data.playback_state || 'playing' }))
        if (res.data.photo_duration) setPhotoSpeed(res.data.photo_duration)
      }
    }).catch(() => {})
  }, [mirror_id])

  const handleTogglePlayPause = () => {
    let login_key = getCookie('login_key') || 'adminpassword'
    if (!mirror_id) return

    const nextAction = liveStatus.playback_state === 'paused' ? 'play' : 'pause'
    setControllingPlayback(true)
    CONTROL_PLAYBACK(login_key, mirror_id, nextAction)
      .then((res) => {
        setControllingPlayback(false)
        const updatedState = res.playback_state || nextAction
        setLiveStatus((prev) => ({ ...prev, playback_state: updatedState }))
        setMessage(
          updatedState === 'paused'
            ? 'Playback paused on connected mirror(s).'
            : 'Playback resumed on connected mirror(s).'
        )
        setTimeout(() => setMessage(''), 3500)
      })
      .catch((err) => {
        setControllingPlayback(false)
        console.error("Playback control error:", err)
        alert("Failed to toggle playback: " + (err.message || 'Server error'))
      })
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

  const handleToggleActive = (content_id, current_is_active, content_title) => {
    let login_key = getCookie('login_key') || 'adminpassword'
    if (!mirror_id) return

    const nextActive = !current_is_active
    setContentList((prev) =>
      prev.map((item) => (item._id === content_id ? { ...item, is_active: nextActive } : item))
    )
    setFilteredList((prev) =>
      prev.map((item) => (item._id === content_id ? { ...item, is_active: nextActive } : item))
    )

    TOGGLE_CONTENT_STATUS_ON_MIRROR(login_key, mirror_id, content_id, nextActive)
      .then(() => {
        setMessage(
          `"${content_title || 'Media'}" is now ${nextActive ? 'Active' : 'Temporarily Disabled'} on this mirror.`
        )
        setTimeout(() => setMessage(''), 3500)
      })
      .catch((err) => {
        setContentList((prev) =>
          prev.map((item) => (item._id === content_id ? { ...item, is_active: current_is_active } : item))
        )
        setFilteredList((prev) =>
          prev.map((item) => (item._id === content_id ? { ...item, is_active: current_is_active } : item))
        )
        console.error("Error toggling content status:", err)
        alert("Failed to update content status: " + (err.message || 'Server error'))
      })
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

  const handleRemoveFromMirror = (content_id, content_title) => {
    if (!window.confirm(`Are you sure you want to remove "${content_title || 'this media'}" from this mirror's playlist?`)) {
      return
    }

    let login_key = getCookie('login_key') || 'adminpassword'
    REMOVE_CONTENT_FROM_MIRROR(login_key, content_id, mirror_id)
      .then(() => {
        setContentList((prev) => prev.filter((item) => item._id !== content_id))
        setFilteredList((prev) => prev.filter((item) => item._id !== content_id))
        setMessage(`"${content_title || 'Content'}" removed from this mirror.`)
        setTimeout(() => setMessage(''), 3500)
      })
      .catch((err) => {
        console.error("Error removing content from mirror:", err)
        alert("Failed to remove content from mirror. Please try again.")
      })
  }

  const persistReorderedPlaylist = (newItems) => {
    setContentList(newItems)
    setFilteredList(newItems)
    const orderedIds = newItems.map((item) => item._id)
    let login_key = getCookie('login_key') || 'adminpassword'
    UPDATE_MIRROR_PLAYLIST_ORDER(login_key, mirror_id, orderedIds)
      .then(() => {
        setMessage('Playlist sequence updated. Displays will follow the next live playback update.')
        setTimeout(() => setMessage(''), 3500)
      })
      .catch((err) => {
        console.error("Error updating playlist order:", err)
        alert("Failed to save playlist order. Please try again.")
      })
  }

  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    try {
      e.dataTransfer.setData('text/plain', String(index))
    } catch (err) {}
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e, targetIndex) => {
    e.preventDefault()
    setDragOverIndex(null)
    if (draggedIndex === null || draggedIndex === targetIndex) return

    const updated = [...contentlist]
    const [movedItem] = updated.splice(draggedIndex, 1)
    updated.splice(targetIndex, 0, movedItem)

    setDraggedIndex(null)
    persistReorderedPlaylist(updated)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleMoveUp = (index) => {
    if (index <= 0) return
    const updated = [...contentlist]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    persistReorderedPlaylist(updated)
  }

  const handleMoveDown = (index) => {
    if (index >= contentlist.length - 1) return
    const updated = [...contentlist]
    const temp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index + 1] = updated[index]
    updated[index] = temp
    persistReorderedPlaylist(updated)
  }

  const handleSelectVirtualSlide = (index, contentId, isAuto = false) => {
    let login_key = getCookie('login_key') || 'adminpassword'
    if (!mirror_id) return

    // Broadcast synchronization to mirror displays
    SYNC_CONNECTED_MIRRORS(login_key, mirror_id, index, contentId)
      .then(() => {
        if (!isAuto) {
          setMessage(`Broadcasting slide #${index + 1} to connected mirror(s).`)
          setTimeout(() => setMessage(''), 3000)
        }
      })
      .catch((err) => {
        console.error("Error setting slide:", err)
      })
  }

  const handleStartPresentation = () => {
    let login_key = getCookie('login_key') || 'adminpassword'
    if (!mirror_id) return
    CONTROL_PLAYBACK(login_key, mirror_id, 'play')
      .then(() => {
        setLiveStatus((prev) => ({
          ...prev,
          playback_state: 'playing'
        }))
        setMessage('Virtual mirror presentation started and live synced!')
        setTimeout(() => setMessage(''), 3500)
      })
      .catch((err) => {
        console.error("Error starting presentation:", err)
      })
  }

  useEffect(() => {
    fetchContents()
  }, [mirror_id])

  // Derive active slide index and content object for Virtual Screen preview (excluding disabled contents)
  const activeContents = contentlist.filter((c) => c.is_active !== false)

  const activeContentIndex = activeContents.findIndex((c) =>
    (liveStatus.active_content_id && String(c._id) === String(liveStatus.active_content_id))
  )

  const resolvedIndex = activeContentIndex >= 0
    ? activeContentIndex
    : (liveStatus.active_content_index !== undefined && liveStatus.active_content_index >= 0 && liveStatus.active_content_index < activeContents.length
        ? liveStatus.active_content_index
        : 0)

  const activeContent = activeContents.length > 0 ? activeContents[resolvedIndex] : null

  return (
    <div className='space-y-6'>
      {/* Top Header Card */}
      <div className='bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
        <div className='flex items-center gap-3 min-w-0'>
          <button
            onClick={() => navigate('/setup')}
            className='w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 flex items-center justify-center text-black transition-colors cursor-pointer shrink-0'
            title='Back to Setup'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M15 19l-7-7 7-7' />
            </svg>
          </button>
          <div className='min-w-0'>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 mb-0.5">
              <button onClick={() => navigate('/setup')} className="hover:text-black transition-colors cursor-pointer">Sites</button>
              <span>/</span>
              <button onClick={() => navigate('/setup')} className="hover:text-black transition-colors cursor-pointer">Mirrors</button>
              <span>/</span>
              <span className="text-black font-bold">Content Playlist</span>
            </div>
            <div className='flex items-center gap-2.5 flex-wrap'>
              <h2 className='text-lg sm:text-xl font-bold text-black tracking-tight truncate'>
                {liveStatus?.mirror_name ? `${liveStatus.mirror_name} Playlist Setup` : 'Mirror Playlist Setup'}
              </h2>
              {/* Online / Active status badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
                  liveStatus.is_active === false
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : liveStatus.playback_state === 'paused'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
                title={liveStatus.is_active === false ? 'This mirror is inactive and does not receive content updates' : liveStatus.playback_state === 'paused' ? 'Virtual Mirror playback is paused' : 'Default Virtual Mirror is connected and live'}
              >
                <span className="relative flex h-2 w-2">
                  {liveStatus.is_active !== false && liveStatus.playback_state !== 'paused' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    liveStatus.is_active === false ? 'bg-red-500' : liveStatus.playback_state === 'paused' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></span>
                </span>
                <span>
                  {liveStatus.is_active === false ? 'Mirror Inactive' : liveStatus.playback_state === 'paused' ? 'Connected (Paused)' : 'Connected (Live)'}
                </span>
              </div>
            </div>
            <p className='text-xs text-neutral-500 mt-0.5 line-clamp-1 sm:line-clamp-none'>
              Playback controls and playlist media sequence
            </p>
          </div>
        </div>

        <div className='flex items-stretch sm:items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto'>
          <button
            type='button'
            role='switch'
            aria-checked={liveStatus.is_active !== false}
            aria-label={liveStatus.is_active === false ? 'Reactivate this mirror' : 'Deactivate this mirror'}
            onClick={handleToggleMirrorStatus}
            disabled={updatingMirrorStatus}
            className='inline-flex items-center gap-2 px-3 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-800 whitespace-nowrap disabled:opacity-60'
            title='When inactive, this mirror stops playback and receives no new content updates.'
          >
            <span>{liveStatus.is_active === false ? 'Mirror Inactive' : 'Mirror Active'}</span>
            <span className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${liveStatus.is_active === false ? 'bg-neutral-300' : 'bg-black'}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${liveStatus.is_active === false ? 'translate-x-0.5' : 'translate-x-[18px]'}`} />
            </span>
          </button>

          {/* Pause / Play Toggle Button */}
          <button
            onClick={handleTogglePlayPause}
            disabled={controllingPlayback || liveStatus.is_active === false}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-medium rounded-xl shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60 ${
              liveStatus.playback_state === 'paused'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-300'
            }`}
            title={liveStatus.playback_state === 'paused' ? 'Resume presentation on connected mirror(s)' : 'Pause presentation on connected mirror(s)'}
          >
            {liveStatus.playback_state === 'paused' ? (
              <>
                <svg className='w-3.5 h-3.5 fill-current' viewBox='0 0 24 24'>
                  <path d='M8 5v14l11-7z' />
                </svg>
                <span>{controllingPlayback ? 'Resuming...' : 'Resume Play'}</span>
              </>
            ) : (
              <>
                <svg className='w-3.5 h-3.5 fill-current' viewBox='0 0 24 24'>
                  <path d='M6 19h4V5H6v14zm8-14v14h4V5h-4z' />
                </svg>
                <span>{controllingPlayback ? 'Pausing...' : 'Pause Mirror'}</span>
              </>
            )}
          </button>

          {/* Add Content to Mirror Button */}
          <button
            onClick={openModal}
            className='flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0'
            title='Upload images or videos directly to this mirror'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M12 4v16m8-8H4' />
            </svg>
            <span>Add Content</span>
          </button>
          <button
            type='button'
            onClick={handleDeleteMirror}
            className='inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0'
            title='Delete this mirror display'
          >
            <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6' />
            </svg>
            <span>Delete Mirror</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {message && (
        <div className='p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fadeIn'>
          <svg className='w-4 h-4 text-emerald-600 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M5 13l4 4L19 7' />
          </svg>
          <span>{message}</span>
        </div>
      )}

      {/* Live Mirror Stream URL Banner */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0 shadow-xs">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Mirror Display Stream URL
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                Live Viewer URL • mirror.bigburry.com
              </span>
            </div>
            <p className="text-xs text-neutral-500 truncate mt-0.5">
              Open this live URL on any smart TV, remote monitor, or browser to connect and stream this display.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex-1 md:w-80 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-xs text-neutral-800 truncate select-all">
            {mirrorViewerUrl}
          </div>
          <button
            onClick={handleCopyUrl}
            className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0 flex items-center gap-1.5"
            title="Copy Stream URL"
          >
            {copiedUrl ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
            title="Launch viewer in new browser tab"
          >
            <span>Launch Screen</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Two Column Layout: Virtual Screen (Left) and Playlist Sequence (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Virtual Screen Showcase - Adapts layout to mirror portrait/landscape dimensions */}
        <div className={`lg:sticky lg:top-4 ${
          Number(liveStatus?.mirror_height) > Number(liveStatus?.mirror_width)
            ? 'lg:col-span-5 xl:col-span-4'
            : 'lg:col-span-5 xl:col-span-5'
        }`}>
          <VirtualScreen
            mirror={liveStatus}
            activeContent={activeContent}
            contentList={activeContents}
            currentIndex={resolvedIndex}
            playbackState={liveStatus.playback_state}
            isOnline={true}
            onSelectSlide={handleSelectVirtualSlide}
            onStartPresentation={handleStartPresentation}
          />
        </div>

        {/* Playlist Sequence and Controls */}
        <div className={`space-y-4 ${
          Number(liveStatus?.mirror_height) > Number(liveStatus?.mirror_width)
            ? 'lg:col-span-7 xl:col-span-8'
            : 'lg:col-span-7 xl:col-span-7'
        }`}>
          {/* Search & Filter */}
          <div className='flex items-center justify-between gap-4 flex-wrap bg-white p-3.5 rounded-2xl border border-neutral-200/90 shadow-2xs'>
            <SearchBar data={contentlist} setSearch={setFilteredList} placeholder='Search assigned media...' />
            <span className='text-xs font-semibold text-neutral-500'>
              {filteredList.length} item{filteredList.length !== 1 ? 's' : ''} in playlist
            </span>
          </div>

          {/* Media Playlist List */}
          <div>
            {loading ? (
              <div className='p-12 text-center text-neutral-400 bg-white rounded-2xl border border-neutral-200'>
                Loading mirror contents...
              </div>
            ) : filteredList.length === 0 ? (
              <div className='p-12 bg-white rounded-2xl border border-dashed border-neutral-300 text-center flex flex-col items-center justify-center'>
                <div className='w-12 h-12 rounded-xl bg-neutral-100 text-black flex items-center justify-center mb-3'>
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' />
                  </svg>
                </div>
                <h4 className='text-sm font-bold text-black mb-1'>No Content for this Mirror</h4>
                <p className='text-xs text-neutral-500 max-w-sm mb-4'>
                  This mirror's playlist is currently empty. Upload photos or videos to start broadcasting.
                </p>
                <button
                  onClick={openModal}
                  className='px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-2'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M12 4v16m8-8H4' />
                  </svg>
                  <span>Add Content to this Mirror</span>
                </button>
              </div>
            ) : (
              <div className='space-y-3'>
                <div className='flex items-center justify-between text-xs text-neutral-500 px-1'>
                  <span className='flex items-center gap-1.5'>
                    <svg className='w-4 h-4 text-black shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4' />
                    </svg>
                    <span>Drag and drop cards or use <strong>▲ / ▼</strong> to adjust order. Click an item to view on virtual screen.</span>
                  </span>
                </div>

                <div className='space-y-2'>
                  {filteredList.map((data, index) => (
                    <div
                      key={data._id || index}
                      onClick={() => handleSelectVirtualSlide(index, data._id)}
                      className="cursor-pointer"
                      title="Click to sync and display on virtual screen"
                    >
                      <Listitem
                        order={index + 1}
                        isDraggable={true}
                        isDragging={draggedIndex === index}
                        isDragOver={dragOverIndex === index}
                        isActive={data.is_active !== false}
                        duration={data.duration || photoSpeed}
                        onUpdateDuration={data.content_format?.toLowerCase() !== 'mp4' ? (dur) => handleUpdateItemDuration(data._id, dur, data.content_title) : null}
                        onToggleActive={() => handleToggleActive(data._id, data.is_active !== false, data.content_title)}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        onMoveUp={() => handleMoveUp(index)}
                        onMoveDown={() => handleMoveDown(index)}
                        canMoveUp={index > 0}
                        canMoveDown={index < filteredList.length - 1}
                        title={data.content_title}
                        description={data.content_description || "Assigned media playlist item"}
                        onPlay={data._id}
                        onDelete={() => handleRemoveFromMirror(data._id, data.content_title)}
                        deleteLabel='Remove from Mirror'
                        badge={data.content_format?.toUpperCase() || 'MEDIA'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Content to Mirror Modal */}
      <AddContentModal
        isOpen={isModalOpen}
        onClose={closeModal}
        mirrorId={mirror_id}
        mirrorName={liveStatus?.mirror_name || 'Mirror Display'}
        mirrorWidth={liveStatus?.mirror_width || 1920}
        mirrorHeight={liveStatus?.mirror_height || 1080}
        onContentAdded={(newTitle) => {
          fetchContents()
          setMessage(`Added "${newTitle || 'Content'}" to mirror playlist.`)
          setTimeout(() => setMessage(''), 3500)
        }}
      />
    </div>
  )
}
