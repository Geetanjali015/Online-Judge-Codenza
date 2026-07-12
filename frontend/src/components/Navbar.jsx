import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiCode, FiLogOut } from 'react-icons/fi';

import useAuth from '../hooks/useAuth.js';

const navLinkClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-slate-900 text-white shadow-sm'
      : 'text-slate-600 hover:bg-white hover:text-slate-950'
  }`;

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-xl">
      <nav className="container-shell flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink-900 text-white shadow-lg shadow-slate-900/20">
            <FiCode className="text-xl" aria-hidden="true" />
          </span>
          <span className="text-xl font-black tracking-tight text-ink-900">
            Codenza
          </span>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/problems" className={navLinkClass}>
              Problems
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/problems"
                className="btn-secondary px-4 py-2.5 md:hidden"
              >
                Problems
              </Link>
              <span className="hidden text-sm font-medium text-slate-600 sm:inline">
                Hi, {user?.name || 'Coder'}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-secondary gap-2 px-4 py-2.5"
              >
                <FiLogOut aria-hidden="true" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary px-4 py-2.5">
                Login
              </Link>
              <Link to="/register" className="btn-primary px-4 py-2.5">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
