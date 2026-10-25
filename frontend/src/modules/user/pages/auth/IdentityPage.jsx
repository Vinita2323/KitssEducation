import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
export function IdentityPage({ invitation = false, verify = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [invite] = useState(() => location.hash.slice(1).split('.'));
  React.useEffect(() => { if (location.hash) window.history.replaceState(null, '', location.pathname); }, []);
  const [challengeId, setChallengeId] = useState(location.state?.challengeId ?? '');
  const [mode, setMode] = useState(verify ? 'verify' : 'create');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (mode === 'verify') {
        const result = await authService.activate({ challengeId, otp });
        setOtp(''); navigate('/login', { state: { userId: result.user.email } });
      } else {
        const result = invitation ? await authService.acceptInvitation({ challengeId: invite[0] ?? '', token: invite[1] ?? '', newPassword: password }) : await authService.createAccount({ name, email, password });
        setChallengeId(result.challengeId); setPassword(''); setMode('verify'); setMessage(result.message);
      }
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  async function resend() {
    setBusy(true); setError('');
    try { const result = await authService.resend(email); setChallengeId(result.challengeId); setMessage(result.message); }
    catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  const input = 'w-full p-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-sm';
  return <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E6E8EC] shadow-sm max-w-md mx-auto space-y-4">
    <h2 className="text-xl font-bold text-[#0A1D3F]">{mode === 'verify' ? 'Verify your email' : invitation ? 'Accept staff invitation' : 'Create student account'}</h2>
    <p className="text-xs text-[#667085]">{mode === 'verify' ? 'Enter the email code. Verification grants no paid access.' : 'Use a password of 12 to 128 characters. Email verification is required.'}</p>
    {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <form onSubmit={submit} className="space-y-3">
      {mode === 'create' && !invitation && <label className="block text-xs">Full name<input className={input} value={name} onChange={e => setName(e.target.value)} required maxLength={100} autoComplete="name" /></label>}
      {(!invitation || mode === 'verify') && <label className="block text-xs">Email<input type="email" className={input} value={email} onChange={e => setEmail(e.target.value)} required={mode === 'create'} autoComplete="email" /></label>}
      {mode === 'verify' ? <label className="block text-xs">Email OTP<input className={input} value={otp} onChange={e => setOtp(e.target.value)} pattern="[0-9]{6}" maxLength={6} inputMode="numeric" autoComplete="one-time-code" required /></label> : <label className="block text-xs">Password<input type="password" className={input} value={password} onChange={e => setPassword(e.target.value)} minLength={12} maxLength={128} required autoComplete="new-password" /></label>}
      <button disabled={busy} className="w-full bg-[#0A1D3F] text-white rounded-xl p-3 disabled:opacity-50">{busy ? 'Please wait…' : mode === 'verify' ? 'Verify email' : invitation ? 'Set password' : 'Create account'}</button>
    </form>
    {mode === 'verify' && <button disabled={busy || !email} onClick={resend} className="text-xs text-[#FF8A00]">Resend code (60-second cooldown)</button>}
    <Link to="/login" className="block text-sm text-[#FF8A00]">Back to login</Link>
  </div>;
}
