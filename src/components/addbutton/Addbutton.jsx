import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Addbutton({label,goto}) {
    console.log(goto)
    const navigate = useNavigate()
  return (
    <div className='bg-black rounded-lg p-2 px-3 shadow-lg' onClick={()=>{navigate(goto)}}>
        <p className='text-white'>{label}</p>
    </div>
  )
}
