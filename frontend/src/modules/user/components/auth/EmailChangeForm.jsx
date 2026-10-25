import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
export function EmailChangeForm() {
  const [newEmail, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [challengeId, setChallenge] = useState(''),
    [otp, setOtp] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const {
    logout
  } = useAuth();
  const navigate = useNavigate();
  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (!challengeId) {
        const result = await authService.requestEmailChange({
          newEmail,
          currentPassword: password
        });
        setChallenge(result.challengeId);
        setPassword('');
        setMessage(result.message);
      } else {
        await authService.confirmEmailChange({
          challengeId,
          otp
        });
        await logout();
        navigate('/login');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return <form onSubmit={submit} className="bg-white border rounded-3xl p-5 space-y-3"><h2 className="font-bold text-[#0A1D3F]">Change email securely</h2><p className="text-xs">Confirm your password, then enter the code sent to the new email. Confirmation signs out existing sessions.</p>{error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}{!challengeId ? <><label className="block text-sm">New email<input aria-label="New email" type="email" required value={newEmail} onChange={e => setEmail(e.target.value)} className="block w-full border p-3 rounded-xl" /></label><label className="block text-sm">Current password<input aria-label="Email change password" type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="block w-full border p-3 rounded-xl" /></label></> : <label className="block text-sm">Confirmation code<input aria-label="Email confirmation code" inputMode="numeric" pattern="[0-9]{6}" required value={otp} onChange={e => setOtp(e.target.value)} className="block w-full border p-3 rounded-xl" /></label>}<button disabled={busy} className="bg-[#0A1D3F] text-white p-3 rounded-xl disabled:opacity-40">{busy ? 'Please wait...' : challengeId ? 'Confirm email change' : 'Send confirmation code'}</button>{challengeId && <button type="button" disabled={busy} onClick={() => {
      setChallenge('');
      setOtp('');
      setMessage('');
    }} className="p-3">Start again</button>}</form>;
}
