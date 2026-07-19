import { 
  Users, 
  Smartphone, 
  Globe, 
  CreditCard, 
  Store, 
  ArrowRight, 
  Sparkles, 
  CheckCircle, 
  Award, 
  TrendingUp, 
  Calendar,
  Lock
} from "lucide-react";
import { DashboardSummary, User } from "../types";
import { motion } from "motion/react";

interface LandingPageProps {
  summary: DashboardSummary | null;
  setView: (view: string) => void;
  user: User | null;
  onOpenLogin: () => void;
}

export default function LandingPage({
  summary,
  setView,
  user,
  onOpenLogin,
}: LandingPageProps) {

  // Default mock totals if backend summary is loading or null
  const totals = summary?.overall || {
    customer_base: 150,
    mobile_banking: 175,
    internet_banking: 45,
    atm: 95,
    merchant: 35,
  };

  const products = [
    {
      name: "Customer Base",
      icon: Users,
      desc: "New accounts and customer onboarding campaign records.",
      count: totals.customer_base,
      color: "from-emerald-500 to-teal-600",
      accent: "text-emerald-600"
    },
    {
      name: "Mobile Banking",
      icon: Smartphone,
      desc: "Activation of Bunna Mobile Banking app and USSD services.",
      count: totals.mobile_banking,
      color: "from-blue-500 to-indigo-600",
      accent: "text-blue-600"
    },
    {
      name: "Internet Banking",
      icon: Globe,
      desc: "Registrations for Bunna secure personal/corporate web banking.",
      count: totals.internet_banking,
      color: "from-purple-500 to-pink-600",
      accent: "text-purple-600"
    },
    {
      name: "ATM Services",
      icon: CreditCard,
      desc: "Debit card issuance and ATM activation campaigns.",
      count: totals.atm,
      color: "from-amber-500 to-orange-600",
      accent: "text-amber-600"
    },
    {
      name: "Merchant Solutions",
      icon: Store,
      desc: "PoS machine onboarding and QR payment activations for local shops.",
      count: totals.merchant,
      color: "from-rose-500 to-red-600",
      accent: "text-rose-600"
    }
  ];

  return (
    <div id="landing-page" className="relative overflow-hidden bg-gradient-to-b from-[#f4f7f5] via-white to-[#f9fbf9]">
      
      {/* Dynamic Ambient Background Sparkles */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-[radial-gradient(circle_at_top_right,rgba(10,77,37,0.06),transparent_40%)] pointer-events-none" />
      <div className="absolute top-1/2 left-10 w-64 h-64 bg-brand-gold/5 blur-3xl rounded-full pointer-events-none" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Column */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-green/10 border border-brand-green/20 text-brand-green text-xs font-bold font-mono tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-brand-gold animate-pulse" />
              <span>BUNNA BANK S.C • DIGITAL EXCELLENCE CAMPAIGN</span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-green tracking-tight leading-tight">
              Hamusit Branch <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-brand-green-light">
                Daily Campaign
              </span> <br />
              <span className="text-brand-gold relative inline-block">
                Report System
                <span className="absolute left-0 bottom-1.5 w-full h-1.5 bg-brand-gold-light/40 -z-10 rounded" />
              </span>
            </h2>

            <p className="text-sm sm:text-base text-gray-600 max-w-xl leading-relaxed">
              Track, organize, and evaluate Bunna Bank's customer activations. Accelerate financial inclusion in the Hamusit region through systematic, data-backed reports for core banking campaign products.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              {user ? (
                <>
                  <button
                    onClick={() => setView("dashboard")}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-green hover:bg-brand-green-light text-white font-bold rounded-xl shadow-lg shadow-green-glow hover:shadow-xl transition-all duration-200"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 text-brand-gold" />
                  </button>
                  <button
                    onClick={() => setView("daily-report")}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-gray-50 text-brand-green border border-gray-200 font-bold rounded-xl shadow-sm transition-all duration-200"
                  >
                    <Calendar className="w-4 h-4 text-brand-gold" />
                    Enter Daily Report
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onOpenLogin}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-green hover:bg-brand-green-light text-white font-bold rounded-xl shadow-lg shadow-green-glow hover:shadow-xl transition-all duration-200"
                  >
                    Access Staff Portal
                    <ArrowRight className="w-4 h-4 text-brand-gold" />
                  </button>
                  <button
                    onClick={() => setView("dashboard")}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold rounded-xl shadow-sm transition-all duration-200"
                  >
                    View Public Dashboard
                  </button>
                </>
              )}
            </div>

            {/* Trust points */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100 max-w-md text-xs">
              <div className="flex items-center gap-1.5 text-gray-600">
                <CheckCircle className="w-4 h-4 text-brand-green shrink-0" />
                <span>Secure JWT</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <CheckCircle className="w-4 h-4 text-brand-green shrink-0" />
                <span>Real-Time Math</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <CheckCircle className="w-4 h-4 text-brand-green shrink-0" />
                <span>Audit Logs</span>
              </div>
            </div>

          </motion.div>

          {/* Right Hero Column: Interactive Animated Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-5 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-gold/10 to-brand-green/10 blur-2xl rounded-3xl -z-10" />
            <div className="glass-card-dark p-6 rounded-2xl border-2 border-brand-green/10 shadow-xl animate-float">
              
              {/* Card Header */}
              <div className="flex justify-between items-center pb-4 border-b border-brand-green/10">
                <div>
                  <h4 className="text-xs font-extrabold text-brand-green font-mono uppercase tracking-wider">
                    Total Campaign Performance
                  </h4>
                  <p className="text-[10px] font-medium text-gray-500 font-mono mt-0.5">
                    Live aggregate counts
                  </p>
                </div>
                <div className="px-2.5 py-1 rounded-md bg-brand-gold/10 border border-brand-gold/20 text-brand-gold-dark text-[10px] font-extrabold font-mono uppercase">
                  Active
                </div>
              </div>

              {/* Progress Counters in Hero */}
              <div className="space-y-4 pt-4">
                {products.map((p) => {
                  const Icon = p.icon;
                  return (
                    <div key={p.name} className="flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-white/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${p.color} text-white`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-gray-800">{p.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-brand-green font-mono">
                          {p.count}
                        </span>
                        <p className="text-[9px] font-semibold text-gray-400 font-mono">ACTIVATED</p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* Campaigns Overview Grid section */}
      <section className="bg-white border-y border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          
          <div className="max-w-2xl mx-auto space-y-3">
            <h3 className="text-xs font-extrabold text-brand-gold-dark font-mono uppercase tracking-widest">
              Campaign Product Focus
            </h3>
            <h2 className="text-3xl font-black text-brand-green tracking-tight">
              Our Tracked Banking Campaign Achievements
            </h2>
            <p className="text-sm text-gray-500">
              Bunna Bank's high-demand services are registered by staff daily to provide immediate tracking visibility.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {products.map((prod, idx) => {
              const Icon = prod.icon;
              return (
                <motion.div
                  key={prod.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="bg-gray-50 hover:bg-white p-5 rounded-2xl border border-gray-100 hover:border-brand-gold/30 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${prod.color} text-white flex items-center justify-center shadow-md mb-4 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-gray-800 mb-1.5 group-hover:text-brand-green transition-colors">
                    {prod.name}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    {prod.desc}
                  </p>
                  <div className="pt-3 border-t border-gray-100 flex items-baseline justify-between">
                    <span className="text-[10px] font-bold text-gray-400 font-mono uppercase">
                      Grand Total
                    </span>
                    <span className={`text-base font-black ${prod.accent} font-mono`}>
                      {prod.count}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Campaign Process/Guide section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          <div className="relative">
            <div className="absolute inset-0 bg-brand-green/5 blur-3xl rounded-full" />
            <div className="p-8 bg-[#0a4d25]/5 border border-brand-green/10 rounded-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-brand-green flex items-center justify-center text-brand-gold">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-brand-green">Branch Milestones</h4>
                  <p className="text-xs text-gray-500">Bunna Bank Hamusit Branch</p>
                </div>
              </div>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 text-xs font-bold mt-0.5">✓</div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <strong>100% Secure Storage:</strong> Real-time storage of critical local digital campaigns utilizing protected relational tables.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 text-xs font-bold mt-0.5">✓</div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <strong>Automatic Aggregation:</strong> Totals (daily, weekly, monthly, yearly, grand) update on-the-fly instantly after recording a saved report.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 text-xs font-bold mt-0.5">✓</div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <strong>Easy Exports:</strong> Staff can generate PDF, Excel, and CSV file outputs with automated column sum calculations.
                  </p>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-5 text-left">
            <h4 className="text-xs font-extrabold text-brand-gold-dark font-mono uppercase tracking-widest">
              Digital Bank Dashboard
            </h4>
            <h2 className="text-3xl font-black text-brand-green tracking-tight">
              Enabling Modern Performance Tracking
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Managing a bank branch's customer mobilization campaigns is highly critical. Staff utilize this system to quickly log activations for the Customer Onboarding, Mobile Banking App, Web Banking, Cards/ATM, and Merchant QR codes. The automated mathematics engine produces visual statistics and trends, providing immediate diagnostic reporting for upper management.
            </p>
            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={() => setView("dashboard")}
                className="flex items-center gap-1 text-sm font-bold text-brand-green hover:text-brand-green-light hover:underline"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 text-brand-gold" />
              </button>
              {!user && (
                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700 rounded-lg"
                >
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  Staff Authorization Needed to Log Reports
                </button>
              )}
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
