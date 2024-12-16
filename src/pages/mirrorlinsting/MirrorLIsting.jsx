import React, { useContext, useEffect, useState } from "react";
import {
  DELETE_MIRROR,
  GET_AVAILABLE_MIRRORS_ON_SITE,
  GET_AVAILABLE_SITES,
} from "../../serverRequests/ServerRequests";
import Labelwithdescription from "../../components/labelwithdescription/Labelwithdescription";
import Listitem from "../../components/listitem/Listitem";
import { useNavigate } from "react-router-dom";
import {
  Navigate_To_Contentlist,
  Navigate_To_Mirrorlist,
} from "../../constants";
import { CookieContext } from "../../Contexts/CookieContext";
import Addbutton from "../../components/addbutton/Addbutton";
import MirrorListingModal from "../../components/Modal/MirrorListingModal";
import Contentlistingpage from "../contentlistingpage/Contentlistingpage";
import SelectMirror from "../SelectMirror/SelectMirror";

export default function MirrorListing({ site_id }) {
  console.log('sitessss',site_id);
  
  const [mirrorlist, setMirrorlist] = useState([]);
  const { getCookie, setCookie } = useContext(CookieContext);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // const deleteMirror = (id) => {
  //   let login_key = getCookie("login_key");
  //   DELETE_MIRROR(login_key, id).then((res) => {
  //     navigate("/manage_mirrors");
  //   });
  // };

  useEffect(() => {
    // console.log('site id mirror listig',site_id)
    // console.log('daaa',DATA.SELECTED_SITE_ID)
    let login_key = getCookie("login_key");
    if (site_id != null) {
      // let site_id = getCookie('site_id')
      GET_AVAILABLE_MIRRORS_ON_SITE(login_key, site_id).then((res) => {
        console.log(res.data);
        setMirrorlist(res.data);
      }).catch((error)=>{
        console.log(error)
      })
    }
  }, [site_id]);

  const Handler = (id) => {
    setCookie("mirror_id", id, 1);
    navigate(Navigate_To_Contentlist);
  };
  return (
    <div className="flex justify-center">
      <div className="w-full">
        <div className="flex justify-end m-2">
          {/* <Addbutton label={'Add Mirror'} goto={"/addmirror"}/> */}

          <button onClick={openModal} className="bg-purple-500 p-3 text-white rounded-lg">Add Mirror</button>
        </div>

        <div className="my-2">
          <Labelwithdescription
            label={"Setup Your Mirros and Contents"}
            description={"List of Mirros that are available in this site."}
          />
        </div>
        <div className="">
          {mirrorlist?.map((data, key) => {
            return (
              <div
                onClick={() => Handler(data._id)}
                key={key}
                className=" w-full mr-5"
              >
               
                <Listitem
                  title={data.mirror_name}
                  description={data.mirror_description}
                />
              </div>
            );
          })}
        </div>
      </div>

      <MirrorListingModal isOpen={isModalOpen} onClose={closeModal}>
        <div className="p-5 h-full">
          <h2 className="font-semibold">Select the Mirrors to Add</h2>
          <p>
            The below list only contains the mirros that are not assigned to any
            other Sites
          </p>
          <div className="h-full overflow-scroll no-scrollbar ">
            <SelectMirror site_id={site_id} handleclose={closeModal}/>
          </div>
        </div>

        {/* <button onClick={closeModal}>Close</button> */}
      </MirrorListingModal>
    </div>
  );
}
