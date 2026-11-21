import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Addbutton({
  label,
  goto,
  onClick,
  className = '',
  disabled = false,
  disabledTooltip = ''
}) {
  const navigate = useNavigate()

  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (onClick) onClick(e)
    else if (goto) navigate(goto)
  }

  const tooltipText = disabled ? (disabledTooltip || 'Plan limit reached. Upgrade your plan to create more.') : ''

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      title={tooltipText}
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-150 ${
        disabled
          ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed opacity-75 shadow-none border border-neutral-300 pointer-events-auto'
          : 'bg-black hover:bg-neutral-800 text-white shadow-xs hover:shadow-sm active:scale-[0.98] cursor-pointer'
      } ${className}`}
    >
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
      </svg>
      <span>{label}</span>
      {disabled && (
        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-neutral-300 text-neutral-700 ml-1">
          Limit reached
        </span>
      )}
    </button>
  )
}
