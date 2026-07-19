import { useState, useEffect } from "react";
import { 
  Users, 
  Smartphone, 
  Globe, 
  CreditCard, 
  Store, 
  Calendar, 
  ChevronRight, 
  TrendingUp, 
  RefreshCw,
  Clock
} from "lucide-react";
import { DashboardSummary, DailyReport } from "../types";
import { motion } from "motion/react";

interface DashboardProps {
  summary: DashboardSummary | null;
  reports: DailyReport[];
  onRefresh: () => void;
  isLoading: boolean;
  setView: (view: string) => void;
}

// Custom simple CountUp animation component
function CountUp({ end, duration = 600 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const endNum = Math.max(0, Number(end) || 0);
    if (endNum === 0) {
      setCount(0);
      return;
    }
    let start = 0;
    const totalSteps = 25;
    const increment = endNum / totalSteps;
    const delay = duration / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= endNum) {
        clearInterval(timer);
        setCount(endNum);
      } else {
        setCount(Math.ceil(start));
      }
    }, delay);

    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{count.toLocaleString()}</span>;
}

export default function Dashboard({
  summary,
  reports = [],
  onRefresh,
  isLoading,
  setView,
}: DashboardProps) {

  // Find the latest date among all reports
  const sortedReports = [...(reports || [])].sort((a, b) => b.date.localeCompare(a.date));
  const latestReport = sortedReports[0] || null;
  const latestDateStr = latestReport ? latestReport.date : "2026-07-18";
  const latestDayStr = latestReport ? latestReport.day : "Saturday";

  // Calculate product sums on that latest date
  const latestReportsList = (reports || []).filter(r => r.date === latestDateStr);
  const latestTotals = latestReportsList.reduce((acc, r) => ({
    customer_base: acc.customer_base + (r.customer_base || 0),
    mobile_banking: acc.mobile_banking + (r.mobile_banking || 0),
    internet_banking: acc.internet_banking + (r.internet_banking || 0),
    atm: acc.atm + (r.atm || 0),
    merchant: acc.merchant + (r.merchant || 0)
  }), { customer_base: 0, mobile_banking: 0, internet_banking: 0, atm: 0, merchant: 0 });

  // Format date beautifully
  const formatLatestDate = (dateStr: string, dayStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // 0-indexed month
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const computedDayStr = days[d.getDay()];
        const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
        return `${computedDayStr}, ${d.toLocaleDateString('en-US', options)}`;
      }
      return `${dayStr}, ${dateStr}`;
    } catch {
      return `${dayStr}, ${dateStr}`;
    }
  };

  // Current Local Time Date Formatting
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const defaultRow = { customer_base: 0, mobile_banking: 0, internet_banking: 0, atm: 0, merchant: 0 };
  const s = summary || {
    today: defaultRow,
    weekly: defaultRow,
    monthly: defaultRow,
    yearly: defaultRow,
    overall: defaultRow,
  };

  const productCards = [
    {
      id: "customer_base",
      name: "Customer Onboarding",
      key: "customer_base" as keyof typeof defaultRow,
      desc: "Daily Account Openings",
      icon: Users,
      color: "border-emerald-500 text-emerald-600 bg-emerald-50",
      grad: "from-emerald-500 to-teal-600",
      progressColor: "bg-emerald-500"
    },
    {
      id: "mobile_banking",
      name: "Mobile Banking",
      key: "mobile_banking" as keyof typeof defaultRow,
      desc: "App & USSD Activations",
      icon: Smartphone,
      color: "border-blue-500 text-blue-600 bg-blue-50",
      grad: "from-blue-500 to-indigo-600",
      progressColor: "bg-blue-600"
    },
    {
      id: "internet_banking",
      name: "Internet Banking",
      key: "internet_banking" as keyof typeof defaultRow,
      desc: "Corporate & Personal Web Login",
      icon: Globe,
      color: "border-purple-500 text-purple-600 bg-purple-50",
      grad: "from-purple-500 to-pink-600",
      progressColor: "bg-purple-600"
    },
    {
      id: "atm",
      name: "ATM & Debit Cards",
      key: "atm" as keyof typeof defaultRow,
      desc: "New Card Onboarding",
      icon: CreditCard,
      color: "border-amber-500 text-amber-600 bg-amber-50",
      grad: "from-amber-500 to-orange-600",
      progressColor: "bg-amber-500"
    },
    {
      id: "merchant",
      name: "Merchant Solutions",
      key: "merchant" as keyof typeof defaultRow,
      desc: "PoS & QR Sign-ups",
      icon: Store,
      color: "border-rose-500 text-rose-600 bg-rose-50",
      grad: "from-rose-500 to-red-600",
      progressColor: "bg-rose-500"
    }
  ];

  // Calculate high-level totals of today and overall
  const overallGrandTotal = Object.values(s.overall).reduce((a, b) => a + b, 0);
  const todayGrandTotal = Object.values(s.today).reduce((a, b) => a + b, 0);

  return (
    <div id="dashboard-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Dashboard Top Row Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shadow-green-glow">
        <div className="text-left space-y-1">
          <h2 className="text-2xl font-extrabold text-brand-green tracking-tight">
            Hamusit Campaign Analytics Dashboard
          </h2>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brand-gold shrink-0" />
              <span>UTC Time: {currentTime.toISOString().split("T")[0]} {currentTime.toUTCString().split(" ")[4]}</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
            <span className="text-brand-green-light font-semibold">Live campaign state</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
          
          <button
            onClick={() => setView("daily-report")}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-brand-green text-white hover:bg-brand-green-light rounded-xl transition-all shadow-md shadow-green-glow"
          >
            Log New Activations
            <ChevronRight className="w-4 h-4 text-brand-gold" />
          </button>
        </div>
      </div>

      {/* Dynamic Summary Metric Badges - Replaced with colorful, hanging, animating, counting up product cards for the latest date */}
      <div className="relative pt-8 pb-4">
        {/* Support Rod */}
        <div className="absolute top-2 left-4 right-4 h-2 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded-full shadow-inner z-10" />
        {/* Supporting brackets */}
        <div className="absolute top-0 left-10 w-2 h-4 bg-gray-500 rounded-t" />
        <div className="absolute top-0 right-10 w-2 h-4 bg-gray-500 rounded-t" />

        {/* Date Plaque Hanging from Rod */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-gradient-to-r from-brand-gold-dark via-brand-gold to-brand-gold-dark text-brand-green text-xs font-black font-mono rounded-full border-2 border-white shadow-md z-20 flex items-center gap-1.5 animate-pulse">
          <Calendar className="w-3.5 h-3.5 text-brand-green" />
          <span>CAMPAIGN PERFORMANCE DATE: {formatLatestDate(latestDateStr, latestDayStr)}</span>
        </div>

        {/* 5 Hanging Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 pt-4 relative">
          {[
            {
              name: "Customer Onboarding",
              count: latestTotals.customer_base,
              icon: Users,
              desc: "Daily Account Openings",
              grad: "from-emerald-600 to-teal-700",
              accent: "text-emerald-100",
              glow: "shadow-emerald-500/20"
            },
            {
              name: "Mobile Banking",
              count: latestTotals.mobile_banking,
              icon: Smartphone,
              desc: "App & USSD Activations",
              grad: "from-blue-600 to-indigo-700",
              accent: "text-blue-100",
              glow: "shadow-blue-500/20"
            },
            {
              name: "Internet Banking",
              count: latestTotals.internet_banking,
              icon: Globe,
              desc: "Web Portal Registrations",
              grad: "from-purple-600 to-pink-700",
              accent: "text-purple-100",
              glow: "shadow-purple-500/20"
            },
            {
              name: "ATM & Debit Cards",
              count: latestTotals.atm,
              icon: CreditCard,
              desc: "New Cards Onboarded",
              grad: "from-amber-500 to-orange-600",
              accent: "text-amber-100",
              glow: "shadow-amber-500/20"
            },
            {
              name: "Merchant Solutions",
              count: latestTotals.merchant,
              icon: Store,
              desc: "PoS & QR Merchant Sign-ups",
              grad: "from-rose-600 to-red-700",
              accent: "text-rose-100",
              glow: "shadow-rose-500/20"
            }
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.name}
                id={`hanging-card-${index}`}
                className={`relative bg-gradient-to-br ${item.grad} p-5 rounded-2xl text-white shadow-lg ${item.glow} flex flex-col justify-between overflow-hidden group`}
                animate={{
                  y: [0, -4, 0],
                  rotate: [0, 0.4, -0.4, 0]
                }}
                transition={{
                  duration: 4 + index * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                whileHover={{
                  y: -8,
                  scale: 1.03,
                  rotate: 0,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
                }}
              >
                {/* Custom Hanging Strings */}
                <div className="absolute -top-4 left-1/4 w-[1px] h-6 bg-gray-400 group-hover:bg-brand-gold transition-colors duration-200" />
                <div className="absolute -top-4 right-1/4 w-[1px] h-6 bg-gray-400 group-hover:bg-brand-gold transition-colors duration-200" />
                
                {/* Card content top */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md text-white group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-bold uppercase font-mono tracking-wider bg-white/10 px-2 py-0.5 rounded-full text-white/95">
                      Last Date Count
                    </span>
                  </div>

                  <div>
                    <h3 className="text-3xl font-black font-mono mt-1 tracking-tight">
                      <CountUp end={item.count} />
                    </h3>
                    <p className="text-xs font-extrabold uppercase tracking-wide text-brand-gold mt-1">
                      {item.name}
                    </p>
                  </div>
                </div>

                {/* Card content bottom description */}
                <p className="text-[10px] text-white/80 leading-relaxed mt-4 border-t border-white/10 pt-2 font-medium">
                  {item.desc}
                </p>

                {/* Ambient glow in background of card */}
                <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-300 pointer-events-none" />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Main Campaign Product Cards List */}
      <div className="space-y-4">
        <div className="text-left">
          <h3 className="text-lg font-bold text-gray-800 tracking-tight">Campaign Product Metrics</h3>
          <p className="text-xs text-gray-500">Comprehensive breakdown across all 5 key banking products</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {productCards.map((product) => {
            const Icon = product.icon;
            const productKey = product.key;

            // Extract calculations for this product
            const todayCount = s.today[productKey] || 0;
            const weeklyCount = s.weekly[productKey] || 0;
            const monthlyCount = s.monthly[productKey] || 0;
            const yearlyCount = s.yearly[productKey] || 0;
            const overallCount = s.overall[productKey] || 0;

            // Calculate percentage of overall
            const shareOfOverall = overallGrandTotal > 0 ? Math.round((overallCount / overallGrandTotal) * 100) : 0;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-brand-gold/30 hover:shadow-md transition-all duration-200 overflow-hidden text-left flex flex-col justify-between"
              >
                {/* Product Card Top Accent Header */}
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className={`p-2.5 rounded-xl ${product.color}`}>
                      <Icon className="w-5 h-5 shrink-0" />
                    </div>
                    <span className="text-[10px] font-bold text-brand-gold-dark font-mono bg-brand-gold/10 px-2 py-0.5 rounded-full">
                      {shareOfOverall}% Share
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-gray-800 leading-tight">
                      {product.name}
                    </h4>
                    <p className="text-[10px] font-medium text-gray-400 mt-0.5 leading-none">
                      {product.desc}
                    </p>
                  </div>
                </div>

                {/* Grid values */}
                <div className="bg-gray-50/50 p-4 border-t border-gray-100 space-y-3 font-mono">
                  
                  {/* Today */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Today:</span>
                    <span className="font-black text-brand-green text-sm">
                      <CountUp end={todayCount} />
                    </span>
                  </div>

                  {/* Weekly */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Weekly:</span>
                    <span className="font-bold text-gray-700">
                      <CountUp end={weeklyCount} />
                    </span>
                  </div>

                  {/* Monthly */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Monthly:</span>
                    <span className="font-bold text-gray-700">
                      <CountUp end={monthlyCount} />
                    </span>
                  </div>

                  {/* Yearly */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Yearly:</span>
                    <span className="font-bold text-gray-700">
                      <CountUp end={yearlyCount} />
                    </span>
                  </div>

                  {/* Overall */}
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-dashed border-gray-200">
                    <span className="text-brand-gold-dark font-bold">Overall:</span>
                    <span className="font-black text-brand-green text-base">
                      <CountUp end={overallCount} />
                    </span>
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-1 pt-1.5">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${product.progressColor}`} 
                        style={{ width: `${Math.min(100, Math.max(5, shareOfOverall))}%` }}
                      />
                    </div>
                  </div>

                </div>

              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Helpful Action Center Callouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#f9faf9] p-6 rounded-2xl border border-gray-100">
        <div className="text-left space-y-2">
          <h4 className="font-bold text-sm text-brand-green font-mono uppercase tracking-wider">
            Operational Guidelines
          </h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            Staff should submit campaigns by **3:30 PM (UTC)** daily to keep the regional database current. Entries for weekends (Saturday) can be combined or recorded as individual records. Duplicate record prevention avoids multiple submissions for a single calendar date.
          </p>
        </div>
        <div className="flex items-center justify-start md:justify-end gap-3 pt-2 md:pt-0">
          <button
            onClick={() => setView("reports")}
            className="px-4 py-2.5 text-xs font-bold text-brand-green bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all shadow-sm"
          >
            Review Historical Registers
          </button>
          <button
            onClick={() => setView("statistics")}
            className="px-4 py-2.5 text-xs font-bold text-white bg-brand-green-light hover:bg-brand-green rounded-xl transition-all shadow-md shadow-green-glow"
          >
            Open Graphical Analysis
          </button>
        </div>
      </div>

    </div>
  );
}
