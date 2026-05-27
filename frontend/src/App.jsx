import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/public/Landing'
import Login from './pages/public/Login'
import Register from './pages/public/Register'
import Pending from './pages/public/Pending'
import Dashboard from './pages/Dashboard'

// Investor pages
import Feed from './pages/investor/Feed'
import PitchView from './pages/investor/PitchView'
import MyInterests from './pages/investor/MyInterests'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminNegotiations from './pages/admin/AdminNegotiations'
import AdminMessages from './pages/admin/AdminMessages'

// Role-based redirect from /dashboard
function DashboardRedirect() {
  const { user } = useAuth()
  if (user?.role === 'investor') return <Navigate to="/investor/feed" replace />
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return <Dashboard />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pending" element={<Pending />} />

          {/* Dashboard — redirects investor to feed */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/negotiations" element={<ProtectedRoute><AdminNegotiations /></ProtectedRoute>} />
          <Route path="/admin/negotiations/:id/messages" element={<ProtectedRoute><AdminMessages /></ProtectedRoute>} />

          {/* Investor routes */}
          <Route
            path="/investor/feed"
            element={
              <ProtectedRoute>
                <Feed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/investor/pitches/:id"
            element={
              <ProtectedRoute>
                <PitchView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/investor/interests"
            element={
              <ProtectedRoute>
                <MyInterests />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
