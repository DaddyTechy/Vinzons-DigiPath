import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import TrackDocument from './pages/TrackDocument';
import Transmissions from './pages/Transmissions';
import Offices from './pages/Offices';
import Users from './pages/Users';
import Archives from './pages/Archives';
import DocumentTypes from './pages/DocumentTypes';
import Reports from './pages/Reports';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/track" element={<TrackDocument />} />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documents" element={
              <ProtectedRoute roles={['admin', 'receptionist']}>
                <Documents />
              </ProtectedRoute>
            } />
            <Route path="/transmissions" element={<Transmissions />} />
            <Route path="/archives" element={<Archives />} />
            <Route path="/offices" element={
              <ProtectedRoute roles={['admin']}>
                <Offices />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute roles={['admin']}>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="/document-types" element={
              <ProtectedRoute roles={['admin']}>
                <DocumentTypes />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute roles={['admin']}>
                <Reports />
              </ProtectedRoute>
            } />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
