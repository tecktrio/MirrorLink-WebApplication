import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Labelwithdescription({ label, description, icon, goto, className = '' }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => (goto ? navigate(goto) : '')}
      className={`my-2 ${goto ? 'cursor-pointer group' : ''} ${className}`}
    >
      <div className='flex items-center gap-2'>
        {icon && (
          <img src={icon} alt="" className="w-5 h-5 object-contain" />
        )}
        <h3 className='text-lg font-bold text-black tracking-tight group-hover:text-neutral-600 transition-colors'>
          {label}
        </h3>
      </div>
      {description && (
        <p className='text-xs text-neutral-500 mt-1 max-w-2xl leading-relaxed'>
          {description}
        </p>
      )}
    </div>
  )
}
