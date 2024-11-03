import React from 'react'
export default function Inputtextbox({ label, description, placeholder, updatedata, icon, type }) {

  

  return (
    <div >
      <div className='py-3'>
        <div className='flex '>
          {icon ? <img src={icon} className=" w-5 h-5 p-0.5" /> : <div></div>}
          <p className='text-gray-600 '>{label}</p>
        </div>

        <p className='text-xs text-gray-400 mt-0 mb-2'>{description}</p>
        <input type={type} id='textinput' className='border-gray-300 border rounded-lg py-3 px-5  w-full' placeholder={placeholder} onKeyUp={(e) => {
          updatedata(e.target.value)
        }} required />

      </div>
    </div>
  )
}
