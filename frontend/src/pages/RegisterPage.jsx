import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

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

  return 'Unable to create your account. Please try again.';
};

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await register(formData);
      setSuccess(response.message || 'Account created successfully.');

      setTimeout(() => {
        navigate('/login');
      }, 900);
    } catch (registerError) {
      setError(getErrorMessage(registerError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="container-shell flex min-h-[calc(100vh-10rem)] items-center justify-center py-16">
      <div className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white/90 p-8 shadow-soft">
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-codenza-700">
            Join Codenza
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-ink-900">
            Create your account
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Start building a stronger coding practice routine.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
            <FiCheckCircle className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>{success} Redirecting to login...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-semibold text-ink-800">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              className="auth-input"
              placeholder="Ada Lovelace"
              required
              minLength={2}
            />
          </div>

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
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              className="auth-input"
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-codenza-700 hover:text-codenza-600">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
};

export default RegisterPage;
