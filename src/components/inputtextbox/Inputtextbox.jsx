import React from 'react'

export default function Inputtextbox({
  label,
  description,
  placeholder,
  updatedata,
  icon,
  type = 'text',
  required = false,
  value,
  className = ''
}) {
  const inputId = label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'textinput'

  return (
    <div className={`w-full ${className}`}>
      <div className='py-2'>
        <div className='flex items-center justify-between mb-1'>
          <label htmlFor={inputId} className='text-xs sm:text-sm font-semibold text-neutral-900 flex items-center gap-1.5'>
            {icon && <img src={icon} alt="" className="w-4 h-4 object-contain opacity-70" />}
            <span>{label}</span>
            {required && <span className='text-red-500 font-bold'>*</span>}
          </label>
        </div>

        {description && (
          <p className='text-xs text-neutral-500 mb-2 leading-relaxed'>{description}</p>
        )}

        <div className='relative'>
          <input
            type={type}
            id={inputId}
            className='w-full px-4 py-2.5 bg-neutral-50/60 hover:bg-white border border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-400 text-xs sm:text-sm focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all duration-150 shadow-2xs'
            placeholder={placeholder}
            value={value !== undefined ? value : ''}
            onChange={(e) => {
              if (updatedata) updatedata(e.target.value)
            }}
            onKeyUp={(e) => {
              if (updatedata) updatedata(e.target.value)
            }}
            required={required}
          />
        </div>
      </div>
    </div>
  )
}
