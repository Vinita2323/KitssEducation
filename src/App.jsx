import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './modules/user/context/AuthContext'
import { ToastProvider } from './modules/user/context/ToastContext'
import { LibraryProvider } from './modules/user/context/LibraryContext'
import { UserRoutes } from './modules/user/routes/UserRoutes'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <LibraryProvider>
            <UserRoutes />
          </LibraryProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
