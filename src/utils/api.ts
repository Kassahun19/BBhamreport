// Bunna Bank campaign API client helper
import { DailyReport, DashboardSummary, Statistics, User } from "../types";

// Detect the backend base URL dynamically
// If the app is run from a different origin (like Vercel, Netlify, custom domain), we should target the Shared App URL backend!
const getApiBase = (): string => {
  if (typeof window === "undefined") return "";
  
  // Allow manual override via environment variables
  const env = (import.meta as any).env;
  if (env && env.VITE_API_URL) {
    return env.VITE_API_URL;
  }
  
  const hostname = window.location.hostname;
  
  // If running locally (localhost, 127.0.0.1) or directly on the Cloud Run development/production domain, use relative paths.
  if (
    hostname === "localhost" || 
    hostname === "127.0.0.1" || 
    hostname.includes("run.app")
  ) {
    return "";
  }
  
  // Otherwise, if deployed on Vercel or other platform, target the live Shared App URL container!
  return "https://ais-pre-tp42fi4trlyc7ipolwijlw-46967922848.europe-west2.run.app";
};

const API_BASE = getApiBase();

export function getHeaders(): HeadersInit {
  const token = localStorage.getItem("bunna_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function login(username: string, password: string) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Login failed");
  }

  const data = await response.json();
  localStorage.setItem("bunna_token", data.token);
  localStorage.setItem("bunna_user", JSON.stringify(data.user));
  return data;
}

export function logout() {
  localStorage.removeItem("bunna_token");
  localStorage.removeItem("bunna_user");
}

export function getStoredUser() {
  const user = localStorage.getItem("bunna_user");
  if (user) {
    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  }
  return null;
}

// Local cache helper calculations
function calculateSummaryFromLocal(): DashboardSummary {
  const localRaw = localStorage.getItem("bunna_local_reports");
  let reports: any[] = [];
  if (localRaw) {
    try {
      reports = JSON.parse(localRaw);
    } catch {
      reports = [];
    }
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];

  const defaultRow = { customer_base: 0, mobile_banking: 0, internet_banking: 0, atm: 0, merchant: 0 };

  const sum = (list: any[]) => {
    if (list.length === 0) return defaultRow;
    return list.reduce((acc, r) => ({
      customer_base: acc.customer_base + (Number(r.customer_base) || 0),
      mobile_banking: acc.mobile_banking + (Number(r.mobile_banking) || 0),
      internet_banking: acc.internet_banking + (Number(r.internet_banking) || 0),
      atm: acc.atm + (Number(r.atm) || 0),
      merchant: acc.merchant + (Number(r.merchant) || 0),
    }), { customer_base: 0, mobile_banking: 0, internet_banking: 0, atm: 0, merchant: 0 });
  };

  const todayReports = reports.filter(r => r.date === todayStr);
  const weeklyReports = reports.filter(r => r.date >= weekAgoStr);
  const monthlyReports = reports.filter(r => Number(r.year) === currentYear && Number(r.month) === currentMonth);
  const yearlyReports = reports.filter(r => Number(r.year) === currentYear);

  return {
    today: sum(todayReports),
    weekly: sum(weeklyReports),
    monthly: sum(monthlyReports),
    yearly: sum(yearlyReports),
    overall: sum(reports)
  };
}

