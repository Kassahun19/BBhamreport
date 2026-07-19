import { useState, useEffect } from "react";
import { 
  fetchReports, 
  fetchSummary, 
  fetchStatistics, 
  getStoredUser, 
  logout, 
  deleteReport 
} from "./utils/api";
import { DailyReport, DashboardSummary, Statistics, User } from "./types";

// Component imports
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import DailyReportEntry from "./components/DailyReportEntry";
import ReportsPage from "./components/ReportsPage";
import StatisticsPage from "./components/StatisticsPage";
import AboutContactPage from "./components/AboutContactPage";
import AuditLogsPage from "./components/AuditLogsPage";
import TelegramBotConfigPage from "./components/TelegramBotConfigPage";
import LoginModal from "./components/LoginModal";

import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

export default function App() {
  // Navigation & Authentication
  const [currentView, setView] = useState<string>("home");
  const [user, setUser] = useState<User | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Core Data States
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [editTarget, setEditTarget] = useState<DailyReport | null>(null);

  // Loading States
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Toast Notification System State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const triggerToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    // Auto clear after 4 seconds
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Hydrate user session from local storage on load
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
    }
    // Pull summaries initially so Landing/Dashboard counters are ready
    loadDashboardSummary();
    loadReportsList();
    loadStatistics();

    // Parse URL search query parameters for deep linking
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get("view");
    const loginParam = params.get("login");

    if (viewParam) {
      const validViews = ["home", "dashboard", "daily-report", "reports", "statistics", "audit-logs", "telegram", "about", "contact"];
      if (validViews.includes(viewParam)) {
        setView(viewParam);
        triggerToast(`Navigated directly to ${viewParam.toUpperCase()} view.`, "success");
      }
    }

    if (loginParam === "true" || viewParam === "login") {
      setIsLoginOpen(true);
    }
  }, []);

  // API Refresh trigger callbacks
  const loadReportsList = async () => {
    setIsLoadingReports(true);
    try {
      const data = await fetchReports();
      setReports(data);
    } catch (err: any) {
      console.error("Failed to load reports:", err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const loadDashboardSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const data = await fetchSummary();
      setSummary(data);
    } catch (err: any) {
      console.error("Failed to load dashboard summaries:", err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const loadStatistics = async () => {
    setIsLoadingStats(true);
    try {
      const data = await fetchStatistics();
      setStats(data);
    } catch (err: any) {
      console.error("Failed to load statistics:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleRefreshAll = () => {
    loadDashboardSummary();
    loadReportsList();
    loadStatistics();
    triggerToast("Synced live database metrics!", "success");
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setView("home");
    triggerToast("Signed out successfully. Security cleared.", "success");
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    handleRefreshAll();
    setView("dashboard"); // redirect to active workspace dashboard on success
  };

  // CRUD Table Handlers passed to Reports
  const handleEditReport = (report: DailyReport) => {
    if (user?.role !== "admin") {
      const createdTime = new Date(report.created_at).getTime();
      const elapsedHours = (Date.now() - createdTime) / (1000 * 60 * 60);
      if (elapsedHours > 24) {
        triggerToast("Editing is disabled. Campaign reports can only be edited within 24 hours of submission.", "error");
        return;
      }
    }
    setEditTarget(report);
    setView("daily-report"); // switch tab to editor form
  };

  const handleDeleteReport = async (id: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this campaign report? This action is irreversible.")) {
      return;
    }
    try {
      await deleteReport(id);
      triggerToast("Daily report deleted successfully", "success");
      // Refresh summaries
      handleRefreshAll();
    } catch (err: any) {
      triggerToast(err.message || "Failed to delete report", "error");
    }
  };

  return (
    <div id="bunna-app" className="min-h-screen flex flex-col bg-[#fcfdfa] relative">
      
      {/* Absolute Toast Notification Overlay */}
      <div className="fixed top-20 right-4 z-[9999] max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`p-4 rounded-2xl border shadow-xl flex items-start gap-3 pointer-events-auto ${
                toast.type === "success" 
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                  : "bg-red-50 border-red-100 text-red-800"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs text-left">
                <p className="font-extrabold font-mono uppercase tracking-wider">
                  {toast.type === "success" ? "Operation Success" : "Validation / Server Alert"}
                </p>
                <p className="mt-0.5 font-medium leading-relaxed">{toast.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main sticky navigation header */}
      <Navbar 
        currentView={currentView}
        setView={setView}
        user={user}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* View switching panel frame with staggered animations */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {currentView === "home" && (
              <LandingPage 
                summary={summary}
                setView={setView}
                user={user}
                onOpenLogin={() => setIsLoginOpen(true)}
              />
            )}

            {currentView === "dashboard" && (
              <Dashboard 
                summary={summary}
                reports={reports}
                onRefresh={handleRefreshAll}
                isLoading={isLoadingSummary}
                setView={setView}
              />
            )}

            {currentView === "daily-report" && (
              <DailyReportEntry 
                user={user}
                onReportSaved={handleRefreshAll}
                editTarget={editTarget}
                clearEditTarget={() => setEditTarget(null)}
                onNotification={triggerToast}
              />
            )}

            {currentView === "reports" && (
              <ReportsPage 
                reports={reports}
                user={user}
                onEdit={handleEditReport}
                onDelete={handleDeleteReport}
                isLoading={isLoadingReports}
              />
            )}

            {currentView === "statistics" && (
              <StatisticsPage 
                stats={stats}
                isLoading={isLoadingStats}
              />
            )}

            {currentView === "audit-logs" && user?.role === "admin" && (
              <AuditLogsPage 
                onNotification={triggerToast}
              />
            )}

            {currentView === "telegram" && user?.role === "admin" && (
              <TelegramBotConfigPage 
                onNotification={triggerToast}
              />
            )}

            {/* Default fallbacks / Scroll view about and contact */}
            {(currentView === "about" || currentView === "contact") && (
              <AboutContactPage 
                onNotification={triggerToast}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modern branch footer */}
      <Footer setView={setView} />

      {/* Pop-up Portal login card Overlay */}
      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onNotification={triggerToast}
      />

    </div>
  );
}
