import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/layout/Navbar/Navbar';
import Footer from './components/layout/Footer/Footer';
import Home from './pages/Home/Home';
import Marketplace from './pages/Marketplace/Marketplace';
import EquipmentDetails from './pages/EquipmentDetails/EquipmentDetails';
import Button from './components/common/Button/Button';
import Card, { CardBody } from './components/common/Card/Card';
import { ArrowLeft, Construction } from 'lucide-react';

// Friendly placeholder stub for routes that will be implemented in subsequent phases
function ComingSoonPage({ title, phase, description }) {
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
            {title}
          </h2>
          <span style={{
            display: 'inline-block',
            backgroundColor: 'var(--teal-100)',
            color: 'var(--teal-800)',
            fontSize: '0.8125rem',
            fontWeight: 700,
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            marginBottom: '1.25rem'
          }}>
            Scheduled for {phase}
          </span>
          <p style={{ color: 'var(--slate-600)', marginBottom: '2rem', lineHeight: 1.6 }}>
            {description}
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
    <div className="app">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/equipment/:id" element={<EquipmentDetails />} />
          <Route
            path="/login"
            element={
              <ComingSoonPage
                title="User Authentication"
                phase="Phase 3"
                description="Secure login with JWT tokens, password hashing with bcrypt, role-based access control (Seeker, Owner, Admin) is scheduled for Phase 3."
              />
            }
          />
          <Route
            path="/register"
            element={
              <ComingSoonPage
                title="Account Registration"
                phase="Phase 3"
                description="Seeker registration and Owner partner application workflow with pending verification is scheduled for Phase 3."
              />
            }
          />
          <Route
            path="/admin/login"
            element={
              <ComingSoonPage
                title="Administrative Console"
                phase="Phase 8"
                description="Admin credential verification, owner approval moderation, dispute investigations, and audit logs are scheduled for Phase 8."
              />
            }
          />
          <Route
            path="*"
            element={
              <ComingSoonPage
                title="Page Not Found"
                phase="Phase 1"
                description="The page you are looking for does not exist. Use the button below to return to the MediShare homepage."
              />
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

