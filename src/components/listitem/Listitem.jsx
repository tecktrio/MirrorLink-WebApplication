import React from "react";
import { useNavigate } from "react-router-dom";
import Cookie from 'js-cookie'
import { Navigate_To_Update_Content } from "../../constants";
export default function Listitem({ title, description, goto, onDelete,onPlay }) {
  const navigate = useNavigate();
  return (
    <div
      className=" flex  rounded-lg py-3 border-b-2  mt-3 cursor-pointer  w-full"
      // {goto?{onClick={() =>navigate(goto)}}:""}
    >
     
      {/* <div> */}
      <div className=" mr-5">
        <div className="bg-gray-700 h-10 w-10 rounded-md"></div>
      </div>
      <div className="w-8/12">
        <p className="text-black text-sm font-semibold">{title}</p>
        <p className="text-black text-xs ">{description}</p>
      </div>

      {/* </div> */}
      {onDelete ? (
        <div className="flex ml-10 justify-end">
          <p
            onClick={onDelete}
            className="bg-red-500 text-white rounded-md px-5 py-2"
          >
            Delete
          </p>
        </div>
      ) : (
        ""
      )}

      {onPlay?

<button onClick={()=>{navigate(Navigate_To_Update_Content);Cookie.set('content_id', onPlay)}} className='text-white   py-2 px-5 ml-10 rounded-md bg-purple-500'>View</button>

      :""}
    </div>
  );
}
