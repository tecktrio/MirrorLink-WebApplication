import React, { useContext, useEffect, useState } from 'react'
import MirrorListing from '../mirrorlinsting/MirrorLIsting'
import MirrorListingModal from '../../components/Modal/MirrorListingModal';
import { GET_AVAILABLE_SITES } from '../../serverRequests/ServerRequests';
import { CookieContext } from '../../Contexts/CookieContext';

function Setup() {
  const { getCookie, setCookie } = useContext(CookieContext);
  const [availableSiteList, setAvailableSiteList] = useState([])
  const [selectedsite, setSelectedsite] = useState("")
  // const [Loading, setLoading] = useState(false)

  let login_key = getCookie("login_key");

  const HandleChangeinsite=(e)=>{
    // console.log(e.target.value)
    let site_id = e.target.value
    console.log(site_id)
    setSelectedsite(site_id)
    // console.log(site_id)
  }

  useEffect(()=>{
    GET_AVAILABLE_SITES(login_key).then((res)=>{
      console.log("dataaaaa",res?.data[0]._id)
      
      setAvailableSiteList(res.data)
      setSelectedsite(res?.data[0]._id)
      // setLoading(true)
    }).catch((error)=>{
      console.log(error)
    })
  },[])

  // useEffect(()=>{
  //   setSelectedsite(availableSiteList[0])
  // },[availableSiteList])

 return (
  <>
  <nav className='flex justify-end'>
    {/* <p className='p-3'>Select the Site</p> */}
    <select className='border border-purple-700 px-5 py-2  rounded-md bg-white min-w-48' onChange={(e)=>HandleChangeinsite(e)}>
      
      {availableSiteList.map((site,key)=>{
        return (
         
          <option value={site._id} key={key}>{site.site_name}</option>
        )
      })}
    </select>
  </nav>

  <div className='p-5'>
    
    {selectedsite?<MirrorListing site_id={selectedsite}/>:""}
  </div>
  </>
 )
}

export default Setup
