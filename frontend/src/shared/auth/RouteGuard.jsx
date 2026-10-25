import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../modules/user/context/AuthContext';
export function RouteGuard({ staff = false, permission, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p role="status" className="p-6 text-center text-[#667085]">Checking session…</p>;
  if (!user) return <Navigate to="/login" replace state={{ returnTo: location.pathname }} />;
  if ((staff && !user.roles.some(role => ['admin', 'super_admin'].includes(role))) || (permission && !user.permissions.includes(permission))) return <p role="alert" className="p-6 text-[#D92D20]">You do not have permission to view this page.</p>;
  return children ?? <Outlet />;
}
