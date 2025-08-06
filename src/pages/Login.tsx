import { useState } from 'react';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

export const LoginForm = ({ onSuccess, onSwitchToSignup, modal }: { onSuccess?: () => void, onSwitchToSignup?: () => void, modal?: boolean }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
      {modal && (
        <>
          <DialogTitle>Sign in to FreeBoard</DialogTitle>
          <DialogDescription>Access your whiteboard and collaborate with your team.</DialogDescription>
        </>
      )}
      <h2 className={`text-2xl font-bold mb-6 text-center${modal ? ' sr-only' : ''}`}>Login</h2>
      {error && <div className="mb-4 text-red-500 text-sm text-center">{error}</div>}
      <div className="mb-5">
        <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition mb-4 shadow-sm disabled:opacity-60"
        disabled={loading}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      <div className="flex items-center my-6">
        <div className="flex-grow border-t border-gray-200" />
        <span className="mx-3 text-xs text-gray-400">or</span>
        <div className="flex-grow border-t border-gray-200" />
      </div>
      <div className="text-center text-sm">
        Don&apos;t have an account?{' '}
        <button type="button" className="text-primary underline font-medium" onClick={onSwitchToSignup}>
          Sign up for free
        </button>
      </div>
    </form>
  );
};

const Login = () => (
  <div className="min-h-screen flex items-center justify-center bg-muted">
    <LoginForm />
  </div>
);

export default Login;