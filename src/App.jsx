// eslint-disable-next-line no-unused-vars
import React, { useContext } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AppContext } from './context/AppContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Doctors from './pages/Doctors'
import Login from './pages/Login'
import About from './pages/About'
import Contact from './pages/Contact'
import MyProfile from './pages/MyProfile'
import MyAppointments from './pages/MyAppointments'
import Appointment from './pages/Appointment'
import AdminDashboard from './pages/AdminDashboard'
import DoctorDashboard from './pages/DoctorDashboard'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, token } = useContext(AppContext);
  
  if (!token) {
    return <Login />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    </div>;
  }
  
  return children;
};

// Role-based Dashboard Component
const Dashboard = () => {
  const { user } = useContext(AppContext);
  
  switch (user?.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    default:
      return <Home />;
  }
};

function App() {
  const { user } = useContext(AppContext);

  return (
    <div className='mx-4 sm:mx-[10%]'>
      <Navbar />
      <main className="min-h-screen">
        <Routes>
          {/* Public Routes - Only accessible to patients or non-logged users */}
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/doctors" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <Doctors />
            </ProtectedRoute>
          } />
          <Route path="/doctors/:speciality" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <Doctors />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <About />
            </ProtectedRoute>
          } />
          <Route path="/contact" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <Contact />
            </ProtectedRoute>
          } />
          <Route path="/appointment/:docId" element={
            <ProtectedRoute allowedRoles={['patient']}>
              <Appointment />
            </ProtectedRoute>
          } />
          
          {/* Patient-only Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-profile" 
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <MyProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-appointments" 
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <MyAppointments />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Doctor Routes */}
          <Route 
            path="/doctor" 
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
