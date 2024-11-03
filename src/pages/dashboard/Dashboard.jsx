import React from 'react'
import Labelwithdescription from '../../components/labelwithdescription/Labelwithdescription'
import Listitem from '../../components/listitem/Listitem'

export default function Dashboard() {
  
  return (
    <div>
      <div>
        <Labelwithdescription label="Dashboard" description="List of controls that can be done by you"/>
      </div>
      <div className='flex w-full'>
        <Listitem title="Sites Manager" description="5 sites available" goto="/manage_sites"/>
        <Listitem title="Mirrors Manager" description="5 sites available" goto="/manage_mirrors"/>
      </div>
      <div className='flex w-full'>
        <Listitem title="Contents Manager" description="5 sites available" goto="/manage_contents"/>
        <Listitem title="Accounts Manager" description="5 sites available" goto="/manage_accounts"/>
      </div>
      <div className='flex w-full'>
        <Listitem title="Menus Manager" description="5 sites available" goto="/manage_menus"/>
        <Listitem title="Clients Manager" description="5 sites available" goto="/manage_clients"/>
      </div>
      <div className='flex w-full'>
        <Listitem title="Go" description="Manage your Mirrors and Contents" goto="/sitelist"/>
        {/* <Listitem title="Clients" description="5 sites available" goto="/manage_clients"/> */}
      </div>
    </div>
  )
}
