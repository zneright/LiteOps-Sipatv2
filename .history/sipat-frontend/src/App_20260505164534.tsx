import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

// --- Citizen Zone ---
import CitizenLayout from "./components/layout/citizenlayout/CitizenLayout";
import CommitFeed from "./pages/citizen/CommitFeed";
import Explore from "./pages/citizen/Explore";
import Categories from "./pages/citizen/Categories";
import Saved from "./pages/citizen/Saved";
import Profile from "./pages/citizen/Profile";

// --- Agency Zone ---
import AgencyLayout from "./components/layout/agencylayout/AgencyLayout";
// MAKE SURE THIS MATCHES YOUR FILENAME: AgencyDashboard.tsx
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

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* FULL SCREEN AUTH */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* --- ADMIN  --- */}
            <Route path="/admin/*" element={
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/dashboard" element={<AdminDashboard />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AdminLayout>
            } />

            {/* --- AGENCY ZONE (Blue Theme) --- */}
            <Route path="/agency/*" element={
              <AgencyLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/agency/dashboard" replace />} />
                  <Route path="/dashboard" element={<AgencyDashboard />} />
                  <Route path="/uploader" element={<Uploader />} />
                  <Route path="/review/:id" element={<ReviewCommit />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AgencyLayout>
            } />

            {/* --- CITIZEN ZONE (Indigo/Purple Theme) --- */}
            <Route path="/*" element={
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
            } />

          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;