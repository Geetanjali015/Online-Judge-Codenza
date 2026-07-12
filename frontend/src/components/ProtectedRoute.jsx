import { Navigate, useLocation } from 'react-router-dom';

import useAuth from '../hooks/useAuth.js';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="container-shell py-16">
        <div className="rounded-[2rem] border border-white/80 bg-white/80 p-8 text-slate-600 shadow-soft">
          Checking your session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
