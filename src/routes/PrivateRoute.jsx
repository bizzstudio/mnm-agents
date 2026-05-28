import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { agent } = useAuth();
  const location = useLocation();
  const token = localStorage.getItem("agentToken");
  if (!token || !agent) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

export default PrivateRoute;
