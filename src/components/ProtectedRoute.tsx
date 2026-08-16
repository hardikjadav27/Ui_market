import { Navigate, useLocation } from "react-router-dom";
import { getStoredToken, hasAcceptedRules } from "../utils/authStorage";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRules?: boolean;
}

function ProtectedRoute({ children, requireRules = false }: ProtectedRouteProps) {
  const token = getStoredToken();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (requireRules && !hasAcceptedRules()) {
    return <Navigate to="/rules" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default ProtectedRoute;