function calculateStatisticsFromLocal(): Statistics {
  const localRaw = localStorage.getItem("bunna_local_reports");
  let reports: any[] = [];
  if (localRaw) {
    try {
      reports = JSON.parse(localRaw);
    } catch {
      reports = [];
    }
  }

  // 1. Product performance (sums of all)
  const productPerformance = reports.reduce((acc, r) => ({
    customerBase: acc.customerBase + (Number(r.customer_base) || 0),
    mobileBanking: acc.mobileBanking + (Number(r.mobile_banking) || 0),
    internetBanking: acc.internetBanking + (Number(r.internet_banking) || 0),
    atm: acc.atm + (Number(r.atm) || 0),
    merchant: acc.merchant + (Number(r.merchant) || 0),
  }), { customerBase: 0, mobileBanking: 0, internetBanking: 0, atm: 0, merchant: 0 });

  // 2. Monthly Performance (group by year, month)
  const groups: { [key: string]: any } = {};
  for (const r of reports) {
    const key = `${r.year}-${r.month}`;
    if (!groups[key]) {
      groups[key] = {
        year: Number(r.year),
        month: Number(r.month),
        customerBase: 0,
        mobileBanking: 0,
        internetBanking: 0,
        atm: 0,
        merchant: 0,
        totalActivations: 0
      };
    }
    const cb = Number(r.customer_base) || 0;
    const mb = Number(r.mobile_banking) || 0;
    const ib = Number(r.internet_banking) || 0;
    const atm = Number(r.atm) || 0;
    const mer = Number(r.merchant) || 0;

    groups[key].customerBase += cb;
    groups[key].mobileBanking += mb;
    groups[key].internetBanking += ib;
    groups[key].atm += atm;
    groups[key].merchant += mer;
    groups[key].totalActivations += (cb + mb + ib + atm + mer);
  }
  const monthlyPerformance = Object.values(groups).sort((a: any, b: any) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  }).slice(-12);

  // 3. Daily Trend (last 10 days sorted chronologically)
  const sortedReports = [...reports].sort((a, b) => a.date.localeCompare(b.date));
  const dailyTrend = sortedReports.slice(-10).map(r => {
    const cb = Number(r.customer_base) || 0;
    const mb = Number(r.mobile_banking) || 0;
    const ib = Number(r.internet_banking) || 0;
    const atm = Number(r.atm) || 0;
    const mer = Number(r.merchant) || 0;
    return {
      date: r.date,
      day: r.day,
      customerBase: cb,
      mobileBanking: mb,
      internetBanking: ib,
      atm: atm,
      merchant: mer,
      total: cb + mb + ib + atm + mer
    };
  });

  // 4. Weekday Performance
  const weekdayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const weekdayGroups: { [key: string]: { day: string; cb: number[]; mb: number[]; ib: number[]; atm: number[]; mer: number[]; total: number } } = {};
  for (const day of weekdayOrder) {
    weekdayGroups[day] = { day, cb: [], mb: [], ib: [], atm: [], mer: [], total: 0 };
  }

  for (const r of reports) {
    const day = r.day;
    if (weekdayGroups[day]) {
      const cb = Number(r.customer_base) || 0;
      const mb = Number(r.mobile_banking) || 0;
      const ib = Number(r.internet_banking) || 0;
      const atm = Number(r.atm) || 0;
      const mer = Number(r.merchant) || 0;

      weekdayGroups[day].cb.push(cb);
      weekdayGroups[day].mb.push(mb);
      weekdayGroups[day].ib.push(ib);
      weekdayGroups[day].atm.push(atm);
      weekdayGroups[day].mer.push(mer);
      weekdayGroups[day].total += (cb + mb + ib + atm + mer);
    }
  }

  const weekdayPerformance = weekdayOrder.map(day => {
    const g = weekdayGroups[day];
    const avg = (list: number[]) => list.length === 0 ? 0 : Number((list.reduce((a, b) => a + b, 0) / list.length).toFixed(1));
    return {
      day,
      avgCustomerBase: avg(g.cb),
      avgMobileBanking: avg(g.mb),
      avgInternetBanking: avg(g.ib),
      avgAtm: avg(g.atm),
      avgMerchant: avg(g.mer),
      total: g.total
    };
  });

  return {
    products: productPerformance,
    monthly: monthlyPerformance,
    trend: dailyTrend,
    weekday: weekdayPerformance
  };
}

