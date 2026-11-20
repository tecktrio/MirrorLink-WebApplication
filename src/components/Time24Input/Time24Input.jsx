import React from 'react'

/**
 * 24-Hour Time Input Component
 * Replaces browser-dependent native <input type="time"> (which defaults to 12-hour AM/PM on US/Mac Chrome)
 * Provides clean 24-hour HH:MM selection with synchronized custom picker and human-readable label.
 */
export default function Time24Input({ value = '00:00', onChange, label, className = '' }) {
  // Parse incoming value "HH:MM"
  let [hStr = '00', mStr = '00'] = (value || '00:00').split(':')
  let currentHour = parseInt(hStr, 10)
  if (isNaN(currentHour) || currentHour < 0 || currentHour > 23) currentHour = 0
  let currentMinute = parseInt(mStr, 10)
  if (isNaN(currentMinute) || currentMinute < 0 || currentMinute > 59) currentMinute = 0

  const handleHourChange = (e) => {
    const newHour = parseInt(e.target.value, 10)
    const formatted = `${String(newHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`
    onChange?.(formatted)
  }

  const handleMinuteChange = (e) => {
    const newMinute = parseInt(e.target.value, 10)
    const formatted = `${String(currentHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`
    onChange?.(formatted)
  }

  // Quick human-friendly display label (e.g. "14:00 (02:00 PM)")
  const display12H = () => {
    const period = currentHour >= 12 ? 'PM' : 'AM'
    const h12 = currentHour % 12 === 0 ? 12 : currentHour % 12
    return `${String(h12).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')} ${period}`
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-semibold text-neutral-600 font-['Uber_Move_Text']">
            {label}
          </label>
          <span className="text-[10px] font-medium text-neutral-400">
            {display12H()}
          </span>
        </div>
      )}
      <div className="flex items-center gap-1.5 p-1 bg-white border border-neutral-300 rounded-xl focus-within:border-black transition-colors">
        {/* Hours Select: 00 to 23 */}
        <div className="flex-1 flex items-center justify-center">
          <select
            value={currentHour}
            onChange={handleHourChange}
            className="w-full bg-transparent text-center font-mono font-bold text-xs text-black outline-none cursor-pointer py-1"
            title="Hour (00 - 23)"
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <option key={i} value={i}>
                {String(i).padStart(2, '0')}
              </option>
            ))}
          </select>
          <span className="text-[9px] text-neutral-400 font-bold uppercase select-none mr-1">H</span>
        </div>

        <span className="text-neutral-400 font-bold text-xs select-none">:</span>

        {/* Minutes Select: 00 to 59 in 5-minute or 1-minute steps */}
        <div className="flex-1 flex items-center justify-center">
          <select
            value={currentMinute}
            onChange={handleMinuteChange}
            className="w-full bg-transparent text-center font-mono font-bold text-xs text-black outline-none cursor-pointer py-1"
            title="Minute (00 - 59)"
          >
            {Array.from({ length: 60 }).map((_, i) => (
              <option key={i} value={i}>
                {String(i).padStart(2, '0')}
              </option>
            ))}
          </select>
          <span className="text-[9px] text-neutral-400 font-bold uppercase select-none mr-1">M</span>
        </div>
      </div>
    </div>
  )
}

