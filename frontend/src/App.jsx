import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './modules/user/context/AuthContext'
import { ToastProvider } from './modules/user/context/ToastContext'
import { LibraryProvider } from './modules/user/context/LibraryContext'
import { UserRoutes } from './modules/user/routes/UserRoutes'
import { AdminRoutes } from './modules/admin/routes/AdminRoutes'
import { PushNotificationManager } from './modules/user/components/notifications/PushNotificationManager'

function SessionLibrary({ children }) {
  const { user, loading } = useAuth();
  // Resolve the initial browser identity before mounting editable routes. The
  // identity key below must still remount private state on a real account switch.
  if (loading) return <main role="status" className="p-6 text-sm text-[#0A1D3F]">Checking your session...</main>;
  return <LibraryProvider key={user?.id || 'guest'}>{children}</LibraryProvider>;
}
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <PushNotificationManager />
          <SessionLibrary>
            <Routes>
              {/* Admin Portal Routes */}
              <Route path="/admin/*" element={<AdminRoutes />} />
              {/* Student Portal Routes */}
              <Route path="/*" element={<UserRoutes />} />
            </Routes>
          </SessionLibrary>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
