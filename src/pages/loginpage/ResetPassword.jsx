import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { REQUEST_EMAIL_OTP, RESET_PASSWORD } from '../../serverRequests/ServerRequests';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const requestCode = async () => { setBusy(true); setMessage(''); try { await REQUEST_EMAIL_OTP(email, 'reset_password'); setSent(true); setMessage('If this account exists, a code has been sent to its email.'); } catch (e) { setMessage(e.message); } finally { setBusy(false); } };
  const submit = async (event) => { event.preventDefault(); setBusy(true); setMessage(''); try { await RESET_PASSWORD(email, otp, password); navigate('/login'); } catch (e) { setMessage(e.message); } finally { setBusy(false); } };
  return <main className="min-h-screen bg-black flex items-center justify-center p-6"><section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"><h1 className="text-2xl font-black">Reset your password</h1><p className="my-2 text-sm text-neutral-500">Verify your email with a one-time code.</p>{message && <p className="my-4 rounded-xl bg-neutral-100 p-3 text-sm">{message}</p>}<form onSubmit={submit} className="space-y-4"><label className="block text-sm">Email address<input className="mt-1 w-full rounded-lg border p-3" type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label><button type="button" disabled={busy} onClick={requestCode} className="w-full rounded-xl border p-3 font-semibold">{sent ? 'Resend code' : 'Send verification code'}</button><label className="block text-sm">Verification code<input className="mt-1 w-full rounded-lg border p-3" inputMode="numeric" required value={otp} onChange={e => setOtp(e.target.value)} /></label><label className="block text-sm">New password<input className="mt-1 w-full rounded-lg border p-3" type="password" minLength="8" required value={password} onChange={e => setPassword(e.target.value)} /></label><button disabled={busy} className="w-full rounded-xl bg-black p-3 font-semibold text-white">Update password</button></form><p className="mt-5 text-center text-sm"><Link className="underline" to="/login">Back to sign in</Link></p></section></main>;
}
