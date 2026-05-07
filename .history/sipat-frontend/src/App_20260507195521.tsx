import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

// --- Landing Page ---
import LandingPage from "./pages/landingpage"; // 🚀 IMPORT LANDING PAGE HERE

// --- Citizen Zone ---
import CitizenLayout from "./components/layout/citizenlayout/CitizenLayout";
import CommitFeed from "./pages/citizen/CommitFeed";
import Explore from "./pages/citizen/Explore";
import Categories from "./pages/citizen/Categories";
import Saved from "./pages/citizen/Saved";
import Profile from "./pages/citizen/Profile";
import PublicProfile from './pages/citizen/PublicProfile';
import PublicAgencyProfile from "./pages/citizen/PublicAgencyProfile";
import Search from "./pages/citizen/Search";

// --- Agency Zone ---
import AgencyLayout from "./components/layout/agencylayout/AgencyLayout";
import AgencyDashboard from "./pages/agency/AgencyDashboard";
import Uploader from "./pages/agency/Uploader";
import ManageProjects from "./pages/agency/ManageProjects";
import AgencyFeedback from "./pages/agency/AgencyFeedback";
import AgencyProfile from "./pages/agency/AgencyProfile";
import AgencyAnalytics from './pages/agency/AgencyAnalytics';

// --- Admin Zone ---
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLayout from "./components/layout/adminlayout/AdminLayout";
import ManageUsers from "./pages/admin/ManageUsers";
import SystemLogs from "./pages/admin/SystemLogs";

// --- Auth Pages ---
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import NotFound from "./pages/auth/NotFound";
import ProjectView from "./pages/citizen/ProjectView";

// ==========================================
// 🛡️ ROUTE GUARDS (Role-Based Access Control)
// ==========================================

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role } = useAuth();

  if (user && role) {
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (role === "agency") return <Navigate to="/agency/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
};

const ProtectedRoute = ({ allowedRoles, children }: { allowedRoles: string[], children: React.ReactNode }) => {
  const { user, role } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (role && !allowedRoles.includes(role)) {
    if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (role === "agency") return <Navigate to="/agency/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* --- PUBLIC / AUTH ROUTES --- */}
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} /> {/* 🚀 ADDED LANDING PAGE */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/public-profile/:authorName" element={<PublicProfile />} />
            <Route path="/agency-profile/:name" element={<PublicAgencyProfile />} />

            {/* --- ADMIN ZONE --- */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="/dashboard" element={<AdminDashboard />} />
                    <Route path="explore" element={<Explore />} />
                    <Route path="users" element={<ManageUsers />} />
                    <Route path="logs" element={<SystemLogs />} />
                    <Route path="project/:id" element={<ProjectView />} />
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
                    <Route path="/manage-projects" element={<ManageProjects />} />
                    <Route path="/feedback" element={<AgencyFeedback />} />
                    <Route path="/review/:id" element={<ReviewCommit />} />
                    <Route path="/project/:id" element={<ProjectView />} />
                    <Route path="/profile" element={<AgencyProfile />} />
                    <Route path="/analytics" element={<AgencyAnalytics />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AgencyLayout>
              </ProtectedRoute>
            } />

            {/* --- CITIZEN ZONE --- */}
            <Route path="/*" element={
              <ProtectedRoute allowedRoles={["citizen", "admin", "agency"]}>
                <CitizenLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path="/home" element={<CommitFeed />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/saved" element={<Saved />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/project/:id" element={<ProjectView />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/public-profile/:name" element={<PublicProfile />} />
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