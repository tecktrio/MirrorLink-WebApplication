import React, { useState, useRef, useEffect } from 'react'

/**
 * TimelineEditor
 * 
 * Video / Presentation sequencer timeline editor for digital signage content playlists.
 * Clean, light-themed editor featuring timecode ruler, live playhead scrubber needle,
 * track header (V1), clip duration controls, reordering, and in-between "+" insert drop zones.
 */
export default function TimelineEditor({
  items = [],
  defaultDuration = 5,
  liveIndex = 0,
  resolvedIndex = 0,
  playbackState = 'playing',
  isPlaying = false,
  transitions = [],
  onUpdateTransition,
  onTogglePlayPause,
  onRewind,
  onSelectSlide,
  onInsertAt,
  onUpdateDuration,
  onRemoveItem,
  onReorder,
  onDropLibraryItem
}) {
  const [selectedClipId, setSelectedClipId] = useState(null)
  const [draggedIdx, setDraggedIdx] = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)
  const [activeTransitionPopover, setActiveTransitionPopover] = useState(null)
  const timelineScrollRef = useRef(null)
  const popoverRef = useRef(null)

  const TRANSITION_OPTIONS = [
    { id: 'none', label: 'None (Cut)', icon: '✕', desc: 'Instant cut' },
    { id: 'fade', label: 'Fade', icon: '✨', desc: 'Smooth crossfade' },
    { id: 'slide', label: 'Slide', icon: '⇄', desc: 'Slide push' },
    { id: 'zoom', label: 'Zoom', icon: '⤢', desc: 'Zoom dissolve' }
  ]

  // Close transition popover when clicking outside or scrolling
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setActiveTransitionPopover(null)
      }
    }
    const handleScroll = () => {
      setActiveTransitionPopover(null)
    }
    const scrollEl = timelineScrollRef.current
    if (activeTransitionPopover) {
      document.addEventListener('mousedown', handleOutsideClick)
      window.addEventListener('scroll', handleScroll, { passive: true })
      if (scrollEl) scrollEl.addEventListener('scroll', handleScroll, { passive: true })
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('scroll', handleScroll)
      if (scrollEl) scrollEl.removeEventListener('scroll', handleScroll)
    }
  }, [activeTransitionPopover])

  // Calculate cumulative timestamps for the time ruler
  const timelineSchedule = items.map((item, index) => {
    const dur = Number(item.duration) || Number(defaultDuration) || 5
    return { ...item, computedDuration: dur }
  })

  // Total runtime in seconds
  const totalRuntime = timelineSchedule.reduce((acc, curr) => acc + curr.computedDuration, 0)

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Pre-calculate start and end time for each clip
  let accumulatedTime = 0
  const clipsWithTime = timelineSchedule.map((clip) => {
    const startTime = accumulatedTime
    accumulatedTime += clip.computedDuration
    return {
      ...clip,
      startTime,
      endTime: accumulatedTime
    }
  })

  // Resolve currently selected clip (only when explicitly selected by user)
  const selectedClip = selectedClipId ? (items.find((c) => String(c._id) === String(selectedClipId)) || null) : null
  const selectedClipIndex = selectedClip ? items.findIndex((c) => String(c._id) === String(selectedClip._id)) : -1

  // Current playhead elapsed time
  const currentElapsed = clipsWithTime[resolvedIndex]?.startTime || 0

  // Auto-scroll timeline to active slide when it changes
  useEffect(() => {
    if (timelineScrollRef.current && resolvedIndex >= 0) {
      const activeElement = timelineScrollRef.current.querySelector(`[data-clip-index="${resolvedIndex}"]`)
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [resolvedIndex])

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIdx(index)
    e.dataTransfer.effectAllowed = 'move'
    try {
      e.dataTransfer.setData('text/plain', String(index))
    } catch (_) {}
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    if (dragOverIdx !== index) {
      setDragOverIdx(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIdx(null)
  }

  const handleDrop = (e, targetIndex) => {
    e.preventDefault()
    e.stopPropagation()

    // 1. Check if dropped from available library
    let libraryPayload = null
    try {
      const rawJson = e.dataTransfer.getData('application/json')
      const rawText = e.dataTransfer.getData('text/plain')
      const raw = rawJson || rawText
      if (raw) {
        libraryPayload = JSON.parse(raw)
      }
    } catch (_) {}

    // Fallback: window global set during dragstart in same browser window
    if (!libraryPayload?.contentId && window.__mirrorlink_dragged_media) {
      libraryPayload = {
        contentId: window.__mirrorlink_dragged_media._id,
        title: window.__mirrorlink_dragged_media.content_title
      }
    }

    if (libraryPayload?.contentId && onDropLibraryItem) {
      const pos = typeof targetIndex === 'number' ? targetIndex : items.length
      onDropLibraryItem(libraryPayload, pos)
      window.__mirrorlink_dragged_media = null
      setDraggedIdx(null)
      setDragOverIdx(null)
      return
    }

    // 2. Internal timeline reorder
    if (draggedIdx === null || draggedIdx === targetIndex) {
      setDraggedIdx(null)
      setDragOverIdx(null)
      return
    }

    const updated = [...items]
    const [moved] = updated.splice(draggedIdx, 1)
    const finalTarget = typeof targetIndex === 'number' ? targetIndex : updated.length
    updated.splice(finalTarget, 0, moved)

    setDraggedIdx(null)
    setDragOverIdx(null)
    if (onReorder) {
      onReorder(updated)
    }
  }

  const handleDragEnd = () => {
    setDraggedIdx(null)
    setDragOverIdx(null)
  }

  const handleShift = (fromIndex, direction) => {
    const toIndex = fromIndex + direction
    if (toIndex < 0 || toIndex >= items.length) return
    const updated = [...items]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    if (onReorder) {
      onReorder(updated)
    }
  }

  // Time ruler ticks generation (every 5 seconds up to totalRuntime + 10s)
  const rulerTicks = []
  const maxTime = Math.max(totalRuntime + 5, 30)
  for (let t = 0; t <= maxTime; t += 5) {
    rulerTicks.push(t)
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs font-['Uber_Move_Text']">
      {/* Empty State */}
      {items.length === 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
            setDragOverIdx('empty')
          }}
          onDragLeave={() => setDragOverIdx(null)}
          onDrop={(e) => handleDrop(e, 0)}
          className={`p-8 text-center flex flex-col items-center justify-center transition-all ${
            dragOverIdx === 'empty' ? 'bg-neutral-100 border-2 border-dashed border-black' : ''
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-neutral-100 text-black flex items-center justify-center mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h4 className="text-sm font-bold text-black mb-0.5 font-['Uber_Move']">Empty Timeline</h4>
          <p className="text-xs text-neutral-500 max-w-sm mb-3">
            Drag media from the Available Library or click below to start sequencing.
          </p>
          <button
            onClick={() => onInsertAt && onInsertAt(0)}
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Insert First Content</span>
          </button>
        </div>
      ) : (
        <div className="p-2 sm:p-2.5 space-y-2">
          {/* Selected Clip Operations Inspector Bar */}
          {selectedClip && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-2 px-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 shadow-2xs">
              {/* Selected Clip Info */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-neutral-200 shadow-2xs flex items-center justify-center">
                  {selectedClip.content_format?.toLowerCase() === 'mp4' ? (
                    <div className="w-full h-full flex items-center justify-center text-white text-[10px] bg-black">▶</div>
                  ) : (
                    <img src={selectedClip.content_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-black text-white">
                      Selected #{selectedClipIndex + 1}
                    </span>
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-full bg-neutral-200 text-neutral-700">
                      {selectedClip.content_format?.toUpperCase() || 'MEDIA'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-black truncate max-w-xs sm:max-w-md mt-0.5" title={selectedClip.content_title}>
                    {selectedClip.content_title || `Slide ${selectedClipIndex + 1}`}
                  </p>
                </div>
              </div>

              {/* Operations: Duration Controls, Reorder & Delete */}
              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
                {/* Duration Stepper & Quick Presets */}
                {selectedClip.content_format?.toLowerCase() !== 'mp4' ? (
                  <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-lg p-0.5 shadow-2xs text-xs">
                    <span className="text-[10px] font-bold text-neutral-500 pl-1.5 pr-0.5">Duration:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const current = Number(selectedClip.duration) || defaultDuration
                        const next = Math.max(1, current - 1)
                        onUpdateDuration && onUpdateDuration(selectedClip._id, next, selectedClip.content_title)
                      }}
                      className="w-6 h-6 rounded bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                      title="Decrease duration by 1 second"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-black px-1 min-w-[28px] text-center text-[11px]">
                      {Number(selectedClip.duration) || defaultDuration}s
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const current = Number(selectedClip.duration) || defaultDuration
                        const next = current + 1
                        onUpdateDuration && onUpdateDuration(selectedClip._id, next, selectedClip.content_title)
                      }}
                      className="w-6 h-6 rounded bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                      title="Increase duration by 1 second"
                    >
                      +
                    </button>

                    {/* Quick Presets */}
                    <div className="hidden sm:flex items-center gap-0.5 pl-1 border-l border-neutral-100">
                      {[2, 5, 10, 15, 30].map((preset) => {
                        const currentDur = Number(selectedClip.duration) || defaultDuration
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => onUpdateDuration && onUpdateDuration(selectedClip._id, preset, selectedClip.content_title)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              currentDur === preset
                                ? 'bg-black text-white shadow-2xs'
                                : 'text-neutral-500 hover:bg-neutral-100'
                            }`}
                          >
                            {preset}s
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="px-2.5 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-600 shadow-2xs flex items-center gap-1">
                    <span>🎬 Video Duration (Auto)</span>
                  </div>
                )}

                {/* Shift Reorder */}
                <div className="flex items-center gap-0.5 bg-white border border-neutral-200 rounded-lg p-0.5 shadow-2xs">
                  <button
                    type="button"
                    disabled={selectedClipIndex <= 0}
                    onClick={() => handleShift(selectedClipIndex, -1)}
                    className="px-2 py-0.5 rounded hover:bg-neutral-100 text-neutral-600 hover:text-black font-semibold text-[11px] flex items-center gap-0.5 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Move earlier in timeline"
                  >
                    <span>◀ Move</span>
                  </button>
                  <button
                    type="button"
                    disabled={selectedClipIndex >= items.length - 1}
                    onClick={() => handleShift(selectedClipIndex, 1)}
                    className="px-2 py-0.5 rounded hover:bg-neutral-100 text-neutral-600 hover:text-black font-semibold text-[11px] flex items-center gap-0.5 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Move later in timeline"
                  >
                    <span>Move ▶</span>
                  </button>
                </div>

                {/* Delete from Timeline Button */}
                <button
                  type="button"
                  onClick={() => {
                    onRemoveItem && onRemoveItem(selectedClip._id, selectedClip.content_title)
                    setSelectedClipId(null)
                  }}
                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  title="Delete this selected clip from timeline"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete Clip</span>
                </button>

                {/* Close/Deselect Button */}
                <button
                  type="button"
                  onClick={() => setSelectedClipId(null)}
                  className="w-6 h-6 rounded-lg hover:bg-neutral-200/70 text-neutral-400 hover:text-black flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
                  title="Deselect clip"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Timecode Ruler */}
          <div className="bg-neutral-100 border border-neutral-200 rounded-t-xl px-4 py-1.5 overflow-hidden select-none relative">
            <div className="flex items-center justify-between font-mono text-[9px] text-neutral-500 tracking-wider">
              {rulerTicks.map((tick) => (
                <div key={tick} className="flex flex-col items-center">
                  <span>{formatTime(tick)}</span>
                  <div className="h-1.5 w-px bg-neutral-300 mt-0.5" />
                </div>
              ))}
            </div>

            {/* Live Playhead Needle Scrubber */}
            <div
              style={{
                left: `${Math.min(100, Math.max(0, (currentElapsed / Math.max(totalRuntime, 1)) * 100))}%`
              }}
              className="absolute top-0 bottom-0 pointer-events-none transition-all duration-300 z-20 flex flex-col items-center"
            >
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-red-600" />
              <div className="w-0.5 h-full bg-red-600 shadow-sm" />
            </div>
          </div>

          {/* Horizontal Multitrack Container */}
          <div className="flex border border-t-0 border-neutral-200 rounded-b-xl overflow-hidden bg-neutral-50/50">
            {/* Left Track Header (V1 Video Track) */}
            <div className="w-20 sm:w-24 shrink-0 bg-neutral-100 border-r border-neutral-200 p-2 flex flex-col justify-between select-none">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="px-1.5 py-0.5 bg-black text-white font-mono font-black text-[9px] rounded">
                    V1
                  </span>
                  <div className="flex items-center gap-1 text-neutral-400">
                    <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                  </div>
                </div>
                <p className="text-[9px] font-bold text-neutral-600 truncate">
                  Media Track
                </p>
              </div>

              <div className="text-[8px] font-mono text-neutral-400">
                1080p
              </div>
            </div>

            {/* Horizontal Timeline Track Container */}
            <div
              ref={timelineScrollRef}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'copy'
              }}
              onDrop={(e) => {
                // If dropped on track background outside specific clips, append to end
                if (e.target === e.currentTarget || e.target.classList?.contains('min-w-full')) {
                  handleDrop(e, items.length)
                }
              }}
              className="flex-1 overflow-x-auto pb-4 pt-3 px-3 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100"
            >
              <div className="inline-flex items-center min-w-full py-2">
                {/* Beginning Insertion Button (+ before index 0) */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    e.dataTransfer.dropEffect = 'copy'
                    setDragOverIdx('insert-0')
                  }}
                  onDragLeave={() => setDragOverIdx(null)}
                  onDrop={(e) => {
                    e.stopPropagation()
                    handleDrop(e, 0)
                  }}
                  className="relative group shrink-0 flex items-center justify-center px-1"
                >
                  <button
                    type="button"
                    onClick={() => onInsertAt && onInsertAt(0)}
                    className={`w-7 h-7 rounded-full border-2 border-dashed transition-all flex items-center justify-center shadow-2xs cursor-pointer z-10 ${
                      dragOverIdx === 'insert-0'
                        ? 'border-black bg-black text-white scale-125'
                        : 'border-neutral-300 group-hover:border-black bg-white group-hover:bg-black text-neutral-400 group-hover:text-white hover:scale-110'
                    }`}
                    title="Insert content at beginning of timeline"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Sequence of Clips with In-Between '+' Insert Buttons */}
                {clipsWithTime.map((clip, index) => {
                  const isSelected = selectedClip && String(clip._id) === String(selectedClip._id)
                  const isResolved = index === resolvedIndex
                  const isDragOver = dragOverIdx === index
                  const isDragging = draggedIdx === index
                  const isMp4 = clip.content_format?.toLowerCase() === 'mp4'

                  return (
                    <React.Fragment key={clip._id || index}>
                      {/* Timeline Clip Card - Only keep the content */}
                      <div
                        data-clip-index={index}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleDragOver(e, index)
                        }}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => {
                          e.stopPropagation()
                          handleDrop(e, index)
                        }}
                        onDragEnd={handleDragEnd}
                        onClick={() => {
                          const nextId = selectedClipId === clip._id ? null : clip._id
                          setSelectedClipId(nextId)
                          if (onSelectSlide) {
                            onSelectSlide(index, clip._id)
                          }
                        }}
                        className={`relative shrink-0 w-36 sm:w-44 h-24 rounded-xl border-2 transition-all duration-200 select-none cursor-pointer overflow-hidden shadow-2xs bg-black ${
                          isSelected
                            ? 'ring-3 ring-black border-black shadow-md scale-102 z-10'
                            : isResolved
                              ? 'ring-2 ring-emerald-500 border-emerald-500'
                              : 'border-neutral-200 hover:border-neutral-400'
                        } ${
                          isDragOver ? 'border-dashed border-black scale-105 ring-4 ring-black/20' : ''
                        } ${isDragging ? 'opacity-40' : ''}`}
                        title={clip.content_title || `Clip #${index + 1}`}
                      >
                        {/* Pure Content Only */}
                        {isMp4 ? (
                          <div className="w-full h-full relative flex items-center justify-center bg-black pointer-events-none">
                            <video
                              src={clip.content_url}
                              className="w-full h-full object-cover pointer-events-none"
                              muted
                              playsInline
                              draggable={false}
                            />
                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center pointer-events-none">
                              <div className="w-7 h-7 rounded-full bg-white/90 text-black flex items-center justify-center shadow-xs text-xs">
                                ▶
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={clip.content_url}
                            alt=""
                            className="w-full h-full object-cover pointer-events-none"
                            draggable={false}
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                        )}
                      </div>

                      {/* IN-BETWEEN TRANSITION & INSERT ZONE */}
                      {(() => {
                        const hasNext = index < clipsWithTime.length - 1
                        const nextClip = hasNext ? clipsWithTime[index + 1] : clipsWithTime[0]
                        const matchedTrans = nextClip ? (transitions || []).find(
                          (t) => String(t.left_content_id) === String(clip._id) && String(t.right_content_id) === String(nextClip._id)
                        ) : null
                        const activeTransId = matchedTrans ? matchedTrans.transition_id : 'none'
                        const isPopoverOpen = activeTransitionPopover && activeTransitionPopover.index === index

                        return (
                          <div
                            onDragOver={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              e.dataTransfer.dropEffect = 'copy'
                              setDragOverIdx(`insert-${index + 1}`)
                            }}
                            onDragLeave={() => setDragOverIdx(null)}
                            onDrop={(e) => {
                              e.stopPropagation()
                              handleDrop(e, index + 1)
                            }}
                            className="relative shrink-0 flex items-center justify-center px-1"
                          >
                            {/* Transition / Insert Button */}
                            {activeTransId !== 'none' ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (isPopoverOpen) {
                                    setActiveTransitionPopover(null)
                                  } else {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    setActiveTransitionPopover({
                                      index,
                                      leftId: clip._id,
                                      rightId: nextClip._id,
                                      activeTransId,
                                      x: rect.left + rect.width / 2,
                                      y: rect.top,
                                      openUpwards: rect.top > 250
                                    })
                                  }
                                }}
                                className={`h-6 px-2 rounded-full border transition-all flex items-center gap-1 shadow-2xs cursor-pointer z-10 text-[10px] font-bold ${
                                  isPopoverOpen
                                    ? 'bg-black text-white border-black scale-105 ring-2 ring-black/20'
                                    : 'bg-black text-white border-black hover:bg-neutral-800'
                                }`}
                                title={`Transition: ${activeTransId.toUpperCase()} (${hasNext ? 'Next Slide' : 'Loop to Start'}). Click to change.`}
                              >
                                {activeTransId === 'fade' && <span>✨ Fade</span>}
                                {activeTransId === 'slide' && <span>⇄ Slide</span>}
                                {activeTransId === 'zoom' && <span>⤢ Zoom</span>}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (isPopoverOpen) {
                                    setActiveTransitionPopover(null)
                                  } else {
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    setActiveTransitionPopover({
                                      index,
                                      leftId: clip._id,
                                      rightId: nextClip ? nextClip._id : null,
                                      activeTransId: 'none',
                                      x: rect.left + rect.width / 2,
                                      y: rect.top,
                                      openUpwards: rect.top > 250
                                    })
                                  }
                                }}
                                className={`w-6 h-6 rounded-full border-2 border-dashed transition-all flex items-center justify-center shadow-2xs cursor-pointer z-10 ${
                                  dragOverIdx === `insert-${index + 1}`
                                    ? 'border-black bg-black text-white scale-125'
                                    : isPopoverOpen
                                      ? 'border-black bg-black text-white'
                                      : 'border-neutral-300 hover:border-black bg-white hover:bg-black text-neutral-400 hover:text-white hover:scale-110'
                                }`}
                                title="Click to choose transition effect"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )
                      })()}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Transition Selection Popover (Fixed, Never Clipped) */}
      {activeTransitionPopover && (
        <div
          ref={popoverRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: `${activeTransitionPopover.x}px`,
            top: activeTransitionPopover.openUpwards
              ? `${activeTransitionPopover.y - 8}px`
              : `${activeTransitionPopover.y + 30}px`,
            transform: activeTransitionPopover.openUpwards
              ? 'translate(-50%, -100%)'
              : 'translate(-50%, 0)',
            zIndex: 99999
          }}
          className="w-56 bg-white border border-neutral-300 rounded-2xl shadow-2xl p-2.5 font-['Uber_Move_Text'] animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100">
            <div>
              <h5 className="text-xs font-bold text-black font-['Uber_Move']">Choose Transition</h5>
              <p className="text-[10px] text-neutral-500">Visual effect between slides</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTransitionPopover(null)}
              className="w-5 h-5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-black text-xs font-bold flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1">
            {TRANSITION_OPTIONS.map((opt) => {
              const isCurrent =
                activeTransitionPopover.activeTransId === opt.id ||
                (opt.id === 'none' &&
                  (!activeTransitionPopover.activeTransId ||
                    activeTransitionPopover.activeTransId === 'none'))
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    if (
                      onUpdateTransition &&
                      activeTransitionPopover.leftId &&
                      activeTransitionPopover.rightId
                    ) {
                      onUpdateTransition(
                        activeTransitionPopover.leftId,
                        activeTransitionPopover.rightId,
                        opt.id
                      )
                    }
                    setActiveTransitionPopover(null)
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                    isCurrent
                      ? 'bg-black text-white font-bold shadow-xs'
                      : 'hover:bg-neutral-100 text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{opt.icon}</span>
                    <div>
                      <p className="font-bold leading-none">{opt.label}</p>
                      <p
                        className={`text-[10px] mt-0.5 leading-none ${
                          isCurrent ? 'text-neutral-300' : 'text-neutral-400'
                        }`}
                      >
                        {opt.desc}
                      </p>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="text-xs text-emerald-400 font-mono font-bold">✓</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
