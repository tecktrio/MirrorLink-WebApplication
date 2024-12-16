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
                            <Route
                              path="/register"
                              element={<Registerpage />}
                            />
                            {/* <AuthenticationContextWrapper> */}
                              <Route path="/"  element={<Dashboard />}>

                              <Route
                                 index
                                  element={<AuthenticationContextWrapper><Setup /></AuthenticationContextWrapper>}
                                />
                                <Route
                                  path="/contact"
                                  element={<Contactpage />}
                                />
                                <Route
                                  path="/setup"
                                  element={<AuthenticationContextWrapper><Setup /></AuthenticationContextWrapper>}
                                />
                                <Route path="/about" element={<Aboutpage />} />
                                <Route
                                  path="/manage_sites"
                                  element={<ManageSites />}
                                />
                                <Route
                                  path="/manage_contents"
                                  element={<ManageContents />}
                                />
                                <Route
                                  path="/manage_mirrors"
                                  element={<ManageMirrors />}
                                />
                                <Route
                                  path="/manage_clients"
                                  element={<ManageClients />}
                                />
                                <Route
                                  path="/manage_accounts"
                                  element={<ManageAccounts />}
                                />
                                <Route
                                  path="/manage_menus"
                                  element={<ManageMenus />}
                                />
                                <Route path="/addmirror"
                                element={<Addmirrorpage/>}
                                />
                                <Route path="/addcontent"
                                element={<Addcontentpage/>}
                                />
                               
                               <Route path="/addsite"
                                element={<Addsitepage/>}
                                />
                               
                                <Route
                                  path="/contentlist"
                                  element={<Contentlistingpage />}
                                />
                                <Route
                                  path="/updatecontent"
                                  element={<UpdateContentpage />}
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
