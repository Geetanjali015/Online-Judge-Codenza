import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiAlertCircle } from 'react-icons/fi';

import useAuth from '../hooks/useAuth.js';

const getErrorMessage = (error) => {
  if (!error.response) {
    return 'Unable to reach the backend. Please check that the server is running and CORS is configured.';
  }

  const data = error.response?.data;

  if (data?.message) return data.message;
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors[0].msg;
  }

  return 'Unable to login. Please try again.';
};

const LoginPage = () => {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(formData);
      navigate(location.state?.from?.pathname || '/');
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="container-shell flex min-h-[calc(100vh-10rem)] items-center justify-center py-16">
      <div className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white/90 p-8 shadow-soft">
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-codenza-700">
            Welcome back
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-ink-900">
            Login to Codenza
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Continue practicing with your secure Codenza account.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-ink-800">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className="auth-input"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-ink-800">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              className="auth-input"
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          New to Codenza?{' '}
          <Link to="/register" className="font-bold text-codenza-700 hover:text-codenza-600">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
};

export default LoginPage;
