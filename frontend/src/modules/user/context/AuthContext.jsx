import { unregisterFCMToken } from '../services/pushNotificationService';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, clearLegacyAuthStorage } from '../services/authService';
import { advanceIdentityEpoch } from '../../../shared/api/httpClient';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deviceConflict, setDeviceConflict] = useState(null);
  const [transferBusy, setTransferBusy] = useState(false);
  const navigate = useNavigate();
  const epoch = useRef(0);
  const clear = () => { epoch.current++; advanceIdentityEpoch(); setUser(null); clearLegacyAuthStorage(); };
  useEffect(() => {
    clearLegacyAuthStorage();
    let alive = true;
    const refresh = () => { const ticket = epoch.current; return authService.getCurrentUser().then(value => { if (alive && ticket === epoch.current) { setUser(value); setError(''); } }).catch(() => { if (alive && ticket === epoch.current) { clear(); setError('Unable to check your session. Please retry.'); } }).finally(() => { if (alive) setLoading(false); }); };
    const expired = () => { if (alive) { clear(); setDeviceConflict(null); } };
    refresh();
    const timer = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    window.addEventListener('kitss:session-expired', expired);
    return () => { alive = false; clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('kitss:session-expired', expired); };
  }, []);
  const login = async (...args) => {
    epoch.current++;
    advanceIdentityEpoch();
    const result = await authService.login(...args);
    if (result.success) { clearLegacyAuthStorage(); setUser(result.user); setDeviceConflict(null); }
    else if (result.deviceConflict) setDeviceConflict(result);
    return result;
  };
  const transfer = async () => {
    if (!deviceConflict) return;
    epoch.current++; advanceIdentityEpoch(); setTransferBusy(true); setError('');
    try { const result = await authService.transfer({ challengeId: deviceConflict.challengeId, proof: deviceConflict.proof }); clearLegacyAuthStorage(); setUser(result.user); setDeviceConflict(null); navigate('/home'); }
    catch (failure) { setError(failure.message); setDeviceConflict(null); }
    finally { setTransferBusy(false); }
  };
  const logout = async () => { await unregisterFCMToken({ removeProvider: false }).catch(() => {}); epoch.current++; advanceIdentityEpoch(); await authService.logout(); clear(); setDeviceConflict(null); };
  return <AuthContext.Provider value={{ user, loading, error, isAuthenticated: Boolean(user), deviceConflict,
    login, logout, register: authService.register, updateProfile: async data => { const ticket = epoch.current; const result = await authService.updateProfile(data); if (ticket === epoch.current) setUser(result.user); return result; },
    deviceInfo: { deviceName: 'Browser' }, lastRegisteredCredentials: null, setLastRegisteredCredentials: () => {},
    can: permission => { const legacy = /^(books|coaching)\./.test(permission) ? (permission.endsWith('.read') ? 'learning.read' : permission.endsWith('.publish') ? 'learning.publish' : 'learning.write') : ({'learning.read':'access.read','access.revoke':'learning.grants.manage','registrations.review':'registrations.write','registrations.approve':'registrations.write'})[permission]; return Boolean(user?.permissions?.includes(permission) || legacy && user?.permissions?.includes(legacy)); }, handleTransferDeviceSession: transfer }}>
    {children}
    {error && <div role="status" className="fixed bottom-4 left-4 right-4 z-50 bg-amber-50 border rounded-xl p-3 text-sm text-[#0A1D3F]">{error}</div>}
    {deviceConflict && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1D3F]/80 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="transfer-title" className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 text-center">
        <h3 id="transfer-title" className="text-lg font-bold text-[#0A1D3F]">Account active in another session</h3>
        <p className="text-sm text-[#667085]">Confirm to sign out the previous browser and continue here. This confirmation expires in two minutes.</p>
        <button disabled={transferBusy} onClick={transfer} className="w-full p-3 bg-[#0A1D3F] text-white rounded-xl">{transferBusy ? 'Transferring…' : 'Confirm session transfer'}</button>
        <button disabled={transferBusy} onClick={() => setDeviceConflict(null)} className="p-2 text-sm">Cancel</button>
      </div>
    </div>}
  </AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