// Master bidirectional sync handler
async function syncLocalAndServer(serverReports: DailyReport[]): Promise<DailyReport[]> {
  try {
    const localRaw = localStorage.getItem("bunna_local_reports");
    let localReports: DailyReport[] = [];
    if (localRaw) {
      try {
        localReports = JSON.parse(localRaw);
      } catch {
        localReports = [];
      }
    }

    const deletedDatesRaw = localStorage.getItem("bunna_deleted_dates");
    const deletedDates: string[] = deletedDatesRaw ? JSON.parse(deletedDatesRaw) : [];
    const deletedSet = new Set(deletedDates);

    // If there is no token, we can't upload, but we can update our local cache with what the server has
    const token = localStorage.getItem("bunna_token");
    if (!token) {
      const localDates = new Set(localReports.map(r => r.date));
      let changed = false;
      serverReports.forEach(s => {
        if (!localDates.has(s.date) && !deletedSet.has(s.date)) {
          localReports.push(s);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem("bunna_local_reports", JSON.stringify(localReports));
      }
      return serverReports;
    }

    // Two-way sync:
    // 1. Upload reports that are in localReports but NOT in serverReports, and NOT deleted
    const serverDates = new Set(serverReports.map(r => r.date));
    const toUpload = localReports.filter(r => !serverDates.has(r.date) && !deletedSet.has(r.date));

    if (toUpload.length > 0) {
      console.log(`Syncing ${toUpload.length} local reports to server...`);
      for (const rep of toUpload) {
        try {
          await fetch(`${API_BASE}/api/reports`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
              date: rep.date,
              customer_base: rep.customer_base,
              mobile_banking: rep.mobile_banking,
              internet_banking: rep.internet_banking,
              atm: rep.atm,
              merchant: rep.merchant
            })
          });
        } catch (err) {
          console.error(`Sync upload failed for date ${rep.date}:`, err);
        }
      }
      
      // Re-fetch clean list from server to get correct IDs
      const freshRes = await fetch(`${API_BASE}/api/reports`, { headers: getHeaders() });
      if (freshRes.ok) {
        serverReports = await freshRes.json();
      }
    }

    // 2. Update localStorage with the latest server reports
    const mergedList = [...serverReports];
    const freshServerDates = new Set(serverReports.map(r => r.date));
    
    localReports.forEach(r => {
      if (!freshServerDates.has(r.date) && !deletedSet.has(r.date)) {
        mergedList.push(r);
      }
    });

    localStorage.setItem("bunna_local_reports", JSON.stringify(mergedList));
    return mergedList;
  } catch (err) {
    console.error("Error syncing local and server:", err);
    return serverReports;
  }
}

export async function fetchSummary(): Promise<DashboardSummary> {
  try {
    const response = await fetch(`${API_BASE}/api/dashboard/summary`, {
      headers: getHeaders(),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("fetchSummary server error, calculating from local cache:", err);
  }
  return calculateSummaryFromLocal();
}

export async function fetchReports(filters?: {
  year?: string;
  month?: string;
  week?: string;
  day?: string;
  search?: string;
}): Promise<DailyReport[]> {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params.append(key, val);
      });
    }
    const response = await fetch(`${API_BASE}/api/reports?${params.toString()}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch reports");
    const serverReports = await response.json();

    // ONLY synchronize when no filters are applied, so we can do full two-way master sync!
    const hasFilters = filters && Object.values(filters).some(val => val !== undefined && val !== "");
    if (!hasFilters) {
      return await syncLocalAndServer(serverReports);
    }

    return serverReports;
  } catch (err) {
    console.warn("Failed to fetch reports from server, falling back to local storage:", err);
    const localRaw = localStorage.getItem("bunna_local_reports");
    if (localRaw) {
      try {
        let reportsList: DailyReport[] = JSON.parse(localRaw);
        // Apply basic local filtering if needed
        if (filters) {
          if (filters.year) reportsList = reportsList.filter(r => String(r.year) === filters.year);
          if (filters.month) reportsList = reportsList.filter(r => String(r.month) === filters.month);
          if (filters.week) reportsList = reportsList.filter(r => String(r.week) === filters.week);
          if (filters.day) reportsList = reportsList.filter(r => r.day.toLowerCase() === filters.day?.toLowerCase());
          if (filters.search) {
            const searchVal = filters.search.toLowerCase();
            reportsList = reportsList.filter(r => r.date.includes(searchVal) || r.day.toLowerCase().includes(searchVal));
          }
        }
        return reportsList.sort((a, b) => b.date.localeCompare(a.date));
      } catch {
        // fall through to throw
      }
    }
    throw err;
  }
}

export async function saveReport(report: {
  date: string;
  customer_base: number;
  mobile_banking: number;
  internet_banking: number;
  atm: number;
  merchant: number;
}) {
  const response = await fetch(`${API_BASE}/api/reports`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(report),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to save daily report");
  }
  const result = await response.json();
  
  // Update localStorage
  try {
    const localRaw = localStorage.getItem("bunna_local_reports");
    let localReports = localRaw ? JSON.parse(localRaw) : [];
    
    // Parse date components to match DailyReport structure
    const parsedDate = new Date(report.date);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = days[parsedDate.getDay()];
    
    const newReportObj: any = {
      id: result.id,
      date: report.date,
      year: parsedDate.getFullYear(),
      month: parsedDate.getMonth() + 1,
      week: Math.ceil(parsedDate.getDate() / 7),
      day: day,
      customer_base: report.customer_base,
      mobile_banking: report.mobile_banking,
      internet_banking: report.internet_banking,
      atm: report.atm,
      merchant: report.merchant,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null
    };
    
    // Remove if duplicates by date exist
    localReports = localReports.filter((r: any) => r.date !== report.date);
    localReports.push(newReportObj);
    localStorage.setItem("bunna_local_reports", JSON.stringify(localReports));
    
    // Remove from deleted list
    const deletedRaw = localStorage.getItem("bunna_deleted_dates");
    if (deletedRaw) {
      let deleted = JSON.parse(deletedRaw);
      deleted = deleted.filter((d: string) => d !== report.date);
      localStorage.setItem("bunna_deleted_dates", JSON.stringify(deleted));
    }
  } catch (err) {
    console.error("Local storage update error in saveReport:", err);
  }

  return result;
}

export async function updateReport(id: number, report: {
  date: string;
  customer_base: number;
  mobile_banking: number;
  internet_banking: number;
  atm: number;
  merchant: number;
}) {
  const response = await fetch(`${API_BASE}/api/reports/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(report),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to update daily report");
  }
  const result = await response.json();

  // Update localStorage
  try {
    const localRaw = localStorage.getItem("bunna_local_reports");
    if (localRaw) {
      let localReports = JSON.parse(localRaw);
      const parsedDate = new Date(report.date);
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const day = days[parsedDate.getDay()];

      localReports = localReports.map((r: any) => {
        if (r.id === id || r.date === report.date) {
          return {
            ...r,
            ...report,
            year: parsedDate.getFullYear(),
            month: parsedDate.getMonth() + 1,
            week: Math.ceil(parsedDate.getDate() / 7),
            day: day,
            updated_at: new Date().toISOString()
          };
        }
        return r;
      });
      localStorage.setItem("bunna_local_reports", JSON.stringify(localReports));
    }
  } catch (err) {
    console.error("Local storage update error in updateReport:", err);
  }

  return result;
}

