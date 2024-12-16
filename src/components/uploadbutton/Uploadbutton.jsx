import React from 'react'

export default function Uploadbutton({label, update}) {
  return (
    <input className='bg-purple-600 rounded-lg p-3' type='file' onChange={update}/>
  )
}
