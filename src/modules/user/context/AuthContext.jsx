import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import { mockStudentUser } from "../data/mockUser";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(mockStudentUser);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastRegisteredCredentials, setLastRegisteredCredentials] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        } else {
          // Default to authenticated demo student for seamless experience, or persist
          setUser(mockStudentUser);
          setIsAuthenticated(true);
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
    }
    return res;
  };

  const register = async (formData) => {
    const res = await authService.register(formData);
    if (res.success) {
      setLastRegisteredCredentials(res.credentials);
      setUser(res.user);
      setIsAuthenticated(true);
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
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        lastRegisteredCredentials,
        setLastRegisteredCredentials,
        login,
        register,
        updateProfile,
        logout
      }}
    >
      {children}
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
