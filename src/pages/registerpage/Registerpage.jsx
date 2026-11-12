import React, { useContext, useState } from 'react'
import Inputtextbox from '../../components/inputtextbox/Inputtextbox'
import Submitbutton from '../../components/submitbutton/Submitbutton'
import { FormDataContext } from '../../Contexts/FormDataContexts'
import { ESTABLISH_WEBSOCKET_CONNECTION, MAKE_LOGIN, MAKE_REGISTER } from '../../serverRequests/ServerRequests'
import { useNavigate, Link } from 'react-router-dom'
import { Navigate_To_Dashboard } from '../../constants'
import { DebugLevelLoginContext } from '../../Contexts/DebugLevelContext'
import { LoadingStateContext } from '../../Contexts/LoadingStateContext'
import Loadinpage from '../loadingpage/Loadinpage'

export default function RegisterPage() {
  const { DEBUG_LEVEL } = useContext(DebugLevelLoginContext)
  const { isLoading, setIsLoading } = useContext(LoadingStateContext)
  const { formdata, setformdata } = useContext(FormDataContext)
  const [username, setusername] = useState(formdata?.username || '')
  const [password, setpassword] = useState(formdata?.password || '')
  const [email, setemail] = useState(formdata?.email || '')
  const [contact, setcontact] = useState(formdata?.contact || '')
  const [profile_image_url, set_profile_image_url] = useState(formdata?.profile_image_url || '')
  const [address_line_1, set_address_line_1] = useState(formdata?.address_line_1 || '')
  const [address_line_2, set_address_line_2] = useState(formdata?.address_line_2 || '')
  const [address_line_3, set_address_line_3] = useState(formdata?.address_line_3 || '')
  const [message, setmessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()

  const HandleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !email.trim()) {
      setmessage("Username, Password, and Email are required.")
      return
    }

    setformdata({
      ...formdata,
      username,
      password,
      email,
      contact,
      profile_image_url,
      address_line_1,
      address_line_2,
      address_line_3,
    })

    setIsSubmitting(true)
    setmessage("")

    MAKE_REGISTER(username, password, email, contact, profile_image_url, address_line_1, address_line_2, address_line_3)
      .then(() => {
        if (DEBUG_LEVEL === 3) console.log('Register Successful')
        MAKE_LOGIN(username, password)
          .then(() => {
            setIsSubmitting(false)
            navigate(Navigate_To_Dashboard)
          })
          .catch((err) => {
            console.error(err)
            setIsSubmitting(false)
            navigate('/login')
          })
      })
      .catch((error) => {
        console.error(error)
        setIsSubmitting(false)
        setmessage("Registration failed. Username or email may already be registered.")
      })
  }

  return (
    <>
      {isLoading ? (
        <Loadinpage />
      ) : (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 py-12">
          <div className="w-full max-w-xl bg-white border border-neutral-200 rounded-3xl p-8 sm:p-10 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-white mx-auto shadow-md mb-4">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-black tracking-tight">
                Create Administrator Account
              </h2>
              <p className="text-xs text-neutral-500 mt-1 font-medium">
                Set up your master console credentials for MirrorLink
              </p>
            </div>

            {message && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
                {message}
              </div>
            )}

            <form onSubmit={HandleLogin} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Inputtextbox
                  label="Username"
                  placeholder="e.g. john_admin"
                  value={username}
                  updatedata={setusername}
                  required={true}
                />
                <Inputtextbox
                  type="password"
                  label="Password"
                  placeholder="••••••••••••"
                  value={password}
                  updatedata={setpassword}
                  required={true}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Inputtextbox
                  label="Email Address"
                  placeholder="admin@example.com"
                  value={email}
                  updatedata={setemail}
                  required={true}
                />
                <Inputtextbox
                  label="Contact Phone"
                  placeholder="+1 (555) 000-0000"
                  value={contact}
                  updatedata={setcontact}
                  required={false}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <Inputtextbox
                  label="Address / Street"
                  placeholder="123 Main St"
                  value={address_line_1}
                  updatedata={set_address_line_1}
                  required={false}
                />
                <Inputtextbox
                  label="City / Town"
                  placeholder="New York"
                  value={address_line_2}
                  updatedata={set_address_line_2}
                  required={false}
                />
                <Inputtextbox
                  label="State & ZIP"
                  placeholder="NY 10001"
                  value={address_line_3}
                  updatedata={set_address_line_3}
                  required={false}
                />
              </div>

              <div className="pt-4">
                <Submitbutton
                  text={isSubmitting ? "Creating account..." : "Complete Registration"}
                  disabled={isSubmitting}
                />
              </div>
            </form>

            <div className="mt-6 text-center text-xs text-neutral-500">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-black hover:text-neutral-700 underline underline-offset-2">
                Sign in here
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
