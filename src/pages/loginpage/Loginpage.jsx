import React, { useContext, useState } from "react";
import Inputtextbox from "../../components/inputtextbox/Inputtextbox";
import Submitbutton from "../../components/submitbutton/Submitbutton";
import { FormDataContext } from "../../Contexts/FormDataContexts";
import { MAKE_LOGIN } from "../../serverRequests/ServerRequests";
import { useNavigate, Link } from "react-router-dom";
import { Navigate_To_Dashboard } from "../../constants";
import { DebugLevelLoginContext } from "../../Contexts/DebugLevelContext";
import { LoadingStateContext } from "../../Contexts/LoadingStateContext";
import Loadinpage from "../loadingpage/Loadinpage";
import { CookieContext } from "../../Contexts/CookieContext";

export default function Loginpage() {
  const { DEBUG_LEVEL } = useContext(DebugLevelLoginContext);
  const { setCookie } = useContext(CookieContext);
  const { isLoading, setIsLoading } = useContext(LoadingStateContext);
  const { formdata, setformdata } = useContext(FormDataContext);
  const [username, setusername] = useState(formdata?.username || "admin");
  const [password, setpassword] = useState(formdata?.password || "password");
  const [message, setmessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const HandleLogin = async (e) => {
    e.preventDefault();
    setformdata({ ...formdata, username, password });
    setIsSubmitting(true);
    setmessage("");

    MAKE_LOGIN(username, password)
      .then((key) => {
        if (DEBUG_LEVEL === 3) console.log("Login Successful");
        setIsSubmitting(false);
        setCookie("login_key", key, 30);
        navigate(Navigate_To_Dashboard);
      })
      .catch((error) => {
        console.error("Login failed:", error);
        setIsSubmitting(false);
        setmessage("Invalid username or password. Please verify credentials.");
      });
  };

  return (
    <>
      {isLoading ? (
        <Loadinpage />
      ) : (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white border border-neutral-200 rounded-3xl p-8 sm:p-10 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-white mx-auto shadow-md mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-black tracking-tight">
                Welcome to MirrorLink
              </h2>
              <p className="text-xs text-neutral-500 mt-1 font-medium">
                Digital screen management &amp; signage control
              </p>
            </div>

            {/* Error Message */}
            {message && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
                {message}
              </div>
            )}

            {/* Form */}
            <form onSubmit={HandleLogin} className="space-y-4">
              <Inputtextbox
                label="Administrator Username"
                description=""
                placeholder="Enter username (default: admin)"
                value={username}
                updatedata={setusername}
                required={true}
              />

              <Inputtextbox
                type="password"
                label="Administrator Password"
                description=""
                placeholder="Enter password (default: password)"
                value={password}
                updatedata={setpassword}
                required={true}
              />

              <div className="pt-2">
                <Submitbutton
                  text={isSubmitting ? "Signing in..." : "Sign In to Console"}
                  disabled={isSubmitting}
                />
              </div>
            </form>

            {/* Default credentials tip */}
            <div className="mt-6 p-3 bg-neutral-100 rounded-xl border border-neutral-200 text-center text-[11px] text-neutral-600">
              Default access: <span className="font-mono text-black font-bold">admin</span> / <span className="font-mono text-black font-bold">password</span>
            </div>

            {/* Register link */}
            <div className="mt-6 text-center text-xs text-neutral-500">
              New administrator?{" "}
              <Link to="/register" className="font-semibold text-black hover:text-neutral-700 underline underline-offset-2">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
