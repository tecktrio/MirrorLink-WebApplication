import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { MAKE_REGISTER, REQUEST_EMAIL_OTP } from '../../serverRequests/ServerRequests';
import './RegisterPage.css';

export default function RegisterVerifyPage() {
  const [registration, setRegistration] = useState(null);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try { setRegistration(JSON.parse(sessionStorage.getItem('mirrorlink_registration') || 'null')); }
    catch { setRegistration(null); }
  }, []);

  if (registration === null && !sessionStorage.getItem('mirrorlink_registration')) return <Navigate to="/register" replace />;
  if (!registration) return null;

  const sendCode = async () => {
    setBusy(true); setMessage('');
    try {
      await REQUEST_EMAIL_OTP(registration.email, 'register');
      setSent(true);
      setMessage('Verification code sent. Check your inbox.');
    } catch (error) { setMessage(error.message || 'Could not send the code. Try again.'); }
    finally { setBusy(false); }
  };

  const verifyAndCreateAccount = async (event) => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const result = await MAKE_REGISTER(registration.username, registration.password, registration.email, registration.contact, '', '', '', '', otp);
      Cookies.set('login_key', result.login_key, { expires: 30, path: '/' });
      Cookies.set('username', registration.email, { expires: 30, path: '/' });
      sessionStorage.removeItem('mirrorlink_registration');
      navigate('/pricing');
    } catch (error) { setMessage(error.message || 'The code was not accepted. Request a new one and try again.'); }
    finally { setBusy(false); }
  };

  return <main className="ml-landing ml-auth-page">
    <header className="ml-nav">
      <Link className="ml-brand" to="/"><span className="ml-brand-mark">M</span><span>MirrorLink</span></Link>
      <nav className="ml-nav-links"><Link to="/">Overview</Link><Link to="/pricing">Pricing</Link></nav>
      <Link className="ml-nav-cta" to="/login">Sign in <span className="ml-arrow">↗</span></Link>
    </header>
    <section className="ml-auth-layout">
      <div className="ml-auth-intro">
        <div className="ml-eyebrow"><span /> EMAIL CONFIRMATION</div>
        <h1>One last<br /><span>step.</span></h1>
        <p className="ml-hero-description">We’ll send a short verification code to confirm you can receive account updates.</p>
        <div className="ml-hero-note"><span className="ml-note-line" /> Codes expire after 10 minutes.</div>
      </div>
      <form className="ml-auth-card" onSubmit={verifyAndCreateAccount}>
        <div className="ml-auth-step">EMAIL VERIFICATION <span>02 / 02</span></div>
        <h2>Verify your email</h2>
        <p className="ml-auth-caption">Enter the code sent to <strong>{registration.email}</strong>.</p>
        {message && <div className="ml-auth-message">{message}</div>}
        <button className="ml-auth-code-button" type="button" disabled={busy} onClick={sendCode}>{sent ? 'Send a new code' : 'Send verification code'} <span>↗</span></button>
        <label className="ml-auth-field ml-auth-otp"><span>6-digit verification code</span><input inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" required placeholder="000000" value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} /></label>
        <button className="ml-button ml-button-dark ml-auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : 'Verify and create account'} <span className="ml-arrow">→</span></button>
        <p className="ml-auth-foot"><Link to="/register">← Edit account details</Link></p>
      </form>
    </section>
    <footer className="ml-footer"><Link className="ml-brand" to="/"><span className="ml-brand-mark">M</span><span>MirrorLink</span></Link><span>Wireless display management</span></footer>
  </main>;
}
