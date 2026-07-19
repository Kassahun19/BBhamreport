import { useState, useEffect, FormEvent } from "react";
import { 
  PlusCircle, 
  Trash2, 
  RotateCcw, 
  Save, 
  Calendar, 
  Users, 
  Smartphone, 
  Globe, 
  CreditCard, 
  Store, 
  AlertCircle, 
  CheckCircle,
  FileEdit,
  ArrowLeft
} from "lucide-react";
import { DailyReport, User } from "../types";
import { saveReport, updateReport, deleteReport } from "../utils/api";

interface DailyReportEntryProps {
  user: User | null;
  onReportSaved: () => void;
  editTarget: DailyReport | null; // support editing from reports list
  clearEditTarget: () => void;
  onNotification: (msg: string, type: "success" | "error") => void;
}

export default function DailyReportEntry({
  user,
  onReportSaved,
  editTarget,
  clearEditTarget,
  onNotification,
}: DailyReportEntryProps) {
  
  // Form States
  const [date, setDate] = useState("");
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(7);
  const [week, setWeek] = useState<number>(1);
  const [day, setDay] = useState("");

  // Activations
  const [customerBase, setCustomerBase] = useState<string>("0");
  const [mobileBanking, setMobileBanking] = useState<string>("0");
  const [internetBanking, setInternetBanking] = useState<string>("0");
  const [atm, setAtm] = useState<string>("0");
  const [merchant, setMerchant] = useState<string>("0");

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Auto calculate Day, Week, Month, Year from Date Selection
  useEffect(() => {
    if (!date) return;
    
    const parts = date.split("-");
    if (parts.length !== 3) return;
    
    const yearVal = parseInt(parts[0], 10);
    const monthVal = parseInt(parts[1], 10) - 1;
    const dayVal = parseInt(parts[2], 10);
    const parsedDate = new Date(yearVal, monthVal, dayVal);
    
    if (isNaN(parsedDate.getTime())) return;

    // Year, Month
    setYear(parsedDate.getFullYear());
    setMonth(parsedDate.getMonth() + 1);

    // Week of month (1-5)
    const dayOfMonth = parsedDate.getDate();
    setWeek(Math.ceil(dayOfMonth / 7));

    // Weekday name
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    setDay(days[parsedDate.getDay()]);
  }, [date]);

  // Load edit target details if present
  useEffect(() => {
    if (editTarget) {
      setDate(editTarget.date);
      setYear(editTarget.year);
      setMonth(editTarget.month);
      setWeek(editTarget.week);
      setDay(editTarget.day);
      setCustomerBase(String(editTarget.customer_base));
      setMobileBanking(String(editTarget.mobile_banking));
      setInternetBanking(String(editTarget.internet_banking));
      setAtm(String(editTarget.atm));
      setMerchant(String(editTarget.merchant));
      setIsEditing(true);
    } else {
      handleClear();
    }
  }, [editTarget]);

  const handleClear = () => {
    // Default values
    const todayStr = new Date().toISOString().split("T")[0];
    setDate(todayStr);
    setCustomerBase("0");
    setMobileBanking("0");
    setInternetBanking("0");
    setAtm("0");
    setMerchant("0");
    setIsEditing(false);
    clearEditTarget();
  };

  const validateForm = () => {
    if (!date) {
      onNotification("Please select a campaign date", "error");
      return false;
    }
    
    const values = [
      Number(customerBase), 
      Number(mobileBanking), 
      Number(internetBanking), 
      Number(atm), 
      Number(merchant)
    ];

    if (values.some(v => isNaN(v) || v < 0)) {
      onNotification("Activation achievements cannot be negative or invalid numbers", "error");
      return false;
    }

    return true;
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const reportData = {
      date,
      customer_base: Number(customerBase || 0),
      mobile_banking: Number(mobileBanking || 0),
      internet_banking: Number(internetBanking || 0),
      atm: Number(atm || 0),
      merchant: Number(merchant || 0)
    };

    try {
      if (isEditing && editTarget) {
        await updateReport(editTarget.id, reportData);
        onNotification("Campaign report updated successfully!", "success");
      } else {
        await saveReport(reportData);
        onNotification("Daily campaign report logged successfully!", "success");
      }
      onReportSaved();
      handleClear();
    } catch (err: any) {
      onNotification(err.message || "An error occurred while saving report.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editTarget) return;
    if (!window.confirm(`Are you sure you want to permanently delete the campaign report for ${editTarget.date}? This action is irreversible.`)) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteReport(editTarget.id);
      onNotification("Campaign report deleted successfully!", "success");
      onReportSaved();
      handleClear();
    } catch (err: any) {
      onNotification(err.message || "Failed to delete report", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="daily-report-entry" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header back button row */}
      {isEditing && (
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-brand-green bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-brand-gold" />
          Cancel Edit & Return
        </button>
      )}

      {/* Title block */}
      <div className="text-left bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-2 bg-brand-gold" />
        <h2 className="text-xl sm:text-2xl font-extrabold text-brand-green tracking-tight flex items-center gap-2">
          {isEditing ? <FileEdit className="w-5 h-5 text-brand-gold" /> : <PlusCircle className="w-5 h-5 text-brand-gold" />}
          {isEditing ? "Modify Campaign Report" : "Daily Campaign Achievement Log"}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {isEditing 
            ? `Editing registered report values for Date: ${date}` 
            : "Select calendar day and type in the customer activation numbers logged at Hamusit Branch."}
        </p>
      </div>

      {/* Main Entry Card */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-8 text-left">
        
        {/* Calendar / Date Parameters Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider font-mono border-b border-gray-100 pb-2">
            1. Campaign Calendar Date Selection
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {/* Calendar Date */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-gray-700 block">Select Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gold" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={isEditing} // Date modification restricted for integrity
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 focus:border-brand-green focus:outline-none rounded-xl bg-gray-50/50"
                />
              </div>
            </div>

            {/* Auto-populated details */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 block">Calculated Day</label>
              <input
                type="text"
                readOnly
                value={day || "---"}
                className="w-full px-3 py-2 text-sm border border-gray-100 rounded-xl bg-gray-50 font-semibold font-mono text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 block">Week of Month</label>
              <input
                type="text"
                readOnly
                value={week ? `Week ${week}` : "---"}
                className="w-full px-3 py-2 text-sm border border-gray-100 rounded-xl bg-gray-50 font-semibold font-mono text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 block">Month & Year</label>
              <input
                type="text"
                readOnly
                value={month && year ? `${month}/${year}` : "---"}
                className="w-full px-3 py-2 text-sm border border-gray-100 rounded-xl bg-gray-50 font-semibold font-mono text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Campaign Activation Metrics Input Forms */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider font-mono border-b border-gray-100 pb-2">
            2. Customer Activations Achievements Tally
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Customer Base Input */}
            <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-sm shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-800">Customer Onboarding</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-none">New Account openings</p>
                </div>
              </div>
              <input
                type="number"
                min="0"
                required
                value={customerBase}
                onChange={(e) => setCustomerBase(e.target.value)}
                className="w-24 text-right px-3 py-2 border border-gray-200 focus:border-brand-green focus:outline-none rounded-xl bg-white font-bold font-mono text-sm"
              />
            </div>

            {/* Mobile Banking Input */}
            <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-800">Mobile Banking App</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-none">Mobile App & USSD sign-ups</p>
                </div>
              </div>
              <input
                type="number"
                min="0"
                required
                value={mobileBanking}
                onChange={(e) => setMobileBanking(e.target.value)}
                className="w-24 text-right px-3 py-2 border border-gray-200 focus:border-brand-green focus:outline-none rounded-xl bg-white font-bold font-mono text-sm"
              />
            </div>

            {/* Internet Banking Input */}
            <div className="p-4 bg-purple-50/30 border border-purple-100 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-sm shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-800">Internet Banking</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-none">Web Portal registration</p>
                </div>
              </div>
              <input
                type="number"
                min="0"
                required
                value={internetBanking}
                onChange={(e) => setInternetBanking(e.target.value)}
                className="w-24 text-right px-3 py-2 border border-gray-200 focus:border-brand-green focus:outline-none rounded-xl bg-white font-bold font-mono text-sm"
              />
            </div>

            {/* ATM Debit Card Input */}
            <div className="p-4 bg-amber-50/30 border border-amber-100 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-sm shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-800">ATM Debit Cards</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-none">New Cards issued & activated</p>
                </div>
              </div>
              <input
                type="number"
                min="0"
                required
                value={atm}
                onChange={(e) => setAtm(e.target.value)}
                className="w-24 text-right px-3 py-2 border border-gray-200 focus:border-brand-green focus:outline-none rounded-xl bg-white font-bold font-mono text-sm"
              />
            </div>

            {/* Merchant Solutions Input */}
            <div className="p-4 bg-rose-50/30 border border-rose-100 rounded-2xl flex items-center justify-between gap-4 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500 text-white shadow-sm shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-800">Merchant Solutions</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-none">PoS installation and merchant QR activations</p>
                </div>
              </div>
              <input
                type="number"
                min="0"
                required
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-24 text-right px-3 py-2 border border-gray-200 focus:border-brand-green focus:outline-none rounded-xl bg-white font-bold font-mono text-sm"
              />
            </div>

          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-100">
          
          <div className="text-left w-full sm:w-auto">
            <span className="text-[11px] text-gray-400 block font-mono">AUTHORIZED OPERATOR</span>
            <span className="text-xs font-extrabold text-brand-green">{user?.fullname || "Staff User"}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            
            {/* Delete button (only when editing and user is Admin!) */}
            {isEditing && user?.role === "admin" && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                Delete Report
              </button>
            )}

            {/* Clear Button */}
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold rounded-xl transition-all"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              Reset Form
            </button>

            {/* Submit Save Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-green hover:bg-brand-green-light text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-green-glow disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-brand-gold shrink-0" />
              {isEditing ? "Update Report" : "Save Achievement"}
            </button>

          </div>

        </div>

      </form>

    </div>
  );
}
