import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './RegisterPage.css';

const fields = [
  ['username', 'Name', 'Your name', 'text'],
  ['email', 'Email address', 'you@example.com', 'email'],
  ['password', 'Password', 'At least 8 characters', 'password'],
  ['contact', 'Phone (optional)', '+1 555 000 0000', 'tel'],
];

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', contact: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const continueToVerification = (event) => {
    event.preventDefault();
    if (form.password.length < 8) {
      setMessage('Use a password with at least 8 characters.');
      return;
    }
    sessionStorage.setItem('mirrorlink_registration', JSON.stringify(form));
    navigate('/register/verify');
  };

  return <main className="ml-landing ml-auth-page">
    <header className="ml-nav">
      <Link className="ml-brand" to="/"><span className="ml-brand-mark">M</span><span>MirrorLink</span></Link>
      <nav className="ml-nav-links"><Link to="/">Overview</Link><Link to="/pricing">Pricing</Link></nav>
      <Link className="ml-nav-cta" to="/login">Sign in <span className="ml-arrow">↗</span></Link>
    </header>
    <section className="ml-auth-layout">
      <div className="ml-auth-intro">
        <div className="ml-eyebrow"><span /> YOUR SCREENS, IN SYNC</div>
        <h1>Make room<br />to <span>connect.</span></h1>
        <p className="ml-hero-description">Create your MirrorLink account and manage every display from one simple control panel.</p>
        <div className="ml-hero-note"><span className="ml-note-line" /> Two quick steps. Then you’re ready to go.</div>
      </div>
      <form className="ml-auth-card" onSubmit={continueToVerification}>
        <div className="ml-auth-step">ACCOUNT SETUP <span>01 / 02</span></div>
        <h2>Create your account</h2>
        <p className="ml-auth-caption">Start with your details. We’ll verify your email on the next page.</p>
        {message && <div className="ml-auth-message">{message}</div>}
        {fields.map(([key, label, placeholder, type]) => <label className="ml-auth-field" key={key}>
          <span>{label}</span>
          <input type={type} required={key !== 'contact'} minLength={key === 'password' ? 8 : undefined} autoComplete={key === 'password' ? 'new-password' : key === 'email' ? 'email' : 'name'} placeholder={placeholder} value={form[key]} onChange={event => setForm({ ...form, [key]: event.target.value })} />
        </label>)}
        <button className="ml-button ml-button-dark ml-auth-submit" type="submit">Continue to email verification <span className="ml-arrow">→</span></button>
        <p className="ml-auth-foot">Already have an account? <Link to="/login">Sign in</Link></p>
      </form>
    </section>
    <footer className="ml-footer"><Link className="ml-brand" to="/"><span className="ml-brand-mark">M</span><span>MirrorLink</span></Link><span>Wireless display management</span></footer>
  </main>;
}
