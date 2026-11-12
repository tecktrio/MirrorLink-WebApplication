import React, { useState } from 'react'

export default function SearchBar({ data = [], setSearch, placeholder = 'Search by name...' }) {
  const [keyword, setKeyword] = useState('')

  const handleSearch = (val) => {
    setKeyword(val)
    if (!val.trim()) {
      setSearch(data)
    } else {
      const lower = val.toLowerCase()
      const results = data.filter((item) => {
        const title = (item.content_title || item.mirror_name || item.site_name || '').toLowerCase()
        const desc = (item.content_description || item.mirror_description || item.site_description || '').toLowerCase()
        return title.includes(lower) || desc.includes(lower)
      })
      setSearch(results)
    }
  }

  const handleClear = () => {
    setKeyword('')
    setSearch(data)
  }

  return (
    <div className='relative w-full max-w-md'>
      <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
        </svg>
      </div>
      <input
        type='text'
        placeholder={placeholder}
        value={keyword}
        onChange={(e) => handleSearch(e.target.value)}
        className='w-full pl-10 pr-10 py-2.5 bg-neutral-50 hover:bg-white border border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-400 text-xs sm:text-sm focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all shadow-2xs'
      />
      {keyword && (
        <button
          onClick={handleClear}
          className='absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600'
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
          </svg>
        </button>
      )}
    </div>
  )
}
