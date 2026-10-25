import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar/Navbar';
import Footer from './components/layout/Footer/Footer';
import Home from './pages/Home/Home';
import Marketplace from './pages/Marketplace/Marketplace';
import EquipmentDetails from './pages/EquipmentDetails/EquipmentDetails';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import MyBookings from './pages/Bookings/MyBookings';
import OwnerBookings from './pages/Bookings/OwnerBookings';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ProtectedRoute from './components/common/ProtectedRoute/ProtectedRoute';
import Button from './components/common/Button/Button';
import Card, { CardBody } from './components/common/Card/Card';
import { ArrowLeft, Construction } from 'lucide-react';

// Friendly 404 Page
function NotFoundPage() {
  return (
    <div className="container section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ maxWidth: '560px', width: '100%', textAlign: 'center' }}>
        <CardBody style={{ padding: '3rem 2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--teal-50)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: 'var(--teal-600)'
          }}>
            <Construction size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: 'var(--navy-900)' }}>
            Page Not Found
          </h2>
          <p style={{ color: 'var(--slate-600)', marginBottom: '2rem', lineHeight: 1.6 }}>
            The requested page does not exist or may have been moved. Return to the homepage or explore available equipment in the catalog.
          </p>
          <Link to="/">
            <Button variant="outline" leftIcon={<ArrowLeft size={16} />}>
              Back to MediShare Homepage
            </Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Navbar />
        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/equipment/:id" element={<EquipmentDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />

            {/* Phase 4 Protected Seeker Routes */}
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />

            {/* Phase 4 Protected Owner / Equipment Partner Routes */}
            <Route
              path="/owner/bookings"
              element={
                <ProtectedRoute allowedRoles={['owner', 'admin']}>
                  <OwnerBookings />
                </ProtectedRoute>
              }
            />

            {/* Phase 5 Protected Administrator Governance Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
