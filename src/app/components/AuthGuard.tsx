import { Navigate } from "react-router";

interface AuthGuardProps {
  children: React.ReactNode;
  userType?: "customer" | "provider" | "admin";
}

export function AuthGuard({ children, userType }: AuthGuardProps) {
  // Check if user is logged in by checking localStorage for caterlink_users
  const existingUsers = JSON.parse(localStorage.getItem('caterlink_users') || '[]');
  const isLoggedIn = existingUsers.length > 0;

  if (!isLoggedIn) {
    // Redirect to login with the appropriate user type
    return <Navigate to={`/login${userType ? `?type=${userType}` : ''}`} replace />;
  }

  // If userType is specified, check if the logged-in user has the correct type
  if (userType && existingUsers[0].userType !== userType) {
    // Redirect to appropriate dashboard based on user type
    if (existingUsers[0].userType === "provider") {
      return <Navigate to="/dashboard" replace />;
    } else if (existingUsers[0].userType === "admin") {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/providers" replace />;
    }
  }

  return <>{children}</>;
}