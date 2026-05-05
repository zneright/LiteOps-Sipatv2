import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

// --- Citizen Zone ---
import CitizenLayout from "./components/layout/citizenlayout/CitizenLayout";
import CommitFeed from "./pages/citizen/CommitFeed";
import Explore from "./pages/citizen/Explore";
import Categories from "./pages/citizen/Categories";
import Saved from "./pages/citizen/Saved";
import Profile from "./pages/citizen/Profile";

// --- Agency Zone ---
import AgencyLayout from "./components/layout/agencylayout/AgencyLayout";
import AgencyDashboard from "./pages/agency/AgencyDashboard";
import Uploader from "./pages/agency/Uploader";
import ReviewCommit from "./pages/agency/ReviewCommit";

// --- Admin Zone ---
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLayout from "./components/layout/adminlayout/AdminLayout";

// --- Auth Pages ---
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import NotFound from "./pages/auth/NotFound";

// ==========================================
// 🛡️ ROUTE GUARDS (Role-Based Access Control)
// ==========================================

// Prevents logged-in users from seeing Login/Signup pages
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role } = useAuth();

  if (user && role) {
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (role === "agency") return <Navigate to="/agency/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
};

// Protects routes and ensures only allowed roles can access them
const ProtectedRoute = ({ allowedRoles, children }: { allowedRoles: string[], children: React.ReactNode }) => {
  const { user, role } = useAuth();

  // 1. If not logged in, kick to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. If logged in but role doesn't match, kick to their proper dashboard
  if (role && !allowedRoles.includes(role)) {
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (role === "agency") return <Navigate to="/agency/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }

  // 3. Authorized! Render the component
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* --- PUBLIC / AUTH ROUTES --- */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } />

            {/* --- ADMIN ZONE --- */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="/dashboard" element={<AdminDashboard />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* --- AGENCY ZONE --- */}
            <Route path="/agency/*" element={
              <ProtectedRoute allowedRoles={["agency"]}>
                <AgencyLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/agency/dashboard" replace />} />
                    <Route path="/dashboard" element={<AgencyDashboard />} />
                    <Route path="/uploader" element={<Uploader />} />
                    <Route path="/review/:id" element={<ReviewCommit />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AgencyLayout>
              </ProtectedRoute>
            } />

            {/* --- CITIZEN ZONE --- */}
            <Route path="/*" element={
              <ProtectedRoute allowedRoles={["citizen", "admin", "agency"]}>
                {/* Note: Added admin and agency above so they can still browse the public feed if they want to. 
                    If you want STRICT isolation, change to allowedRoles={["citizen"]} */}
                <CitizenLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path="/home" element={<CommitFeed />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/saved" element={<Saved />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </CitizenLayout>
              </ProtectedRoute>
            } />

          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;