import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Login from "./pages/Login.jsx";
import WorkerProfile from "./pages/WorkerProfile.jsx";
import ActivePolicy from "./pages/ActivePolicy.jsx";
import ClaimsHistory from "./pages/ClaimsHistory.jsx";
import RiskAlerts from "./pages/RiskAlerts.jsx";
import ZoneSuggestions from "./pages/ZoneSuggestions.jsx";
import RequireWorker from "./components/RequireWorker.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

function Layout({ children }) {
  const { isAuthenticated } = useAuth();
  return (
    <div className="layout">
      {isAuthenticated && <Sidebar />}
      <main className="content">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/profile"
              element={
                <RequireWorker>
                  <WorkerProfile />
                </RequireWorker>
              }
            />
            <Route
              path="/policy"
              element={
                <RequireWorker>
                  <ActivePolicy />
                </RequireWorker>
              }
            />
            <Route
              path="/claims"
              element={
                <RequireWorker>
                  <ClaimsHistory />
                </RequireWorker>
              }
            />
            <Route
              path="/alerts"
              element={
                <RequireWorker>
                  <RiskAlerts />
                </RequireWorker>
              }
            />
            <Route
              path="/zones"
              element={
                <RequireWorker>
                  <ZoneSuggestions />
                </RequireWorker>
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
