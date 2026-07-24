import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const USER_ERRORS: Record<string, string> = {
  'Invalid credentials provided.': 'Invalid email or password.',
  'Unable to create account with provided details.':
    'An account with this email already exists.',
  'Invalid email format.': 'Please enter a valid email address.',
  'Password must be at least 8 characters long.':
    'Password must be at least 8 characters long.',
  'All fields are required.': 'All fields are required.',
};

function mapError(msg: string): string {
  return USER_ERRORS[msg] ?? msg;
}

export default function AuthPage() {
  const isLogin = useLocation().pathname === '/login';
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setError(mapError(err instanceof Error ? err.message : 'Something went wrong'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-full flex items-center justify-center p-6 bg-surface relative overflow-hidden">
      <div className="absolute top-[-80px] right-[-80px] h-[200px] w-[200px] rounded-full bg-accent/5 blur-[60px]" />
      <div className="absolute bottom-[-80px] left-[-80px] h-[200px] w-[200px] rounded-full bg-accent/5 blur-[60px]" />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[400px] flex flex-col gap-5 relative"
      >
        <div className="text-center mb-4">
          <h1 className="font-serif text-[2.5rem] text-accent animate-fade-in">
            PulseChat
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>
        {!isLogin && (
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            required
            className="px-4 py-3 rounded-lg border border-border bg-card text-text-primary text-base outline-none focus:border-accent transition-colors"
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="px-4 py-3 rounded-lg border border-border bg-card text-text-primary text-base outline-none focus:border-accent transition-colors"
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={8}
            className="w-full px-4 py-3 pr-11 rounded-lg border border-border bg-card text-text-primary text-base outline-none focus:border-accent transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-text-secondary cursor-pointer p-1 flex"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {error && (
          <p className="text-[#E74C3C] text-sm bg-[rgba(231,76,60,0.1)] px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className={`py-3 rounded-lg border-none text-base font-semibold text-white transition-opacity ${
            submitting
              ? 'bg-text-secondary cursor-not-allowed opacity-60'
              : 'bg-accent cursor-pointer hover:opacity-90'
          }`}
        >
          {submitting
            ? 'Please wait...'
            : isLogin
              ? 'Sign In'
              : 'Create Account'}
        </button>
        <p className="text-center text-text-secondary text-sm">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <Link
            to={isLogin ? '/signup' : '/login'}
            className="text-accent hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </form>
    </div>
  );
}
