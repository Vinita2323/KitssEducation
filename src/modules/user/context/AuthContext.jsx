import React, { createContext, useContext, useState, useEffect } from "react";
import { Smartphone, Laptop, ShieldAlert, LogOut, ArrowRight } from "lucide-react";
import { authService } from "../services/authService";
import { mockStudentUser } from "../data/mockUser";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(mockStudentUser);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastRegisteredCredentials, setLastRegisteredCredentials] = useState(() =>
    authService.getLastRegisteredCredentials()
  );
  const [deviceInfo, setDeviceInfo] = useState(authService.getCurrentDeviceInfo());
  const [deviceConflict, setDeviceConflict] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        const activeUser = currentUser || mockStudentUser;
        setUser(activeUser);
        setIsAuthenticated(true);

        // Validate Single Device Session
        const sessionCheck = authService.validateDeviceSession(activeUser.id);
        if (!sessionCheck.valid && sessionCheck.conflict) {
          setDeviceConflict(sessionCheck);
        } else {
          // Keep current device session fresh
          authService.transferSessionToCurrentDevice(activeUser.id);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (userId, password, rememberMe = true) => {
    const res = await authService.login(userId, password, rememberMe);
    if (res.success) {
      setUser(res.user);
      setIsAuthenticated(true);
      setDeviceConflict(null);
      setDeviceInfo(authService.getCurrentDeviceInfo());
    } else if (res.deviceConflict) {
      setDeviceConflict(res);
    }
    return res;
  };

  const handleTransferDeviceSession = () => {
    if (user) {
      authService.transferSessionToCurrentDevice(user.id);
      setDeviceConflict(null);
      setDeviceInfo(authService.getCurrentDeviceInfo());
    }
  };

  const register = async (formData) => {
    const res = await authService.register(formData);
    if (res.success) {
      setLastRegisteredCredentials(res.credentials);
      setUser(res.user);
      setIsAuthenticated(true);
      authService.transferSessionToCurrentDevice(res.user.id);
    }
    return res;
  };

  const updateProfile = async (profileData) => {
    const res = await authService.updateProfile(profileData);
    if (res.success) {
      setUser(res.user);
    }
    return res;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setDeviceConflict(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        deviceInfo,
        deviceConflict,
        lastRegisteredCredentials,
        setLastRegisteredCredentials,
        login,
        register,
        updateProfile,
        logout,
        handleTransferDeviceSession,
      }}
    >
      {children}

      {/* Single Device Session Conflict Modal */}
      {deviceConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1D3F]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#E6E8EC] p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FF8A00]/10 border border-[#FF8A00]/20 mx-auto flex items-center justify-center text-[#FF8A00]">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                Single Device Login Policy
              </span>
              <h3 className="text-lg font-black text-[#0A1D3F] tracking-tight">
                Account Active on Another Device
              </h3>
              <p className="text-xs text-[#667085] leading-relaxed">
                Your student account is currently active on:
              </p>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 text-xs font-semibold text-[#0A1D3F] flex items-center justify-center gap-2">
                <Laptop className="w-4 h-4 text-[#133C8B]" />
                <span>{deviceConflict.activeDevice || "Another Registered Device"}</span>
              </div>
            </div>

            <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-3 text-[11px] text-amber-900 text-left space-y-1">
              <p className="font-bold">Important Security Notice:</p>
              <p>KITSS Education permits only 1 active device session (Mobile or PC) per student account to protect proprietary video lectures & study materials.</p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleTransferDeviceSession}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0A1D3F] hover:bg-[#133C8B] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-98 cursor-pointer"
              >
                <span>Transfer Session to This Device</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={logout}
                className="w-full py-2 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#667085] font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out of Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
