import { useState } from "react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  LineChart as LineIcon, 
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";
import { Statistics } from "../types";

interface StatisticsPageProps {
  stats: Statistics | null;
  isLoading: boolean;
}

export default function StatisticsPage({ stats, isLoading }: StatisticsPageProps) {
  const [activeTab, setActiveTab] = useState<"products" | "trends" | "months" | "weekdays">("products");

  if (isLoading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-gray-500 font-bold font-mono">
        <span className="animate-pulse">Analyzing Bunna Bank campaign metrics... Please wait...</span>
      </div>
    );
  }

  // 1. Pie & Doughnut Chart Data: Product Performance
  const productData = [
    { name: "Customer Onboarding", value: stats.products.customerBase, color: "#10b981" },
    { name: "Mobile Banking", value: stats.products.mobileBanking, color: "#2563eb" },
    { name: "Internet Banking", value: stats.products.internetBanking, color: "#7c3aed" },
    { name: "ATM Debit Cards", value: stats.products.atm, color: "#f59e0b" },
    { name: "Merchant Solutions", value: stats.products.merchant, color: "#f43f5e" }
  ].filter(p => p.value > 0);

  // If everything is 0, add placeholder for design rendering
  if (productData.length === 0) {
    productData.push({ name: "No Activations Recorded", value: 1, color: "#e5e7eb" });
  }

  // 2. Trend Area Chart Data
  const trendData = stats.trend.map(t => ({
    date: t.date.substring(5), // MM-DD
    day: t.day,
    "Customer Onboarding": t.customerBase,
    "Mobile Banking": t.mobileBanking,
    "Internet Banking": t.internetBanking,
    "ATM Cards": t.atm,
    Merchant: t.merchant,
    Total: t.total
  }));

  // 3. Monthly Performance Bar Chart
  const monthlyData = stats.monthly.map(m => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return {
      month: `${monthNames[m.month - 1]} ${m.year}`,
      Onboardings: m.customerBase,
      "Mobile App": m.mobileBanking,
      "Web Banking": m.internetBanking,
      Cards: m.atm,
      Merchant: m.merchant,
      Total: m.totalActivations
    };
  });

  // 4. Weekday Performance Bar Chart
  const weekdayData = stats.weekday.map(w => ({
    day: w.day.substring(0, 3), // Mon, Tue...
    "Customer Onboarding": Math.round(w.avgCustomerBase),
    "Mobile Banking": Math.round(w.avgMobileBanking),
    "Internet Banking": Math.round(w.avgInternetBanking),
    "ATM Cards": Math.round(w.avgAtm),
    Merchant: Math.round(w.avgMerchant),
    total: w.total
  }));

  // Total sums calculation for stats dashboard cards
  const totalOnboardings = stats.products.customerBase;
  const totalMobile = stats.products.mobileBanking;
  const totalInternet = stats.products.internetBanking;
  const totalCards = stats.products.atm;
  const totalMerchant = stats.products.merchant;
  const grandTally = totalOnboardings + totalMobile + totalInternet + totalCards + totalMerchant;

  return (
    <div id="statistics-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-2 bg-brand-gold" />
        <h2 className="text-xl sm:text-2xl font-extrabold text-brand-green tracking-tight flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-gold" />
          Campaign Graphical Statistics Hub
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Perform immediate visual audit reviews of product campaign successes, weekday metrics, and monthly development trends.
        </p>
      </div>

      {/* Visual Aggregation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 font-mono">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[10px] text-gray-400 font-sans block leading-none font-bold">TOTAL ACTIONS</span>
          <span className="text-lg font-black text-brand-green leading-none mt-1.5 block">{grandTally}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[10px] text-emerald-600 font-sans block leading-none font-bold">ONBOARDINGS</span>
          <span className="text-lg font-black text-emerald-600 leading-none mt-1.5 block">{totalOnboardings}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[10px] text-blue-600 font-sans block leading-none font-bold">MOBILE BANK</span>
          <span className="text-lg font-black text-blue-600 leading-none mt-1.5 block">{totalMobile}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[10px] text-purple-600 font-sans block leading-none font-bold">INTERNET BANK</span>
          <span className="text-lg font-black text-purple-600 leading-none mt-1.5 block">{totalInternet}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[10px] text-amber-600 font-sans block leading-none font-bold">ATM DEBITS</span>
          <span className="text-lg font-black text-amber-600 leading-none mt-1.5 block">{totalCards}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <span className="text-[10px] text-rose-600 font-sans block leading-none font-bold">MERCHANTS</span>
          <span className="text-lg font-black text-rose-600 leading-none mt-1.5 block">{totalMerchant}</span>
        </div>
      </div>

      {/* Graphics Sub-Navigation Menu */}
      <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-1.5 rounded-2xl w-full max-w-2xl">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "products"
              ? "bg-brand-green text-white shadow-sm"
              : "text-gray-600 hover:text-brand-green hover:bg-gray-50"
          }`}
        >
          <PieIcon className="w-4 h-4 shrink-0" />
          Product Share (Pie & Doughnut)
        </button>

        <button
          onClick={() => setActiveTab("trends")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "trends"
              ? "bg-brand-green text-white shadow-sm"
              : "text-gray-600 hover:text-brand-green hover:bg-gray-50"
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0" />
          Recent Tally Trend (Area & Line)
        </button>

        <button
          onClick={() => setActiveTab("months")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "months"
              ? "bg-brand-green text-white shadow-sm"
              : "text-gray-600 hover:text-brand-green hover:bg-gray-50"
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          Monthly Comparison (Bar)
        </button>

        <button
          onClick={() => setActiveTab("weekdays")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "weekdays"
              ? "bg-brand-green text-white shadow-sm"
              : "text-gray-600 hover:text-brand-green hover:bg-gray-50"
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          Weekday Average
        </button>
      </div>

      {/* Primary Chart Area Container */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[450px] flex flex-col justify-between">
        
        {/* Render Tab: Products (Doughnut / Pie) */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="text-left">
              <h3 className="font-bold text-gray-800 text-base">Campaign Product Performance Breakdown</h3>
              <p className="text-xs text-gray-500">Relative share percentage of each product activation out of the grand overall total.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-4">
              
              {/* Pie Component */}
              <div className="md:col-span-7 h-80 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {productData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} activations`, "Total Achievements"]} 
                      contentStyle={{ borderRadius: "12px", border: "1px solid #eee", fontSize: "12px", fontFamily: "monospace" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center text inside doughnut */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center select-none pointer-events-none">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Overall Total</span>
                  <span className="text-2xl font-black text-brand-green font-mono block leading-none mt-1">{grandTally}</span>
                </div>
              </div>

              {/* Legends with detail */}
              <div className="md:col-span-5 space-y-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider font-mono">Legend Breakdown</h4>
                
                <div className="space-y-2.5">
                  {productData.map((prod) => {
                    const percentage = grandTally > 0 ? Math.round((prod.value / grandTally) * 100) : 0;
                    return (
                      <div key={prod.name} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded" style={{ backgroundColor: prod.color }} />
                          <span className="font-bold text-gray-700">{prod.name}</span>
                        </div>
                        <div className="text-right font-mono font-bold">
                          <span className="text-gray-800">{prod.value} </span>
                          <span className="text-brand-gold-dark font-black">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Render Tab: Trends (Area & Line) */}
        {activeTab === "trends" && (
          <div className="space-y-6">
            <div className="text-left">
              <h3 className="font-bold text-gray-800 text-base">Campaign Achievement Trends</h3>
              <p className="text-xs text-gray-500">Recent chronological development progress recorded across the last 10 entries.</p>
            </div>

            <div className="h-80 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0a4d25" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#0a4d25" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f0" />
                  <XAxis dataKey="date" stroke="#999" fontSize={11} tickLine={false} />
                  <YAxis stroke="#999" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #eee", fontSize: "11px", fontFamily: "monospace" }} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                  
                  {/* Total activations overall */}
                  <Area type="monotone" dataKey="Total" stroke="#0a4d25" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                  
                  {/* Detailed service lines */}
                  <Line type="monotone" dataKey="Customer Onboarding" stroke="#10b981" strokeWidth={1.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Mobile Banking" stroke="#2563eb" strokeWidth={1.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Internet Banking" stroke="#7c3aed" strokeWidth={1.5} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Render Tab: Months (Bar comparison) */}
        {activeTab === "months" && (
          <div className="space-y-6">
            <div className="text-left">
              <h3 className="font-bold text-gray-800 text-base">Month-over-Month Historical Performance</h3>
              <p className="text-xs text-gray-500">Tally sums across registered calendar months. Provides branch progress snapshots.</p>
            </div>

            <div className="h-80 pt-4">
              {monthlyData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs font-mono text-gray-400">
                  Multiple distinct months must be entered to view monthly comparison grids.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f0" />
                    <XAxis dataKey="month" stroke="#999" fontSize={11} tickLine={false} />
                    <YAxis stroke="#999" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #eee", fontSize: "11px", fontFamily: "monospace" }} />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                    
                    <Bar dataKey="Onboardings" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Mobile App" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Web Banking" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Cards" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Merchant" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Render Tab: Weekdays (Weekday Campaign Efficiency) */}
        {activeTab === "weekdays" && (
          <div className="space-y-6">
            <div className="text-left">
              <h3 className="font-bold text-gray-800 text-base">Weekday Achievement Density</h3>
              <p className="text-xs text-gray-500">Average customer activation speed registered across days of week (Monday to Saturday).</p>
            </div>

            <div className="h-80 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f0" />
                  <XAxis dataKey="day" stroke="#999" fontSize={11} tickLine={false} />
                  <YAxis stroke="#999" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #eee", fontSize: "11px", fontFamily: "monospace" }} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                  
                  <Bar dataKey="Customer Onboarding" fill="#10b981" stackId="a" />
                  <Bar dataKey="Mobile Banking" fill="#2563eb" stackId="a" />
                  <Bar dataKey="Internet Banking" fill="#7c3aed" stackId="a" />
                  <Bar dataKey="ATM Cards" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="Merchant" fill="#f43f5e" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Descriptive Footer summary inside panel */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
          <span>Official Campaign statistics compiled for Hamusit Branch</span>
          <span className="flex items-center gap-1 text-brand-green font-bold">
            Data updates dynamically
            <ArrowRight className="w-3.5 h-3.5 text-brand-gold" />
          </span>
        </div>

      </div>

    </div>
  );
}
