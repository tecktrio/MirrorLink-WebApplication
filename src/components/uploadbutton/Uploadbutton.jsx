import React, { useRef, useState } from 'react'

export default function Uploadbutton({ label = 'Upload Content', update, accept = '.mp4,.jpg,.jpeg,.png' }) {
  const fileInputRef = useRef(null)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFileName(e.target.files[0].name)
      if (update) update(e)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setSelectedFileName(file.name)
      if (fileInputRef.current) {
        fileInputRef.current.files = e.dataTransfer.files
      }
      if (update) {
        update({ target: { files: e.dataTransfer.files } })
      }
    }
  }

  return (
    <div className='w-full my-3'>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 ${isDragging ? 'border-black bg-neutral-100' : 'border-neutral-300 hover:border-black bg-neutral-50 hover:bg-neutral-100/70'}`}
      >
        <input
          ref={fileInputRef}
          type='file'
          accept={accept}
          onChange={handleChange}
          className='hidden'
        />

        <div className='w-12 h-12 rounded-full bg-neutral-200 text-black flex items-center justify-center mb-3'>
          <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
          </svg>
        </div>

        {selectedFileName ? (
          <div>
            <p className='text-sm font-semibold text-black underline underline-offset-2'>{selectedFileName}</p>
            <p className='text-xs text-neutral-500 mt-1'>Click or drag another file to replace</p>
          </div>
        ) : (
          <div>
            <p className='text-sm font-semibold text-neutral-800'>
              <span className='text-black font-bold underline underline-offset-2'>Click to choose file</span> or drag & drop
            </p>
            <p className='text-xs text-neutral-500 mt-1'>Supports MP4 video, JPG, PNG images</p>
          </div>
        )}
      </div>
    </div>
  )
}
