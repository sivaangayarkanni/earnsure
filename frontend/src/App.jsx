import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import RequireRole from "./components/RequireRole.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Notifications from "./components/Notifications.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import WorkerProfile from "./pages/WorkerProfile.jsx";
import ActivePolicy from "./pages/ActivePolicy.jsx";
import ClaimsHistory from "./pages/ClaimsHistory.jsx";
import RiskAlerts from "./pages/RiskAlerts.jsx";
import ZoneSuggestions from "./pages/ZoneSuggestions.jsx";
import IncomeStability from "./pages/IncomeStability.jsx";
import AdminOverview from "./pages/AdminOverview.jsx";
import AdminWorkers from "./pages/AdminWorkers.jsx";
import AdminDisruptions from "./pages/AdminDisruptions.jsx";
import AdminClaims from "./pages/AdminClaims.jsx";
import AdminFraudAlerts from "./pages/AdminFraudAlerts.jsx";
import AdminPools from "./pages/AdminPools.jsx";
import AdminDowntime from "./pages/AdminDowntime.jsx";
import AdminRiskMaps from "./pages/AdminRiskMaps.jsx";
import AdminAlerts from "./pages/AdminAlerts.jsx";
import "./styles.css";

function Layout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="content">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <BrowserRouter>
          <Notifications />
          <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          <Route path="/worker/profile" element={<RequireRole allow={["worker"]}><Layout><WorkerProfile /></Layout></RequireRole>} />
          <Route path="/worker/policy" element={<RequireRole allow={["worker"]}><Layout><ActivePolicy /></Layout></RequireRole>} />
          <Route path="/worker/claims" element={<RequireRole allow={["worker"]}><Layout><ClaimsHistory /></Layout></RequireRole>} />
          <Route path="/worker/alerts" element={<RequireRole allow={["worker"]}><Layout><RiskAlerts /></Layout></RequireRole>} />
          <Route path="/worker/stability" element={<RequireRole allow={["worker"]}><Layout><IncomeStability /></Layout></RequireRole>} />
          <Route path="/worker/zones" element={<RequireRole allow={["worker"]}><Layout><ZoneSuggestions /></Layout></RequireRole>} />

          <Route path="/admin/overview" element={<RequireRole allow={["admin"]}><Layout><AdminOverview /></Layout></RequireRole>} />
          <Route path="/admin/workers" element={<RequireRole allow={["admin"]}><Layout><AdminWorkers /></Layout></RequireRole>} />
          <Route path="/admin/disruptions" element={<RequireRole allow={["admin"]}><Layout><AdminDisruptions /></Layout></RequireRole>} />
          <Route path="/admin/claims" element={<RequireRole allow={["admin"]}><Layout><AdminClaims /></Layout></RequireRole>} />
          <Route path="/admin/alerts" element={<RequireRole allow={["admin"]}><Layout><AdminAlerts /></Layout></RequireRole>} />
          <Route path="/admin/maps" element={<RequireRole allow={["admin"]}><Layout><AdminRiskMaps /></Layout></RequireRole>} />
          <Route path="/admin/fraud" element={<RequireRole allow={["admin"]}><Layout><AdminFraudAlerts /></Layout></RequireRole>} />
          <Route path="/admin/downtime" element={<RequireRole allow={["admin"]}><Layout><AdminDowntime /></Layout></RequireRole>} />
          <Route path="/admin/pools" element={<RequireRole allow={["admin"]}><Layout><AdminPools /></Layout></RequireRole>} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
}
