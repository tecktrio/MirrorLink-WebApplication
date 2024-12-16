import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Submitbutton({ text, goto, disabled }) {

  const navigate = useNavigate()
  return (
    <>
      {!disabled?
        <div onClick={() => { navigate(goto) }}>
          <button className='bg-purple-800 p-5  text-white rounded-lg shadow-lg w-full' >{text}</button>
        </div> :
        <div >
          <button className='bg-gray-400 py-2  text-gray-200 rounded-lg w-full ' >{text}</button>
        </div>}
    </>

  )
}
