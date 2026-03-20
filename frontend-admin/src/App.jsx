import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Overview from "./pages/Overview.jsx";
import Workers from "./pages/Workers.jsx";
import Disruptions from "./pages/Disruptions.jsx";
import Claims from "./pages/Claims.jsx";
import FraudAlerts from "./pages/FraudAlerts.jsx";
import Pools from "./pages/Pools.jsx";
import Login from "./pages/Login.jsx";
import RequireAdmin from "./components/RequireAdmin.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import "./styles.css";

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
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route
              path="/overview"
              element={
                <RequireAdmin>
                  <Overview />
                </RequireAdmin>
              }
            />
            <Route
              path="/workers"
              element={
                <RequireAdmin>
                  <Workers />
                </RequireAdmin>
              }
            />
            <Route
              path="/disruptions"
              element={
                <RequireAdmin>
                  <Disruptions />
                </RequireAdmin>
              }
            />
            <Route
              path="/claims"
              element={
                <RequireAdmin>
                  <Claims />
                </RequireAdmin>
              }
            />
            <Route
              path="/fraud"
              element={
                <RequireAdmin>
                  <FraudAlerts />
                </RequireAdmin>
              }
            />
            <Route
              path="/pools"
              element={
                <RequireAdmin>
                  <Pools />
                </RequireAdmin>
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
