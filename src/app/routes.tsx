import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/LoginPage";
import { ProviderListingPage } from "./components/ProviderListingPage";
import { ProviderProfilePage } from "./components/ProviderProfilePage";
import { BookingPage } from "./components/BookingPage";
import { ProviderDashboard } from "./components/ProviderDashboard";
import { AdminPanel } from "./components/AdminPanel";
import { AuthGuard } from "./components/AuthGuard";
import { NotFound } from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LandingPage },
      { path: "login", Component: LoginPage },
      { path: "providers", Component: ProviderListingPage },
      { path: "providers/:id", Component: ProviderProfilePage },
      {
        path: "booking/:providerId",
        element: (
          <AuthGuard userType="customer">
            <BookingPage />
          </AuthGuard>
        )
      },
      {
        path: "dashboard",
        element: (
          <AuthGuard userType="provider">
            <ProviderDashboard />
          </AuthGuard>
        )
      },
      {
        path: "admin",
        element: (
          <AuthGuard userType="admin">
            <AdminPanel />
          </AuthGuard>
        )
      },
      { path: "*", Component: NotFound },
    ],
  },
]);
