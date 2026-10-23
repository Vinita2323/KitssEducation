import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './modules/user/context/AuthContext'
import { ToastProvider } from './modules/user/context/ToastContext'
import { LibraryProvider } from './modules/user/context/LibraryContext'
import { UserRoutes } from './modules/user/routes/UserRoutes'
import { AdminRoutes } from './modules/admin/routes/AdminRoutes'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <LibraryProvider>
            <Routes>
              {/* Admin Portal Routes */}
              <Route path="/admin/*" element={<AdminRoutes />} />
              {/* Student Portal Routes */}
              <Route path="/*" element={<UserRoutes />} />
            </Routes>
          </LibraryProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
