import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Submitbutton({ text, goto, disabled, className = '' }) {
  const navigate = useNavigate()
  return (
    <div className='w-full'>
      {!disabled ? (
        <div onClick={() => { if (goto) navigate(goto) }}>
          <button
            type="submit"
            className={`w-full py-3 px-6 bg-black hover:bg-neutral-800 text-white font-medium text-sm sm:text-base rounded-lg shadow-xs hover:shadow-sm active:scale-[0.99] transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${className}`}
          >
            {text}
          </button>
        </div>
      ) : (
        <div>
          <button
            disabled
            type="button"
            className={`w-full py-3 px-6 bg-neutral-200 text-neutral-400 font-medium text-sm sm:text-base rounded-lg cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
          >
            {text}
          </button>
        </div>
      )}
    </div>
  )
}
