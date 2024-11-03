import React from 'react'
import { useNavigate } from 'react-router-dom'
export default function Labelwithdescription({ label, description, placeholder, updatedata, icon , goto}) {
const navigate = useNavigate()
  return (
    <div >
      <div className='p-2' onClick={()=>goto?navigate(goto):''}>
        <div className='flex '>
          {icon ? <img src={icon} className=" w-5 h-5 p-0.5" /> : <div></div>}
          <p className='text-gray-600 '>{label}</p>
        </div>

        <p className='text-xs text-gray-400 mt-0 mb-2'>{description}</p>
        

      </div>
    </div>
  )
}
