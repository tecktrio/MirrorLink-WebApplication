import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Submitbutton({ text, goto, disabled }) {

  const navigate = useNavigate()
  return (
    <>
      {!disabled?
        <div onClick={() => { navigate(goto) }}>
          <button className='bg-black py-2 p-5 text-white rounded-lg shadow-lg' >{text}</button>
        </div> :
        <div >
          <button className='bg-gray-400 py-2 p-5 text-gray-200 rounded-lg ' >{text}</button>
        </div>}
    </>

  )
}
