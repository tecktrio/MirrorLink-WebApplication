import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Addbutton({label,goto}) {
    console.log(goto)
    const navigate = useNavigate()
  return (
    <div className='bg-purple-500 p-3 text-white rounded-lg cursor-pointer shadow-lg' onClick={()=>{navigate(goto)}}>
        <p className='text-white'>{label}</p>
    </div>
  )
}
