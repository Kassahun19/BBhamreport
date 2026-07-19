export interface User {
  id: number;
  username: string;
  fullname: string;
  role: "admin" | "staff";
}

export interface DailyReport {
  id: number;
  date: string;
  year: number;
  month: number;
  week: number;
  day: string;
  customer_base: number;
  mobile_banking: number;
  internet_banking: number;
  atm: number;
  merchant: number;
  created_at: string;
  updated_at: string;
  creator_name?: string;
}

export interface MetricRow {
  customer_base: number;
  mobile_banking: number;
  internet_banking: number;
  atm: number;
  merchant: number;
}

export interface DashboardSummary {
  today: MetricRow;
  weekly: MetricRow;
  monthly: MetricRow;
  yearly: MetricRow;
  overall: MetricRow;
}

export interface ProductPerformance {
  customerBase: number;
  mobileBanking: number;
  internetBanking: number;
  atm: number;
  merchant: number;
}

export interface MonthlyPerformance {
  year: number;
  month: number;
  customerBase: number;
  mobileBanking: number;
  internetBanking: number;
  atm: number;
  merchant: number;
  totalActivations: number;
}

export interface DailyTrend {
  date: string;
  day: string;
  customerBase: number;
  mobileBanking: number;
  internetBanking: number;
  atm: number;
  merchant: number;
  total: number;
}

export interface WeekdayPerformance {
  day: string;
  avgCustomerBase: number;
  avgMobileBanking: number;
  avgInternetBanking: number;
  avgAtm: number;
  avgMerchant: number;
  total: number;
}

export interface Statistics {
  products: ProductPerformance;
  monthly: MonthlyPerformance[];
  trend: DailyTrend[];
  weekday: WeekdayPerformance[];
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  details: string;
  timestamp: string;
  username?: string;
  fullname?: string;
  role?: string;
}
