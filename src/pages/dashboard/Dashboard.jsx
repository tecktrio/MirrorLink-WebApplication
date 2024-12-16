import React, { useState } from "react";
import Labelwithdescription from "../../components/labelwithdescription/Labelwithdescription";
import Listitem from "../../components/listitem/Listitem";
import { Link, Outlet, useNavigate } from "react-router-dom";
import Cookie from "js-cookie";

export default function Dashboard() {
  const [HighLight, setHighLight] = useState("Setup");
  let navigate = useNavigate();

  return (
    <div className="layout-container flex h-screen ">
      {/* Sidebar */}
      <aside className="bg-gray-800 p-10 border flex justify-between flex-col  text-gray-300 w-1/8">
      {/* <div> */}
      <div className="h-full  ">
      <div className="text-center">
                <p className="text-lg font-bold">Mirror Link</p>
                <p className="text-sm">Control Your mirror From Anywhere</p>
                </div>
          <ul>
            <Link to="/setup">
              <div className="my-10 flex justify-center">
               
           
              </div>
              <li
                className={
                  HighLight == "Setup"
                    ? "px-5 py-3 my-5  bg-purple-800 rounded-md text-white flex items-center"
                    : "px-5 py-3 my-5 flex items-center"
                }
                onClick={() => setHighLight("Setup")}
              >
                <img
                  src="/Icons/settings.png"
                  className="w-5 h-5 mr-2 filter brightness-0 invert"
                />
                Setup
              </li>
            </Link>

            <Link to="/manage_sites">
              <li
                className={
                  HighLight == "sites"
                    ? "px-5 py-3 my-5 bg-purple-800 rounded-md text-white flex  items-center"
                    : "px-5 py-3 my-5 items-center flex"
                }
                onClick={() => setHighLight("sites")}
              >
                <img
                  src="/Icons/skyline.png"
                  className="w-5 h-5 mr-2 filter brightness-0 invert"
                />
                Manage sites{" "}
              </li>
            </Link>

            <Link to="/manage_mirrors">
              {" "}
              <li
                className={
                  HighLight == "mirror"
                    ? "px-5 py-3 my-5 bg-purple-800 rounded-md text-white  items-center flex"
                    : "px-5 py-3 my-5  items-center flex"
                }
                onClick={() => setHighLight("mirror")}
              >
                <img
                  src="/Icons/display-frame.png"
                  className="w-5 h-5 mr-2 filter brightness-0 invert"
                />
                Manage mirrors
              </li>
            </Link>

            <Link to="/manage_contents">
              <li
                className={
                  HighLight == "Contents"
                    ? "px-5 py-3 my-5 bg-purple-800 rounded-md text-white flex  items-center"
                    : "px-5 py-3 my-5 items-center flex"
                }
                onClick={() => setHighLight("Contents")}
              >
                <img
                  src="/Icons/video.png"
                  className="w-5 h-5 mr-2 filter brightness-0 invert"
                />
                Manage Contents
              </li>
            </Link>
            {/* <Link to="/manage_menus"><li className={HighLight == "Menus"?"p-5 bg-purple-800 rounded-md text-white":"p-5"} onClick={()=>setHighLight('Menus')}>Manage Menus</li></Link>
              <Link to="/manage_clients"><li className={HighLight == "Clients"?"p-5 bg-purple-800 text-white":"p-5"} onClick={()=>setHighLight('Clients')}>Manage Clients</li></Link>
              <Link to="/manage_accounts"><li className={HighLight == "Accounts"?"p-5 bg-purple-800 text-white":"p-5"} onClick={()=>setHighLight('Accounts')}>Manage Accounts</li></Link> */}
          </ul>

        
        </div>
        <div>
        <ul className="">
            <p className="cursor-pointer">
              <li
                className={
                  HighLight == "Logout"
                    ? "px-5 py-3 my-5 bg-purple-800 text-white flex  items-center"
                    : "px-5 py-3 my-5 items-center flex"
                }
                onClick={() => {
                  setHighLight("Logout");
                  Cookie.remove("login_key");
                  navigate("/login");
                }}
              >
                <img
                  src="/Icons/skyline.png"
                  className="w-5 h-5 mr-2 filter brightness-0 invert"
                />
                LogOut
              </li>
            </p>
          </ul>
        </div>
      {/* </div> */}
       
      </aside>

      {/* Main Content */}
      <main className="content p-10 w-5/6">
        <Outlet />
      </main>
    </div>
  );
}
