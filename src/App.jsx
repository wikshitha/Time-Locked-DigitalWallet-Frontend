import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import { useAuthStore } from "./store/useAuthStore.js";
import VaultsPage from "./pages/VaultsPage.jsx";

// 🧩 Protected route component
function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { token, fetchUser } = useAuthStore();

  // Load user info when token is available
  useEffect(() => {
    if (token) fetchUser();
  }, [token]);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/vaults" element={<VaultsPage />} />

        {/* ✅ Protected route for logged-in users */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all (redirect unknown routes) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
