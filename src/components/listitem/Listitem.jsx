import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Listitem({title, description, goto, onDelete}) {
  const navigate = useNavigate()
  return (
    <div className='border  rounded-lg p-5 border-gray-400 m-2 cursor-pointer hover:shadow-md w-full' onClick={()=>navigate(goto)}>
      <div>
      <p className='text-gray-700 text-sm'>{title}</p>
        <p className='text-gray-500 text-xs'>{description}</p>
        
      </div>
      {onDelete?<div className='flex justify-end'><p onClick={onDelete} className='bg-red-500 text-white rounded-md px-3 py-1'>delete</p></div>:""}
       
    </div>
  )
}
