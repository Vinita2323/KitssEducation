import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

export function RegistrationAccount({ applicantName = '', applicantEmail = '' }) {
  const { user, login, refreshSession } = useAuth();
  const [mode, setMode] = useState('create'), [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [otp, setOtp] = useState(''), [challenge, setChallenge] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (mode === 'create') { setName(applicantName); setEmail(applicantEmail); } }, [applicantName, applicantEmail, mode]);
  if (user?.emailVerified) return <aside className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm">Signed in as {user.email}. Your application will be saved to this account. <Link className="underline" to="/my-applications">My applications</Link></aside>;
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'create' && !user) {
        const result = await authService.createAccount({ name, email, password });
        if (!mounted.current) return;
        setChallenge(result.challengeId); setPassword(''); setMode('verify'); setMessage('Check your email for the verification code.');
      } else if (mode === 'verify') {
        await authService.activate({ challengeId: challenge, otp });
        if (user) await refreshSession();
        if (!mounted.current) return;
        setOtp(''); setMode('login'); setMessage('Email verified. Sign in below to continue your application.');
      } else {
        const result = await login(user?.email || email, password, false);
        if (!mounted.current) return;
        setPassword('');
        if (!result.success) setMessage(result.deviceConflict ? 'Confirm the account session to continue.' : 'Please check your email and password.');
      }
    } catch (failure) { if (mounted.current) setError(failure.message); }
    finally { if (mounted.current) setBusy(false); }
  };
  const resend = async () => {
    setBusy(true); setError('');
    try { const result = await authService.resend(user?.email || email); if (mounted.current) { setChallenge(result.challengeId); setMode('verify'); setMessage('A verification code has been requested. Check your email.'); } }
    catch (failure) { if (mounted.current) setError(failure.message); }
    finally { if (mounted.current) setBusy(false); }
  };
  const input = 'block w-full border rounded-xl p-2 mt-1 bg-white';
  return <section aria-label="Registration account" className="rounded-2xl border bg-white p-4 space-y-3">
    <h2 className="font-bold">{mode === 'verify' ? 'Verify your email' : user ? 'Verify your account to continue' : mode === 'login' ? 'Sign in to continue' : 'Create your login'}</h2>
    <p className="text-sm text-slate-600">Use the same email and password to sign in later. Your name and email are taken from the details you entered.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}{message && <p role="status">{message}</p>}
    {mode === 'create' && applicantEmail && <p className="text-xs text-slate-600">{applicantName} - {applicantEmail}</p>}
    <form aria-label="Registration account form" onSubmit={submit} className="space-y-3">
      <fieldset disabled={busy} className="space-y-3">
        {mode === 'create' && !user && !applicantName && <label className="block text-sm">Account full name<input className={input} value={name} onChange={e => setName(e.target.value)} required maxLength={100} autoComplete="name" /></label>}
        {!user && (mode !== 'create' || !applicantEmail) && <label className="block text-sm">Login email<input className={input} type="email" value={email} onChange={e => setEmail(e.target.value)} readOnly={mode === 'verify'} required autoComplete="email" /></label>}
        {mode === 'verify' ? <label className="block text-sm">Email verification code<input className={input} value={otp} onChange={e => setOtp(e.target.value)} pattern="[0-9]{6}" maxLength={6} inputMode="numeric" autoComplete="one-time-code" required /></label> : !user && <label className="block text-sm">{mode === 'create' ? 'Choose a password' : 'Account password'}<input className={input} type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={mode === 'create' ? 12 : undefined} maxLength={128} required autoComplete={mode === 'create' ? 'new-password' : 'current-password'} /></label>}
        {!user || mode === 'verify' ? <button type="submit" className="bg-[#0A1D3F] text-white rounded-xl px-4 py-2">{busy ? 'Please wait…' : mode === 'verify' ? 'Verify email' : mode === 'create' ? 'Create account and send code' : 'Sign in and continue'}</button> : null}
      </fieldset>
    </form>
    {(mode === 'verify' || user) && <button type="button" disabled={busy} onClick={resend} className="underline text-sm">Send verification code</button>}
    {!user && <button type="button" disabled={busy} onClick={() => { setMode(mode === 'login' ? 'create' : 'login'); setPassword(''); setOtp(''); setError(''); setMessage(''); }} className="underline text-sm">{mode === 'login' ? 'New here? Create your login' : 'Already have an account? Sign in here'}</button>}
  </section>;
}
