import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Addbutton({ label, goto, onClick, className = '' }) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) onClick()
    else if (goto) navigate(goto)
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-medium rounded-lg shadow-xs hover:shadow-sm active:scale-[0.98] transition-all duration-150 cursor-pointer ${className}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
      </svg>
      <span>{label}</span>
    </button>
  )
}
