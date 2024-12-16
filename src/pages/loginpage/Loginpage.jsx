import React, { useContext, useState } from "react";
import Inputtextbox from "../../components/inputtextbox/Inputtextbox";
import Submitbutton from "../../components/submitbutton/Submitbutton";
import { FormDataContext } from "../../Contexts/FormDataContexts";
import { MAKE_LOGIN } from "../../serverRequests/ServerRequests";
import { useNavigate } from "react-router-dom";
import { Navigate_To_Dashboard, Navigate_To_Sitelist } from "../../constants";
import { DebugLevelLoginContext } from "../../Contexts/DebugLevelContext";
import { LoadingStateContext } from "../../Contexts/LoadingStateContext";
import Loadinpage from "../loadingpage/Loadinpage";
import Labelwithdescription from "../../components/labelwithdescription/Labelwithdescription";
import { CookieContext } from "../../Contexts/CookieContext";

export default function Loginpage() {
  const { DEBUG_LEVEL, SET_DEBBUG_LEVEL } = useContext(DebugLevelLoginContext);
  const { setCookie } = useContext(CookieContext);
  const { isLoading, setIsLoading } = useContext(LoadingStateContext);
  const { formdata, setformdata } = useContext(FormDataContext);
  const [username, setusername] = useState(formdata.username);
  const [password, setpassword] = useState(formdata.password);
  const [message, setmessage] = useState("");

  const navigate = useNavigate();

  const HandleLogin = async (e) => {
    setformdata({ ...formdata, username: username, password: password });
    setIsLoading(true);
    e.preventDefault();
    // Assuming MAKE_LOGIN is an async function that handles login
    MAKE_LOGIN(username, password)
      .then((key) => {
        if (DEBUG_LEVEL == 3) {
          console.log("login Successfull");
        }
        setIsLoading(false);
        setCookie("login_key", key, 1);
        navigate(Navigate_To_Dashboard);
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
        setmessage("Invalid Login Credentials");
      });
  };

  return (
    <>
      {isLoading ? (
        <Loadinpage />
      ) : (
        <div className="flex  h-screen justify-center p-10">
          <div className="p-2  sm:w-2/3 sm:p-20 md:-10 lg:w-1/3  ">
            <h1 className="font-bold text-6xl text-purple-700">Let’s Sign You In.</h1>
            <h1 className="font-bold text-3xl text-gray-400">
              You’ve been missed! Welcome back
            </h1>
            {/* <p className='text-2xl mx'>Login</p> */}
            <div className="pt-10">
              <form onSubmit={HandleLogin}>
                <div className="text-left">
                  <Inputtextbox
                    icon={"user.png"}
                    label="Administrator Username"
                    description="Kindly Enter Your Valid Administrator Username"
                    placeholder="Enter username"
                    updatedata={setusername}
                  />

                  <Inputtextbox
                    icon={"lock.png"}
                    type="password"
                    label="Administrator Password"
                    description="Enter your Secret Password."
                    placeholder="Enter password"
                    updatedata={setpassword}
                  />
                  <p className="text-red-600 mx-2">{message}</p>

                  <div className=" w-full ">
                    <Submitbutton text="Login" />
                  </div>
                </div>

                <input />
              </form>
            </div>
            <div className="border border-purple-800 px-5 cursor-pointer">
              <Labelwithdescription
                label={"Create Account"}
                description={
                  "If you are new here, we will suggest you to create a new account"
                }
                goto={"/register"}
              />
            </div>
          </div>
          <img src="login-man.jpg" className="rounded-lg hidden lg:block"/>
        </div>
      )}
    </>
  );
}
