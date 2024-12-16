import React, { useContext, useEffect, useState } from "react";
import {
  ASSIGN_MIRROR_TO_SITE,
  GET_ALL_MIRRORS,
  GET_ALL_UNASSIGNED_MIRRORS,
} from "../../serverRequests/ServerRequests";
import Labelwithdescription from "../../components/labelwithdescription/Labelwithdescription";
import Listitem from "../../components/listitem/Listitem";
import { CookieContext } from "../../Contexts/CookieContext";

export default function SelectMirror({site_id,handleclose}) {
  // const [mirrorlist, setMirrorlist] = useState([]);
  const [selectedMirrorList, setSelectedMirrorList] = useState([]);
  const [availableMirrorList, setavailableMirrorList] = useState([]);
  const { getCookie, setCookie } = useContext(CookieContext);

  useEffect(() => {
    // console.log('daaa',DATA.SELECTED_SITE_ID)
    let login_key = getCookie("login_key");
    // let site_id = getCookie('site_id')
    GET_ALL_UNASSIGNED_MIRRORS(login_key).then((res) => {
      console.log(res.data);
      setavailableMirrorList(res.data);
    }).catch((err)=>{
      console.log(err)
    })

 
  }, []);


  const HandleAddMirror = async()=>{
    let login_key = getCookie("login_key");

   const res = await ASSIGN_MIRROR_TO_SITE(login_key,selectedMirrorList, site_id)
   setSelectedMirrorList([])
  //  console.log(res.message);
   
    // console.log(mirror_ids)
  }

  const HandleSelectMirror = (mirror)=>{
    setSelectedMirrorList([...selectedMirrorList, mirror])
    setavailableMirrorList(availableMirrorList.filter(item=>item._id != mirror._id))
    // console.log('added',id)
}
const HandleDeSelectMirror = (mirror)=>{
    setavailableMirrorList([...availableMirrorList, mirror])
    setSelectedMirrorList(selectedMirrorList.filter(item=>item._id != mirror._id))
    // console.log('added',id)
}

  return (
    <div className="flex justify-center py-5">
      <div className="w-full">
    
        <div className="">
          
        <div className="my-2">
          <Labelwithdescription
            label={"Selected MirrorList"}
            description={"List of Mirros that are available in this site."}
          />

        </div>
        {selectedMirrorList?.map((mirror, key) => {
            return (
              <div
                onClick={() => HandleDeSelectMirror(mirror)} 
                key={key}
                className=" border-2 border-purple-700 rounded-md p-2 my-1  flex"
              >
                {/* <input type="checkbox" className="border-2 p-1 m-1"  onChange={(e)=>HandleSelectMirror(e,data)}/> */}
                <div className=" ml-5 cursor-pointer">

                <p>{mirror.mirror_name}</p>
                <p className="text-sm text-gray-800">{mirror.mirror_description}</p>
                </div>
                  
              </div>
            );
          })}
              
        <div className="my-2">
          <Labelwithdescription
            label={"Available MirrorList"}
            description={"List of Mirros that are available in this site."}
          />

        </div>
          
           {availableMirrorList?.map((mirror, key) => {
            return (
              <div
                onClick={() => HandleSelectMirror(mirror)} 
                key={key}
                className=" border-2 border-black rounded-md p-2 m-1 flex"
              >
                {/* <input type="checkbox" className="border-2 p-1 m-1"  onChange={(e)=>HandleSelectMirror(e,data)}/> */}
                <div className=" ml-5 cursor-pointer">

                <p>{mirror.mirror_name}</p>
                <p className="text-sm text-gray-800">{mirror.mirror_description}</p>
                </div>
                  
              </div>
            );
          })}
        </div>
        <div className="flex justify-between my-10">
        <button className="bg-red-500 text-white px-10 py-2 rounded-md  " onClick={handleclose}>Close</button>
          {selectedMirrorList.length>0?<button className="bg-purple-700 text-white px-10 py-2 rounded-md  " onClick={HandleAddMirror}>Add</button>
         : <button className="bg-purple-300 text-white px-10 py-2 rounded-md  " >Add</button>}
        </div>
      </div>

      
    </div>
  );
}
