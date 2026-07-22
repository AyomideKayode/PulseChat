import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const isLogin = useLocation().pathname === '/login';
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await signup({ fullName, email, password });
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '24px',
        background: 'var(--surface)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: '2.5rem',
            color: 'var(--accent)',
            textAlign: 'center',
            marginBottom: '8px',
          }}
        >
          PulseChat
        </h1>
        {!isLogin && (
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            required
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--text-primary)',
              fontSize: '1rem',
            }}
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--card)',
            color: 'var(--text-primary)',
            fontSize: '1rem',
          }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          minLength={8}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--card)',
            color: 'var(--text-primary)',
            fontSize: '1rem',
          }}
        />
        {error && <p style={{ color: '#E74C3C', fontSize: '0.875rem' }}>{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: submitting ? 'var(--text-secondary)' : 'var(--accent)',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
        </button>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <Link to={isLogin ? '/signup' : '/login'} style={{ color: 'var(--accent)' }}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </form>
    </div>
  );
}
