import React, { useContext, useEffect, useState } from "react";
import {
    ASSIGN_CONTENT_TO_MIRROR,
  ASSIGN_MIRROR_TO_SITE,
  GET_ALL_CONTENTS,
  GET_ALL_MIRRORS,
  GET_ALL_UNASSIGNED_MIRRORS,
} from "../../serverRequests/ServerRequests";
import Labelwithdescription from "../../components/labelwithdescription/Labelwithdescription";
import Listitem from "../../components/listitem/Listitem";
import { CookieContext } from "../../Contexts/CookieContext";

export default function SelectContent({mirror_id,handleclose}) {
  // const [mirrorlist, setMirrorlist] = useState([]);
  const [selectedContentList, setSelectedContentList] = useState([]);
  const [availableContentList, setavailableContentList] = useState([]);
  const { getCookie, setCookie } = useContext(CookieContext);

  useEffect(() => {
    // console.log('daaa',DATA.SELECTED_SITE_ID)
    let login_key = getCookie("login_key");
    // let site_id = getCookie('site_id')
    GET_ALL_CONTENTS(login_key).then((res) => {
      console.log(res.data);
      setavailableContentList(res.data);
    }).catch((err)=>{
        console.log(err)
      })

 
  }, []);


  const HandleAddMirror = async()=>{
    let login_key = getCookie("login_key");

    let selectedContentIDList = selectedContentList.map((content,key)=>{return(content._id)})
    console.log(selectedContentIDList)
   const res = await ASSIGN_CONTENT_TO_MIRROR(login_key,selectedContentIDList, mirror_id)
  //  console.log(res.message);
  setSelectedContentList([])
   
    // console.log(mirror_ids)
  }

  const HandleSelectContent = (content)=>{
    setavailableContentList(availableContentList.filter(item=>item._id != content._id))

    setSelectedContentList([...selectedContentList, content])

    // console.log('added',id)
}
const HandleDeSelectContent = (content)=>{
    setavailableContentList([...availableContentList, content])

    setSelectedContentList(selectedContentList.filter(item=>item != content._id))
    // console.log('added',id)
}

  return (
    <div className="flex justify-center">
      <div className="w-full">
    
        <div className="my-2">
          <Labelwithdescription
            label={"Select the Contents to Add"}
            description={"List of Contents that are available in this Mirror."}
          />

        </div>
        <div className="py-3">
        <Labelwithdescription
            label={"Selected Contents"}
            description={"List of Contents that are available in this Mirror."}
          />
        {selectedContentList?.map((content, key) => {
            return (
              <div
                onClick={() => HandleDeSelectContent(content)} 
                key={key}
                className=" border-2 border-purple-700 rounded-md p-2 m-1 flex"
              >
                {/* <input type="checkbox" className="border-2 p-1 m-1"  onChange={(e)=>HandleSelectContent(e,data)}/> */}
                <div className=" ml-5 cursor-pointer">

                <p>{content.content_title}</p>
                <p className="text-sm text-gray-800">{content.content_description}</p>
                </div>
                  
              </div>
            );
          })}
           <Labelwithdescription
            label={"Available Content"}
            description={"List of Contents that are available in this Mirror."}
          />
          
           {availableContentList?.map((content, key) => {
            return (
              <div
                onClick={() => HandleSelectContent(content)} 
                key={key}
                className=" border-2 border-black rounded-md p-2 m-1 flex"
              >
                {/* <input type="checkbox" className="border-2 p-1 m-1"  onChange={(e)=>HandleSelectContent(e,data)}/> */}
                <div className=" ml-5 cursor-pointer">

                <p>{content.content_title}</p>
                <p className="text-sm text-gray-800">{content.content_description}</p>
                </div>
                  
              </div>
            );
          })}
        </div>
        <div className="flex justify-between">
        <button className="bg-red-500 text-white px-10 py-2 rounded-md  " onClick={handleclose}>Close</button>
          {selectedContentList.length>0?<button className="bg-purple-700 text-white px-10 py-2 rounded-md  " onClick={HandleAddMirror}>Add</button>
         : <button className="bg-purple-300 text-white px-10 py-2 rounded-md  " >Add</button>}
               
        </div>
      </div>

      
    </div>
  );
}
