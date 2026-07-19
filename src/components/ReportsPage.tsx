import { useState } from "react";
import { 
  Search, 
  Download, 
  Printer, 
  Filter, 
  Trash2, 
  Edit, 
  Calendar, 
  Layers, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { DailyReport, User } from "../types";

interface ReportsPageProps {
  reports: DailyReport[];
  user: User | null;
  onEdit: (report: DailyReport) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
}

export default function ReportsPage({
  reports,
  user,
  onEdit,
  onDelete,
  isLoading,
}: ReportsPageProps) {
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterWeek, setFilterWeek] = useState("");
  const [filterDay, setFilterDay] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting States
  const [sortField, setSortField] = useState<keyof DailyReport>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Handle sorting
  const handleSort = (field: keyof DailyReport) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Filter logic
  const filteredReports = reports.filter((r) => {
    // Search matching
    const searchMatch = 
      r.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.day.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.creator_name && r.creator_name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Dropdown filters match
    const yearMatch = !filterYear || r.year === Number(filterYear);
    const monthMatch = !filterMonth || r.month === Number(filterMonth);
    const weekMatch = !filterWeek || r.week === Number(filterWeek);
    const dayMatch = !filterDay || r.day.toLowerCase() === filterDay.toLowerCase();

    return searchMatch && yearMatch && monthMatch && weekMatch && dayMatch;
  });

  // Sort logic
  const sortedReports = [...filteredReports].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === "string" && typeof valB === "string") {
      return sortDirection === "asc" 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    } else {
      return sortDirection === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    }
  });

  // Pagination logic
  const totalItems = sortedReports.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedReports.slice(indexOfFirstItem, indexOfLastItem);

  // Dynamic Column aggregations of currently filtered records
  const sumCustomerBase = filteredReports.reduce((sum, r) => sum + r.customer_base, 0);
  const sumMobileBanking = filteredReports.reduce((sum, r) => sum + r.mobile_banking, 0);
  const sumInternetBanking = filteredReports.reduce((sum, r) => sum + r.internet_banking, 0);
  const sumAtm = filteredReports.reduce((sum, r) => sum + r.atm, 0);
  const sumMerchant = filteredReports.reduce((sum, r) => sum + r.merchant, 0);
  const grandCombinedTotal = sumCustomerBase + sumMobileBanking + sumInternetBanking + sumAtm + sumMerchant;

  // Clear all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterYear("");
    setFilterMonth("");
    setFilterWeek("");
    setFilterDay("");
    setCurrentPage(1);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    const headers = [
      "Date", "Year", "Month", "Week", "Day", 
      "Customer Onboarding", "Mobile Banking", "Internet Banking", "ATM Debit Cards", "Merchant Solutions",
      "Daily Total", "Logged By"
    ];

    const rows = sortedReports.map((r) => [
      r.date, r.year, r.month, r.week, r.day,
      r.customer_base, r.mobile_banking, r.internet_banking, r.atm, r.merchant,
      r.customer_base + r.mobile_banking + r.internet_banking + r.atm + r.merchant,
      r.creator_name || "Staff"
    ]);

    // Add Sum Row
    rows.push([
      "SUM OF FILTERED", "---", "---", "---", "---",
      sumCustomerBase, sumMobileBanking, sumInternetBanking, sumAtm, sumMerchant,
      grandCombinedTotal, "---"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bunna_Bank_Campaign_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print optimized view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="reports-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Print Only Branding Header */}
      <div className="hidden print:block text-center border-b-2 border-brand-green pb-4 mb-6">
        <h1 className="text-2xl font-black text-brand-green">BUNNA BANK S.C.</h1>
        <p className="text-sm font-bold text-brand-gold font-mono uppercase tracking-widest">
          Hamusit Branch • Daily Campaign Report Register
        </p>
        <p className="text-[10px] text-gray-500 mt-1 font-mono">
          Report Generated: {new Date().toLocaleDateString()} | Active Filter Size: {filteredReports.length} records
        </p>
      </div>

      {/* Main Page Top Row (Filters, search, export) */}
      <div className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-brand-green tracking-tight">
            Daily Campaign Achievements Journal
          </h2>
          <p className="text-xs text-gray-500">
            Search, sort, filter, and export the official daily log achievements recorded at Hamusit branch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl transition-all"
            title="Download Excel compatible CSV file"
          >
            <Download className="w-4 h-4 text-brand-gold" />
            Export CSV / Excel
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-green hover:bg-brand-green-light text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-green-glow"
          >
            <Printer className="w-4 h-4 text-brand-gold" />
            Print Report
          </button>
        </div>
      </div>

      {/* Filters Form Drawer */}
      <div className="print:hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-left">
        <div className="flex items-center gap-2 text-xs font-bold text-brand-green uppercase tracking-wider font-mono">
          <Filter className="w-4 h-4 text-brand-gold" />
          Filter & Search Register
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          
          {/* Search Box */}
          <div className="space-y-1 relative">
            <label className="text-[10px] font-bold text-gray-400 block uppercase">Text Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search date or day..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 focus:border-brand-green focus:outline-none rounded-xl"
              />
            </div>
          </div>

          {/* Year Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 block uppercase">Year</label>
            <select
              value={filterYear}
              onChange={(e) => { setFilterYear(e.target.value); setCurrentPage(1); }}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 focus:border-brand-green focus:outline-none rounded-xl bg-white"
            >
              <option value="">All Years</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          {/* Month Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 block uppercase">Month</label>
            <select
              value={filterMonth}
              onChange={(e) => { setFilterMonth(e.target.value); setCurrentPage(1); }}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 focus:border-brand-green focus:outline-none rounded-xl bg-white"
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2026, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
          </div>

          {/* Week Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 block uppercase">Week of Month</label>
            <select
              value={filterWeek}
              onChange={(e) => { setFilterWeek(e.target.value); setCurrentPage(1); }}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 focus:border-brand-green focus:outline-none rounded-xl bg-white"
            >
              <option value="">All Weeks</option>
              <option value="1">Week 1</option>
              <option value="2">Week 2</option>
              <option value="3">Week 3</option>
              <option value="4">Week 4</option>
              <option value="5">Week 5</option>
            </select>
          </div>

          {/* Day Filter */}
          <div className="space-y-1 flex flex-col justify-between">
            <label className="text-[10px] font-bold text-gray-400 block uppercase">Weekday</label>
            <div className="flex gap-2">
              <select
                value={filterDay}
                onChange={(e) => { setFilterDay(e.target.value); setCurrentPage(1); }}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 focus:border-brand-green focus:outline-none rounded-xl bg-white"
              >
                <option value="">All Weekdays</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>

              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 border border-gray-200 hover:bg-gray-50 text-[10px] font-bold text-gray-500 rounded-xl uppercase tracking-wider shrink-0"
              >
                Clear
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Main Journal Data Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            
            {/* Table Header */}
            <thead>
              <tr className="bg-brand-green text-white text-xs font-semibold font-mono border-b border-brand-green-light select-none">
                <th onClick={() => handleSort("date")} className="px-4 py-3.5 cursor-pointer hover:bg-brand-green-light transition-all text-left">
                  Date {sortField === "date" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("day")} className="px-4 py-3.5 cursor-pointer hover:bg-brand-green-light transition-all text-left">
                  Day {sortField === "day" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("customer_base")} className="px-4 py-3.5 cursor-pointer hover:bg-brand-green-light transition-all text-right">
                  Customer Onboarding
                </th>
                <th onClick={() => handleSort("mobile_banking")} className="px-4 py-3.5 cursor-pointer hover:bg-brand-green-light transition-all text-right">
                  Mobile Banking
                </th>
                <th onClick={() => handleSort("internet_banking")} className="px-4 py-3.5 cursor-pointer hover:bg-brand-green-light transition-all text-right">
                  Internet Banking
                </th>
                <th onClick={() => handleSort("atm")} className="px-4 py-3.5 cursor-pointer hover:bg-brand-green-light transition-all text-right">
                  ATM Debit Cards
                </th>
                <th onClick={() => handleSort("merchant")} className="px-4 py-3.5 cursor-pointer hover:bg-brand-green-light transition-all text-right">
                  Merchant Solutions
                </th>
                <th className="px-4 py-3.5 text-right font-bold text-brand-gold">
                  Daily Total
                </th>
                <th className="px-4 py-3.5 text-left print:hidden">
                  Logged By
                </th>
                <th className="px-4 py-3.5 text-center print:hidden">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-400 font-bold font-mono">
                    <span className="animate-pulse">Retrieving banking campaign registers...</span>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-400 font-mono">
                    No logs found matching specified filters. Enter a new report to persist achievements!
                  </td>
                </tr>
              ) : (
                currentItems.map((r) => {
                  const dayTotal = r.customer_base + r.mobile_banking + r.internet_banking + r.atm + r.merchant;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors font-mono">
                      {/* Date */}
                      <td className="px-4 py-3 font-bold text-gray-800">{r.date}</td>
                      
                      {/* Weekday */}
                      <td className="px-4 py-3 text-gray-500">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 font-semibold">{r.day}</span>
                      </td>

                      {/* Customer Base */}
                      <td className="px-4 py-3 text-right text-emerald-700 font-bold">{r.customer_base}</td>

                      {/* Mobile Banking */}
                      <td className="px-4 py-3 text-right text-blue-700 font-bold">{r.mobile_banking}</td>

                      {/* Internet Banking */}
                      <td className="px-4 py-3 text-right text-purple-700 font-bold">{r.internet_banking}</td>

                      {/* ATM Card */}
                      <td className="px-4 py-3 text-right text-amber-700 font-bold">{r.atm}</td>

                      {/* Merchant Solutions */}
                      <td className="px-4 py-3 text-right text-rose-700 font-bold">{r.merchant}</td>

                      {/* Daily Total */}
                      <td className="px-4 py-3 text-right font-black text-brand-green text-sm bg-gray-50/20">{dayTotal}</td>

                      {/* Logged By */}
                      <td className="px-4 py-3 text-gray-500 text-left print:hidden">{r.creator_name || "Staff"}</td>

                      {/* Action buttons */}
                      <td className="px-4 py-3 text-center print:hidden">
                        <div className="inline-flex items-center gap-1.5">
                          {(() => {
                            const createdTime = new Date(r.created_at).getTime();
                            const elapsedHours = (Date.now() - createdTime) / (1000 * 60 * 60);
                            const canEdit = user?.role === "admin" || elapsedHours <= 24;
                            return (
                              <button
                                onClick={() => {
                                  if (canEdit) {
                                    onEdit(r);
                                  }
                                }}
                                disabled={!canEdit}
                                title={canEdit ? "Edit campaign record" : "Editing disabled (exceeded 24-hour limit)"}
                                className={`p-1 rounded transition-colors ${
                                  canEdit 
                                    ? "text-gray-400 hover:text-brand-green hover:bg-gray-100" 
                                    : "text-gray-300 cursor-not-allowed bg-gray-50/50"
                                }`}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            );
                          })()}
                          
                          {/* Admin Only Delete action */}
                          {user?.role === "admin" && (
                            <button
                              onClick={() => onDelete(r.id)}
                              title="Delete campaign record"
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Table Aggregate Summary Row (Bottom totals) */}
              {sortedReports.length > 0 && (
                <tr className="bg-gray-100/60 font-mono font-bold text-xs select-none">
                  <td colSpan={2} className="px-4 py-4 text-left font-black text-brand-green font-sans">
                    FILTERED SUMS ({filteredReports.length} records)
                  </td>
                  <td className="px-4 py-4 text-right text-emerald-700 font-black text-sm">{sumCustomerBase}</td>
                  <td className="px-4 py-4 text-right text-blue-700 font-black text-sm">{sumMobileBanking}</td>
                  <td className="px-4 py-4 text-right text-purple-700 font-black text-sm">{sumInternetBanking}</td>
                  <td className="px-4 py-4 text-right text-amber-700 font-black text-sm">{sumAtm}</td>
                  <td className="px-4 py-4 text-right text-rose-700 font-black text-sm">{sumMerchant}</td>
                  <td className="px-4 py-4 text-right font-black text-brand-green text-base bg-brand-gold/10 border-l border-brand-gold">
                    {grandCombinedTotal}
                  </td>
                  <td colSpan={2} className="print:hidden"></td>
                </tr>
              )}

            </tbody>

          </table>
        </div>

        {/* Desktop Pagination Nav footer */}
        {totalPages > 1 && (
          <div className="print:hidden px-4 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-800">{indexOfFirstItem + 1}</span> to{" "}
              <span className="font-bold text-gray-800">{Math.min(indexOfLastItem, totalItems)}</span> of{" "}
              <span className="font-bold text-gray-800">{totalItems}</span> achievements entries
            </p>

            <div className="inline-flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="text-xs font-bold text-gray-700 px-3 py-1 bg-white border border-gray-200 rounded-lg">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
