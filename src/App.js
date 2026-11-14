// src/App.js
import React, { useContext, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import Loginpage from "./pages/loginpage/Loginpage";
import Registerpage from "./pages/registerpage/Registerpage";
import RegisterVerifyPage from "./pages/registerpage/RegisterVerifyPage";
import Contactpage from "./pages/contactpage/Contactpage";
import Sitelistingpage from "./pages/sitelistingpage/Sitelistingpage";
import Notfoundpage from "./pages/notfoundpage/Notfoundpage";
import Addsitepage from "./pages/addsitepage/Addsitepage";
import Addcontentpage from "./pages/addcontentpage/Addcontentpage";
import Dashboard from "./pages/dashboard/Dashboard";
import Aboutpage from "./pages/aboutpage/Aboutpage";
import { FormDataContextProvider } from "./Contexts/FormDataContexts";
import { DebugLevelContextProvider } from "./Contexts/DebugLevelContext";
import Loadinpage from "./pages/loadingpage/Loadinpage";
import { LoginStateContextProvider } from "./Contexts/LoadingStateContext";
import Copyright from "./components/copyright/Copyright";
import MirrorListing from "./pages/mirrorlinsting/MirrorLIsting";
import { GlobalContextProvider } from "./Contexts/GlobalContext";
import Addmirrorpage from "./pages/addmirrorpage/Addmirrorpage";
import Contentlistingpage from "./pages/contentlistingpage/Contentlistingpage";
import UpdateContentpage from "./pages/updatecontentpage/UpdateContentpage";
import ManageSites from "./pages/manage_sites/ManageSites";
import ManageContents from "./pages/manage_contents/ManageContents";
import ManageMirrors from "./pages/manage_mirrors/ManageMirrors";
import ManageAccounts from "./pages/manage_accounts/ManageAccounts";
import ManageClients from "./pages/manage_clients/ManageClients";
import ManageMenus from "./pages/manage_menus/ManageMenus";
import { CookieContextProvider } from "./Contexts/CookieContext";
import { AuthenticationContextWrapper } from "./Contexts/AuthenticationContext";
import Setup from "./pages/setup/Setup";
import Developing from "./pages/Developing/Developing";
import LandingPage from "./pages/landingpage/LandingPage";
import PricingPage from "./pages/pricingpage/PricingPage";
import SelectMirror from "./pages/SelectMirror/SelectMirror";
import SelectContent from "./pages/SelectContent/SelectContent";
import ResetPassword from "./pages/loginpage/ResetPassword";
import SubscriptionPage from "./pages/subscription/SubscriptionPage";
import Cookies from "js-cookie";
import { Navigate } from "react-router-dom";

function AccountRequired({ children }) {
  return Cookies.get("login_key") ? children : <Navigate to="/login" replace />;
}

function App() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <LoginStateContextProvider>
        <FormDataContextProvider>
          <CookieContextProvider>
            {isLoading ? (
              <Loadinpage />
            ) : (
              <>
                {/* <div className='mx-5 mt-5 mb-0 bg-white' onClick={() => window.location.href = "/#/dashboard"}>
                                    <img src='logo.png' className='h-20 p-0 m-0 ' />
                                    <p className='mx-1'><a >MirrorLink</a></p>

                                </div> */}
{/* 
                <section className="flex w-screen align-middle">
                  <div className="w-2/4 p-10"> */}
                    <GlobalContextProvider>
                      <DebugLevelContextProvider>
                        <Router>
                          <Routes>
                            <Route path="/login" element={<Loginpage />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route
                              path="/register"
                              element={<Registerpage />}
                            />
                            <Route path="/register/verify" element={<RegisterVerifyPage />} />
                            {/* <AuthenticationContextWrapper> */}
                              <Route path="/"  element={<Dashboard />}>

                                <Route index element={<LandingPage />} />
                                <Route path="/pricing" element={<PricingPage />} />
                                <Route path="/subscription" element={<AccountRequired><SubscriptionPage /></AccountRequired>} />
                                <Route
                                  path="/contact"
                                  element={<Contactpage />}
                                />
                                <Route
                                  path="/setup"
                                  element={<AccountRequired><Setup /></AccountRequired>}
                                />
                                <Route path="/about" element={<Aboutpage />} />
                                <Route
                                  path="/manage_sites"
                                  element={<AccountRequired><ManageSites /></AccountRequired>}
                                />
                                <Route
                                  path="/manage_contents"
                                  element={<AccountRequired><ManageContents /></AccountRequired>}
                                />
                                <Route
                                  path="/manage_mirrors"
                                  element={<AccountRequired><ManageMirrors /></AccountRequired>}
                                />
                                <Route
                                  path="/manage_clients"
                                  element={<AccountRequired><ManageClients /></AccountRequired>}
                                />
                                <Route
                                  path="/manage_accounts"
                                  element={<AccountRequired><ManageAccounts /></AccountRequired>}
                                />
                                <Route
                                  path="/manage_menus"
                                  element={<AccountRequired><ManageMenus /></AccountRequired>}
                                />
                                <Route path="/addmirror"
                                element={<AccountRequired><Addmirrorpage/></AccountRequired>}
                                />
                                <Route path="/addcontent"
                                element={<AccountRequired><Addcontentpage/></AccountRequired>}
                                />
                               
                               <Route path="/addsite"
                                element={<AccountRequired><Addsitepage/></AccountRequired>}
                                />
                                <Route path="/selectmirror" element={<AccountRequired><SelectMirror /></AccountRequired>} />
                                <Route path="/selectcontent" element={<AccountRequired><SelectContent /></AccountRequired>} />
                               
                                <Route
                                  path="/contentlist"
                                  element={<AccountRequired><Contentlistingpage /></AccountRequired>}
                                />
                                <Route
                                  path="/updatecontent"
                                  element={<AccountRequired><UpdateContentpage /></AccountRequired>}
                                />
                                <Route path="*" element={< Developing/>} />
                              </Route>
                            {/* </AuthenticationContextWrapper> */}

                            {/* 404 Not Found route */}
                            <Route element={<Notfoundpage />} />
                          </Routes>
                        </Router>
                      </DebugLevelContextProvider>
                    </GlobalContextProvider>
                    {/* <Copyright /> */}
                  {/* </div> */}

                  {/* <div>
                    <img src="sideimage1.png" className="w-screen" />
                  </div>
                </section> */}
              </>
            )}
          </CookieContextProvider>
        </FormDataContextProvider>
      </LoginStateContextProvider>
    </>
  );
}

export default App;
