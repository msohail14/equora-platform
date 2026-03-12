import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PublicOnlyRoute = () => {
  const { admin, token, initialized } = useSelector((state) => state.auth);

  if (!initialized) {
    return <div className="page-loader">Loading session...</div>;
  }

  if (admin && token) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicOnlyRoute;
