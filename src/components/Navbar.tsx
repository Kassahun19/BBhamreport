import { useState } from "react";
import { 
  Menu, 
  X, 
  TrendingUp, 
  User, 
  LogOut, 
  LogIn, 
  BarChart3, 
  FileSpreadsheet, 
  PlusCircle, 
  LayoutDashboard, 
  Info,
  ShieldCheck,
  Bot
} from "lucide-react";
import { User as UserType } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
  user: UserType | null;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export default function Navbar({
  currentView,
  setView,
  user,
  onLogout,
  onOpenLogin,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: "home", label: "Home", icon: Info },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "daily-report", label: "Daily Report", icon: PlusCircle, protected: true },
    { id: "reports", label: "Reports", icon: FileSpreadsheet, protected: true },
    { id: "statistics", label: "Statistics", icon: BarChart3, protected: true },
    { id: "audit-logs", label: "Audit Logs", icon: ShieldCheck, adminOnly: true },
    { id: "telegram", label: "Telegram Bot", icon: Bot, adminOnly: true },
  ];

  const handleNavClick = (viewId: string) => {
    setView(viewId);
    setIsOpen(false);
  };

  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly && (!user || user.role !== "admin")) return false;
    if (item.protected && !user) return false;
    return true;
  });

  return (
    <nav id="bunna-nav" className="sticky top-0 z-50 w-full glass-card border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo Brand */}
          <div 
            onClick={() => handleNavClick("home")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center shadow-md shadow-green-glow group-hover:scale-105 transition-transform duration-200">
              <span className="text-brand-gold font-extrabold text-lg tracking-tighter">BB</span>
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-brand-green tracking-tight leading-none">
                BUNNA BANK
              </h1>
              <p className="text-[10px] font-medium text-brand-gold font-mono tracking-widest uppercase">
                Hamusit Branch
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-3">
            {visibleItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs lg:text-sm font-semibold rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-brand-green text-white shadow-sm"
                      : "text-gray-600 hover:text-brand-green hover:bg-gray-50"
                  }`}
                >
                  <IconComponent className={`w-4 h-4 ${isActive ? "text-brand-gold" : ""}`} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* User Section & Authentication */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-1.5 pr-3 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-brand-green-light flex items-center justify-center text-white font-bold text-sm">
                  {user.fullname.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-800 leading-none">{user.fullname}</p>
                  <p className="text-[9px] font-semibold text-brand-gold-dark font-mono uppercase leading-tight mt-0.5">
                    {user.role}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="ml-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-2 bg-brand-green hover:bg-brand-green-light text-white text-xs lg:text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-green-glow"
              >
                <LogIn className="w-4 h-4 text-brand-gold" />
                Staff Portal
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {user && (
              <div className="w-8 h-8 rounded-full bg-brand-green text-brand-gold flex items-center justify-center font-bold text-xs">
                {user.fullname.substring(0, 1).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-600 hover:text-brand-green hover:bg-gray-100 rounded-lg"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-card border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {visibleItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                      isActive
                        ? "bg-brand-green text-white"
                        : "text-gray-600 hover:text-brand-green hover:bg-gray-50"
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 ${isActive ? "text-brand-gold" : "text-gray-400"}`} />
                    {item.label}
                  </button>
                );
              })}

              <hr className="my-2 border-gray-100" />

              {user ? (
                <div className="pt-2 pb-1 space-y-2">
                  <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-brand-green-light flex items-center justify-center text-white font-bold">
                      {user.fullname.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{user.fullname}</p>
                      <p className="text-xs font-semibold text-brand-gold-dark font-mono uppercase">
                        {user.role}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onOpenLogin();
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full bg-brand-green text-white text-sm font-bold py-3 rounded-xl shadow-md"
                >
                  <LogIn className="w-4 h-4 text-brand-gold" />
                  Staff Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
