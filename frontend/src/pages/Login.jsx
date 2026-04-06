import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineDocumentText } from 'react-icons/hi2';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <HiOutlineDocumentText />
        </div>
        <h1>Welcome Back</h1>
        <p className="login-subtitle">Sign in to Vinzon's DigiPath</p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', padding: '14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
          <strong style={{ color: 'var(--text-secondary)' }}>Demo Accounts:</strong>
          <div style={{ marginTop: '6px', lineHeight: '1.8' }}>
            Admin: admin@vinzons.gov / admin123<br />
            Receptionist: receptionist@vinzons.gov / recep123<br />
            Engineering: engineering@vinzons.gov / engr123<br />
            Agriculture: agriculture@vinzons.gov / agri123
          </div>
        </div>
      </div>
    </div>
  );
}
