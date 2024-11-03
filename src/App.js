// src/App.js
import React, { useContext, useEffect, useState } from 'react';
import { HashRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Loginpage from './pages/loginpage/Loginpage';
import Registerpage from './pages/registerpage/Registerpage';
import Contactpage from './pages/contactpage/Contactpage';
import Sitelistingpage from './pages/sitelistingpage/Sitelistingpage';
import Notfoundpage from './pages/notfoundpage/Notfoundpage';
import Addsitepage from './pages/addsitepage/Addsitepage';
import Addcontentpage from './pages/addcontentpage/Addcontentpage';
import Dashboard from './pages/dashboard/Dashboard';
import Aboutpage from './pages/aboutpage/Aboutpage';
import { FormDataContextProvider } from './Contexts/FormDataContexts';
import { DebugLevelContextProvider } from './Contexts/DebugLevelContext';
import Loadinpage from './pages/loadingpage/Loadinpage';
import { LoginStateContextProvider } from './Contexts/LoadingStateContext';
import Copyright from './components/copyright/Copyright';
import MirrorListing from './pages/mirrorlinsting/MirrorLIsting';
import { GlobalContextProvider } from './Contexts/GlobalContext';
import Addmirrorpage from './pages/addmirrorpage/Addmirrorpage';
import Contentlistingpage from './pages/contentlistingpage/Contentlistingpage';
import UpdateContentpage from './pages/updatecontentpage/UpdateContentpage';
import ManageSites from './pages/manage_sites/ManageSites';
import ManageContents from './pages/manage_contents/ManageContents';
import ManageMirrors from './pages/manage_mirrors/ManageMirrors';
import ManageAccounts from './pages/manage_accounts/ManageAccounts';
import ManageClients from './pages/manage_clients/ManageClients';
import ManageMenus from './pages/manage_menus/ManageMenus';
import { CookieContextProvider } from './Contexts/CookieContext';

function App() {
    const [isLoading, setIsLoading] = useState(false)

    return (
        <>
            <LoginStateContextProvider>
                <FormDataContextProvider>
                    <CookieContextProvider>
                        {isLoading ?
                            <Loadinpage /> :
                            <>
                                <div className='mx-5 mt-5 mb-0 bg-white' onClick={() => window.location.href = "/#/dashboard"}>
                                    <img src='logo.png' className='h-20 p-0 m-0 ' />
                                    <p className='mx-1'><a >MirrorLink</a></p>

                                </div>


                                <section className='flex justify-center align-middle'>

                                    <div className=' w-11/12 md:w-1/3 p-5  md:border md:px-10 border-gray-300 rounded-xl' >



                                        <GlobalContextProvider>
                                            <DebugLevelContextProvider>
                                                <Router>
                                                    <Routes>
                                                        <Route path="/login" element={<Loginpage />} />
                                                        <Route path="/register" element={<Registerpage />} />
                                                        <Route path="/contact" element={<Contactpage />} />
                                                        <Route path="/sitelist" element={<Sitelistingpage />} />
                                                        <Route path="/contentlist" element={<Contentlistingpage />} />
                                                        <Route path="/mirrorlist" element={<MirrorListing />} />
                                                        {/* <Route path="/notfound" component={Notfoundpage} /> */}
                                                        <Route path="/addsite" element={<Addsitepage />} />
                                                        <Route path="/addmirror" element={<Addmirrorpage />} />
                                                        <Route path="/addcontent" element={<Addcontentpage />} />
                                                        <Route path="/updatecontent" element={<UpdateContentpage />} />
                                                        <Route path="/about" element={<Aboutpage />} />
                                                        <Route path="/dashboard" element={<Dashboard />} />
                                                        <Route path="/manage_sites" element={<ManageSites />} />
                                                        <Route path="/manage_contents" element={<ManageContents />} />
                                                        <Route path="/manage_mirrors" element={<ManageMirrors />} />
                                                        <Route path="/manage_clients" element={<ManageClients />} />
                                                        <Route path="/manage_accounts" element={<ManageAccounts />} />
                                                        <Route path="/manage_menus" element={<ManageMenus />} />
                                                        <Route path="/" element={<Loginpage />} />
                                                        {/* 404 Not Found route */}
                                                        <Route element={<Notfoundpage />} />
                                                    </Routes>
                                                </Router>
                                            </DebugLevelContextProvider>
                                        </GlobalContextProvider>
                                        <Copyright />

                                    </div>

                                </section>

                            </>
                        }
                    </CookieContextProvider>
                </FormDataContextProvider>
            </LoginStateContextProvider>
        </>
    );
}

export default App;