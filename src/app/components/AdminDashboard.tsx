import { Navigate } from "react-router";

export function AdminDashboard() {
  // Redirect to the new secure admin panel
  return <Navigate to="/admin" replace />;
}
