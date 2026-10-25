import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Card, { CardBody } from '../Card/Card';
import Button from '../Button/Button';

export default function ProtectedRoute({ children, allowedRoles = null }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="container section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--slate-600)' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--slate-200)',
            borderTopColor: 'var(--teal-600)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Verifying secure session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div className="container section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
          <CardBody style={{ padding: '3rem 2rem' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--amber-50, #fef3c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: 'var(--amber-600, #d97706)'
            }}>
              <ShieldAlert size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: 'var(--navy-900)' }}>
              Access Restricted
            </h2>
            <p style={{ color: 'var(--slate-600)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              This portal requires <strong>{allowedRoles.join(' or ')}</strong> role permissions. Your current role is <strong>{user?.role}</strong>.
            </p>
            <Link to="/">
              <Button variant="primary" leftIcon={<ArrowLeft size={16} />}>
                Return to MediShare Homepage
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  return children;
}

