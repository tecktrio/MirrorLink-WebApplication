import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * AvailableMediaLibrary
 * 
 * Media library pool displaying user's images, videos, and menus with category tabs,
 * search, and 1-click timeline insert.
 */
export default function AvailableMediaLibrary({
  contents = [],
  loading = false,
  assignedIds = new Set(),
  onAddContent,
  onRefreshLibrary
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all' | 'images' | 'videos' | 'menus'
  const navigate = useNavigate()

  const filteredItems = contents.filter((item) => {
    const titleMatch = (item.content_title || '').toLowerCase().includes(searchQuery.toLowerCase())
    if (!titleMatch) return false

    const fmt = String(item.content_format || '').toLowerCase()
    if (filterType === 'images') {
      return fmt.includes('jpg') || fmt.includes('jpeg') || fmt.includes('png') || fmt.includes('webp') || fmt.includes('image')
    }
    if (filterType === 'videos') {
      return fmt.includes('mp4') || fmt.includes('mov') || fmt.includes('webm') || fmt.includes('video')
    }
    if (filterType === 'menus') {
      return fmt.includes('menu') || item.is_menu
    }
    return true
  })

  const isVideo = (item) => {
    const fmt = String(item.content_format || '').toLowerCase()
    return fmt.includes('mp4') || fmt.includes('mov') || fmt.includes('webm') || fmt.includes('video')
  }

  const handleDragStart = (e, item) => {
    try {
      window.__mirrorlink_dragged_media = item
      const payload = JSON.stringify({ contentId: item._id, title: item.content_title, isLibraryItem: true })
      e.dataTransfer.setData('application/json', payload)
      e.dataTransfer.setData('text/plain', payload)
      e.dataTransfer.effectAllowed = 'copy'
    } catch (_) {}
  }

  const handleDragEnd = () => {
    window.__mirrorlink_dragged_media = null
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden flex flex-col h-full font-['Uber_Move_Text']">
      {/* Media Bin Header */}
      <div className="p-2.5 px-3 border-b border-neutral-200 bg-neutral-50/80 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <svg className="w-3.5 h-3.5 fill-none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-black font-['Uber_Move']">
                Available Content Library
              </h3>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-neutral-200 text-neutral-700">
                {contents.length} {contents.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-[10px] text-neutral-500">
              Drag or click media to insert onto timeline.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => navigate('/manage_contents')}
            className="px-2.5 py-1 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
            title="Upload new image, video, or menu to your library"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Upload Media</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="p-2 px-3 border-b border-neutral-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-white">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search media library by title..."
            className="w-full pl-7 pr-3 py-1 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-black outline-none focus:border-black focus:bg-white transition-all"
          />
          <svg className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-0.5 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 shrink-0 self-start sm:self-auto">
          {[
            ['all', 'All'],
            ['images', 'Images'],
            ['videos', 'Videos'],
            ['menus', 'Menus']
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterType(key)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                filterType === key
                  ? 'bg-white text-black shadow-2xs font-extrabold'
                  : 'text-neutral-500 hover:text-black'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Media Cards Grid Container */}
      <div className="p-2 overflow-y-auto max-h-[210px] min-h-[140px] flex-1 scrollbar-thin scrollbar-thumb-neutral-200">
        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
            <span>Loading library items...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-2 border border-dashed border-neutral-200 rounded-xl my-4">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-lg">
              📁
            </div>
            <span className="font-semibold text-neutral-600">
              {searchQuery ? 'No matching media found' : 'Your media library is empty'}
            </span>
            <p className="text-[11px] text-neutral-400 max-w-xs">
              {searchQuery ? 'Try a different search query or filter.' : 'Upload photos, videos, or create menus to start sequencing.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {filteredItems.map((item) => {
              const isAssigned = assignedIds.has(String(item._id))
              const video = isVideo(item)
              const format = (item.content_format || 'MEDIA').toUpperCase()

              return (
                <div
                  key={item._id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onAddContent && onAddContent(item)}
                  className="group relative w-full aspect-video bg-neutral-900 rounded-lg sm:rounded-xl border border-neutral-200 hover:border-black hover:ring-2 hover:ring-black/20 hover:shadow-xs transition-all duration-150 overflow-hidden cursor-pointer select-none flex items-center justify-center"
                  title={`${item.content_title || 'Media'} (Click or drag to place on timeline)`}
                >
                  {/* Media Content */}
                  {video ? (
                    <div className="w-full h-full relative flex items-center justify-center bg-black">
                      <video src={item.content_url} className="w-full h-full object-cover pointer-events-none select-none" muted playsInline draggable={false} />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                        <div className="w-5 h-5 rounded-full bg-white/80 text-black flex items-center justify-center text-[8px] font-bold">
                          ▶
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.content_url}
                      alt={item.content_title || 'Media'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 pointer-events-none select-none"
                      draggable={false}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  )}

                  {/* Format Badge */}
                  <span className="absolute top-1 left-1 px-1 py-0.2 rounded text-[7px] sm:text-[8px] font-mono font-bold uppercase bg-black/75 text-white backdrop-blur-xs pointer-events-none">
                    {format}
                  </span>

                  {/* Assigned Indicator */}
                  {isAssigned && (
                    <span className="absolute top-1 right-1 px-1 py-0.2 rounded text-[7px] sm:text-[8px] font-bold bg-emerald-500 text-white shadow-2xs pointer-events-none">
                      <span className="hidden sm:inline">In Timeline</span>
                      <span className="sm:hidden">✓</span>
                    </span>
                  )}

                  {/* Quick hover add hint */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white text-black flex items-center justify-center font-black text-xs shadow-md">
                      +
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
