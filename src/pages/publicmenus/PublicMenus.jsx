import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { GET_PUBLIC_MIRROR_MENUS } from '../../serverRequests/ServerRequests'
import './PublicMenus.css'

export default function PublicMenus() {
  const { shareToken } = useParams()
  const [menus, setMenus] = useState([])
  const [mirrorName, setMirrorName] = useState('Menu')
  const [error, setError] = useState('')
  const rail = useRef(null)
  useEffect(() => {
    GET_PUBLIC_MIRROR_MENUS(shareToken)
      .then(result => { setMenus(result.data || []); setMirrorName(result.mirror_name || 'Menu') })
      .catch(e => setError(e.message || 'This menu link is unavailable.'))
  }, [shareToken])
  const move = direction => rail.current?.scrollBy({ left: direction * rail.current.clientWidth, behavior: 'smooth' })

  return <main className="public-menu-page">
    <header className="public-menu-header"><span className="public-menu-brand"><b>M</b> MirrorLink</span><span>{mirrorName}</span></header>
    {error ? <div className="public-menu-message">{error}</div> : menus.length ? <>
      <div className="public-menu-controls"><span>{menus.length} active menu{menus.length === 1 ? '' : 's'}</span><div><button onClick={() => move(-1)} aria-label="Previous menu" disabled={menus.length < 2}>←</button><button onClick={() => move(1)} aria-label="Next menu" disabled={menus.length < 2}>→</button></div></div>
      <div className="public-menu-rail" ref={rail}>{menus.map(menu => <article className="public-menu-slide" key={menu._id}>
        {menu.image_url ? <img className="public-menu-artwork" src={menu.image_url} alt={menu.title || 'Menu'} /> : <div className={`public-menu-html ${menu.layout || 'classic'} ${menu.custom_layout ? 'custom-layout' : ''}`} style={{ '--menu-background': menu.background, '--menu-accent': menu.accent, ...(menu.custom_layout ? { aspectRatio: menu.orientation === 'portrait' ? '10 / 16' : '16 / 10', width: '100%', maxWidth: menu.orientation === 'portrait' ? '620px' : '1100px', minHeight: 'unset', padding: 0 } : {}) }} dangerouslySetInnerHTML={{ __html: menu.html }} />}
      </article>)}</div>
      {menus.length > 1 && <p className="public-menu-hint">Swipe or scroll sideways to see more menus</p>}
    </> : <div className="public-menu-message">No active menus are available for this mirror yet.</div>}
    <footer className="public-menu-footer">Made by <a href="https://bigburry.com" target="_blank" rel="noopener noreferrer">Bigburry Hypersystems LLP</a></footer>
  </main>
}
