import React from 'react'

export default function Loadinpage() {
  return (
    <div className='min-h-screen bg-[#f6f6f6] flex flex-col items-center justify-center p-6 gap-4'>
      <div className='w-12 h-12 border-4 border-neutral-300 border-t-black rounded-full animate-spin shadow-2xs'></div>
      <p className='text-sm font-semibold text-black animate-pulse'>
        Loading MirrorLink Console...
      </p>
    </div>
  )
}