export async function deleteReport(id: number) {
  // Let's find the report in local cache first to know its date for adding to the deleted dates list
  let dateToExclude = "";
  try {
    const localRaw = localStorage.getItem("bunna_local_reports");
    if (localRaw) {
      const localReports = JSON.parse(localRaw);
      const match = localReports.find((r: any) => r.id === id);
      if (match) {
        dateToExclude = match.date;
      }
    }
  } catch (err) {
    console.error("Error reading cache for deletion info:", err);
  }

  const response = await fetch(`${API_BASE}/api/reports/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to delete report");
  }
  const result = await response.json();

  // Update local storage
  try {
    if (dateToExclude) {
      const deletedRaw = localStorage.getItem("bunna_deleted_dates");
      const deleted = deletedRaw ? JSON.parse(deletedRaw) : [];
      if (!deleted.includes(dateToExclude)) {
        deleted.push(dateToExclude);
        localStorage.setItem("bunna_deleted_dates", JSON.stringify(deleted));
      }
    }

    const localRaw = localStorage.getItem("bunna_local_reports");
    if (localRaw) {
      let localReports = JSON.parse(localRaw);
      localReports = localReports.filter((r: any) => r.id !== id && (dateToExclude ? r.date !== dateToExclude : true));
      localStorage.setItem("bunna_local_reports", JSON.stringify(localReports));
    }
  } catch (err) {
    console.error("Local storage update error in deleteReport:", err);
  }

  return result;
}

export async function fetchStatistics(): Promise<Statistics> {
  try {
    const response = await fetch(`${API_BASE}/api/statistics`, {
      headers: getHeaders(),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Failed to fetch campaign statistics, calculating from local cache:", err);
  }
  return calculateStatisticsFromLocal();
}

export async function fetchAuditLogs() {
  const response = await fetch(`${API_BASE}/api/logs`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch audit logs");
  return response.json();
}
