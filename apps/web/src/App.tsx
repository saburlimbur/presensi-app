import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  redirect,
} from "react-router-dom";
import { getAccessToken } from "@features/auth/store/auth.store";
import { lazy } from "react";
import HomePage from "@features/home/pages/HomePage";
import AppLayouts from "@shared/layouts/AppLayouts";
import SplashScreen from "@features/auth/pages/SplashScreen";
import AuthLayouts from "@shared/layouts/AuthLayouts";
import LoginPage from "@features/auth/pages/LoginPage";

const FaceEnrollPage = lazy(
  () => import("@features/auth/pages/FaceEnrollPage"),
);
const ForgotPasswordPage = lazy(
  () => import("@features/auth/pages/ForgotPasswordPage"),
);
const ResetPasswordPage = lazy(
  () => import("@features/auth/pages/ResetPasswordPage"),
);
const ProfilePage = lazy(() => import("@features/users/pages/ProfilePage"));
const AttendancePage = lazy(
  () => import("@features/attendance/pages/AttendancePage"),
);
const SchedulePage = lazy(
  () => import("@features/schedule/pages/SchedulePage"),
);
const RequestPage = lazy(() => import("@features/request/pages/RequestPage"));
const NotificationsPage = lazy(
  () => import("@features/notifications/pages/NotificationsPage"),
);

const requireAuth = () => (getAccessToken() ? null : redirect("/auth/login"));
const redirectIfAuthed = () => (getAccessToken() ? redirect("/home") : null);

const routes = createBrowserRouter([
  {
    path: "/",
    element: <AppLayouts />,
    children: [
      {
        index: true,
        loader: redirectIfAuthed,
        element: <SplashScreen />,
        handle: {
          title: "Welcome",
          description: "Initializing application",
        },
      },
      {
        path: "home",
        loader: requireAuth,
        element: <HomePage />,
        handle: {
          title: "Home",
          description: "Welcome back to your dashboard",
        },
      },
      {
        path: "attendance",
        loader: requireAuth,
        element: <AttendancePage />,
        handle: {
          title: "Attendance",
          description: "Track your daily attendance and history",
        },
      },
      {
        path: "profile",
        loader: requireAuth,
        element: <ProfilePage />,
        handle: {
          title: "Profile",
          description: "Manage your personal information",
        },
      },
      {
        path: "schedule",
        loader: requireAuth,
        element: <SchedulePage />,
        handle: {
          title: "Schedule",
          description: "View your upcoming shifts",
        },
      },
      {
        path: "request",
        loader: requireAuth,
        element: <RequestPage />,
        handle: {
          title: "Request",
          description: "Request for leave",
        },
      },
      {
        path: "notifications",
        loader: requireAuth,
        element: <NotificationsPage />,
        handle: {
          title: "Notifikasi",
          description: "Semua notifikasi kamu",
        },
      },
    ],
  },
  {
    path: "/auth",
    element: <AuthLayouts />,
    children: [
      {
        index: true,
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: "login",
        loader: redirectIfAuthed,
        element: <LoginPage />,
      },
      {
        path: "forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "reset-password",
        element: <ResetPasswordPage />,
      },
      {
        path: "enrolled",
        loader: requireAuth,
        element: <FaceEnrollPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

const App = () => {
  return <RouterProvider router={routes} />;
};

export default App;
