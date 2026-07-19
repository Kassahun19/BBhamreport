import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

// Establish database pool connection to Cloud SQL PostgreSQL
const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER || process.env.SQL_ADMIN_USER || "postgres",
  password: process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || "",
  database: process.env.SQL_DB_NAME || "postgres",
  connectionTimeoutMillis: 15000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle Cloud SQL Pool Client:", err);
});

// Cache structures to maintain synchronous compatibility with the Telegram Bot daemon
interface User {
  id: number;
  username: string;
  password: string;
  fullname: string;
  role: "admin" | "staff";
  created_at: string;
  telegram_id?: string;
  mobile?: string;
}

interface DailyReport {
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
  created_by: number | null;
}

interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  details: string;
  timestamp: string;
}

interface DBCache {
  users: User[];
  daily_reports: DailyReport[];
  audit_logs: AuditLog[];
  telegram_token?: string;
}

const defaultAdminPasswordHashed = bcrypt.hashSync("admin123", 10);
const defaultStaffPasswordHashed = bcrypt.hashSync("staff123", 10);

const memoryData: DBCache = {
  users: [
    {
      id: 1,
      username: "admin",
      password: defaultAdminPasswordHashed,
      fullname: "Administrator (Bunna Bank)",
      role: "admin",
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      username: "staff",
      password: defaultStaffPasswordHashed,
      fullname: "Branch Staff (Hamusit)",
      role: "staff",
      created_at: new Date().toISOString()
    }
  ],
  daily_reports: [
    { id: 1, date: "2026-07-10", year: 2026, month: 7, week: 2, day: "Friday", customer_base: 12, mobile_banking: 15, internet_banking: 3, atm: 8, merchant: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: 1 },
    { id: 2, date: "2026-07-11", year: 2026, month: 7, week: 2, day: "Saturday", customer_base: 15, mobile_banking: 18, internet_banking: 4, atm: 5, merchant: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: 1 },
    { id: 3, date: "2026-07-13", year: 2026, month: 7, week: 3, day: "Monday", customer_base: 22, mobile_banking: 25, internet_banking: 6, atm: 12, merchant: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: 1 },
    { id: 4, date: "2026-07-14", year: 2026, month: 7, week: 3, day: "Tuesday", customer_base: 18, mobile_banking: 20, internet_banking: 5, atm: 10, merchant: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: 1 },
    { id: 5, date: "2026-07-15", year: 2026, month: 7, week: 3, day: "Wednesday", customer_base: 25, mobile_banking: 28, internet_banking: 8, atm: 15, merchant: 6, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: 1 },
    { id: 6, date: "2026-07-16", year: 2026, month: 7, week: 3, day: "Thursday", customer_base: 20, mobile_banking: 22, internet_banking: 7, atm: 11, merchant: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: 1 },
    { id: 7, date: "2026-07-17", year: 2026, month: 7, week: 3, day: "Friday", customer_base: 30, mobile_banking: 35, internet_banking: 12, atm: 20, merchant: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: 1 },
    { id: 8, date: "2026-07-18", year: 2026, month: 7, week: 3, day: "Saturday", customer_base: 28, mobile_banking: 32, internet_banking: 10, atm: 18, merchant: 7, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: 1 }
  ],
  audit_logs: [],
  telegram_token: "8903754658:AAH5SaMsXiwk4zDiJCPJvI-X1gs3AwLuicU"
};

// SQLite compatibility adapter
export const db = {
  serialize: (fn: () => void) => fn(),
  close: (cb?: (err: Error | null) => void) => cb && cb(null)
};

// Helper to normalize rows returned by pg (which returns bigint/SUM/COUNT/AVG as strings)
function normalizeRow(row: any): any {
  if (!row) return row;
  const newRow = { ...row };
  for (const key of Object.keys(newRow)) {
    const val = newRow[key];
    if (
      key === "count" || 
      key.startsWith("sum") || 
      key.startsWith("avg") || 
      key === "customer_base" || 
      key === "mobile_banking" || 
      key === "internet_banking" || 
      key === "atm" || 
      key === "merchant" || 
      key === "customerbase" || 
      key === "mobilebanking" || 
      key === "internetbanking" || 
      key === "total" || 
      key === "totalactivations" ||
      key === "year" ||
      key === "month" ||
      key === "week" ||
      key === "id" ||
      key === "created_by" ||
      key === "user_id"
    ) {
      if (val !== null && val !== undefined) {
        newRow[key] = Number(val);
      }
    }
  }
  return newRow;
}

// Converts SQLite ? style placeholders to PostgreSQL $1, $2, etc., and adds RETURNING clauses
function convertSql(sql: string): string {
  let normalized = sql.trim();
  
  // Convert ? to $1, $2, $3, etc.
  let index = 1;
  normalized = normalized.replace(/\?/g, () => `$${index++}`);
  
  // Append RETURNING id to INSERT statements to fetch auto-assigned IDs
  if (/^\s*INSERT\s+INTO/i.test(normalized) && !/RETURNING/i.test(normalized)) {
    normalized += " RETURNING id";
  }
  
  return normalized;
}

// Reload in-memory cache from PostgreSQL database
async function reloadCache() {
  try {
    const usersRes = await pool.query("SELECT * FROM users ORDER BY id ASC");
    memoryData.users = usersRes.rows.map(row => ({
      id: row.id,
      username: row.username,
      password: row.password,
      fullname: row.fullname,
      role: row.role as "admin" | "staff",
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      telegram_id: row.telegram_id || undefined,
      mobile: row.mobile || undefined
    }));

    const reportsRes = await pool.query("SELECT * FROM daily_reports ORDER BY date ASC");
    memoryData.daily_reports = reportsRes.rows.map(row => ({
      id: row.id,
      date: row.date,
      year: Number(row.year),
      month: Number(row.month),
      week: Number(row.week),
      day: row.day,
      customer_base: Number(row.customer_base),
      mobile_banking: Number(row.mobile_banking),
      internet_banking: Number(row.internet_banking),
      atm: Number(row.atm),
      merchant: Number(row.merchant),
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
      created_by: row.created_by ? Number(row.created_by) : null
    }));

    const configRes = await pool.query("SELECT * FROM system_config WHERE key = 'telegram_token'");
    if (configRes.rows.length > 0) {
      memoryData.telegram_token = configRes.rows[0].value;
    }
  } catch (err) {
    console.error("[SQL Cache] Failed to reload cache from Cloud SQL:", err);
  }
}

let useMemoryFallback = false;

function executeMemoryQuery(sql: string, params: any[]): any[] {
  const normalized = sql.replace(/\s+/g, " ").trim().toUpperCase();

  // 1. SELECT * FROM users WHERE username = ?
  if (normalized.includes("FROM USERS") && (normalized.includes("WHERE USERNAME =") || normalized.includes("WHERE LOWER(USERNAME) ="))) {
    const username = String(params[0] || "").toLowerCase().trim();
    const user = memoryData.users.find(u => u.username.toLowerCase() === username);
    return user ? [user] : [];
  }

  // 2. SELECT SUM(...) FROM daily_reports
  if (normalized.includes("SUM(") && normalized.includes("FROM DAILY_REPORTS")) {
    let filtered = [...memoryData.daily_reports];

    if (normalized.includes("WHERE DATE =")) {
      const d = params[0];
      filtered = filtered.filter(r => r.date === d);
    } else if (normalized.includes("WHERE YEAR =") && normalized.includes("AND MONTH =")) {
      const y = Number(params[0]);
      const m = Number(params[1]);
      filtered = filtered.filter(r => r.year === y && r.month === m);
    } else if (normalized.includes("WHERE YEAR =")) {
      const y = Number(params[0]);
      filtered = filtered.filter(r => r.year === y);
    } else if (normalized.includes("WHERE DATE >= ?") || normalized.includes("WHERE DATE >=")) {
      const d = params[0];
      filtered = filtered.filter(r => r.date >= d);
    }

    const customer_base = filtered.reduce((acc, r) => acc + r.customer_base, 0);
    const mobile_banking = filtered.reduce((acc, r) => acc + r.mobile_banking, 0);
    const internet_banking = filtered.reduce((acc, r) => acc + r.internet_banking, 0);
    const atm = filtered.reduce((acc, r) => acc + r.atm, 0);
    const merchant = filtered.reduce((acc, r) => acc + r.merchant, 0);

    if (normalized.includes("CUSTOMERBASE")) {
      return [{
        customerBase: customer_base,
        mobileBanking: mobile_banking,
        internetBanking: internet_banking,
        atm,
        merchant
      }];
    }

    return [{
      customer_base,
      customerbase: customer_base,
      mobile_banking,
      mobilebanking: mobile_banking,
      internet_banking,
      internetbanking: internet_banking,
      atm,
      merchant
    }];
  }

  // 3. SELECT r.*, u.fullname as creator_name FROM daily_reports r
  if (normalized.includes("FROM DAILY_REPORTS R") || normalized.includes("FROM DAILY_REPORTS")) {
    if (normalized.includes("WHERE DATE =") && normalized.includes("AND ID !=")) {
      const d = params[0];
      const excludeId = Number(params[1]);
      const found = memoryData.daily_reports.find(r => r.date === d && r.id !== excludeId);
      return found ? [found] : [];
    }
    if (normalized.includes("WHERE DATE =")) {
      const d = params[0];
      const found = memoryData.daily_reports.find(r => r.date === d);
      return found ? [found] : [];
    }
    if (normalized.includes("WHERE ID =") || normalized.includes("WHERE R.ID =")) {
      const id = Number(params[0]);
      const found = memoryData.daily_reports.find(r => r.id === id);
      return found ? [found] : [];
    }

    let filtered = [...memoryData.daily_reports];
    let paramIdx = 0;
    if (normalized.includes("R.YEAR =")) {
      const y = Number(params[paramIdx++]);
      filtered = filtered.filter(r => r.year === y);
    }
    if (normalized.includes("R.MONTH =")) {
      const m = Number(params[paramIdx++]);
      filtered = filtered.filter(r => r.month === m);
    }
    if (normalized.includes("R.WEEK =")) {
      const w = Number(params[paramIdx++]);
      filtered = filtered.filter(r => r.week === w);
    }
    if (normalized.includes("R.DAY =")) {
      const d = String(params[paramIdx++]);
      filtered = filtered.filter(r => r.day === d);
    }
    if (normalized.includes("LIKE")) {
      const searchVal = String(params[paramIdx++]).replace(/%/g, "").toLowerCase();
      paramIdx++; // skip second like param
      filtered = filtered.filter(r => r.date.toLowerCase().includes(searchVal) || r.day.toLowerCase().includes(searchVal));
    }

    filtered.sort((a, b) => b.date.localeCompare(a.date));

    if (normalized.includes("LIMIT") && normalized.includes("OFFSET")) {
      const limitVal = Number(params[params.length - 2]);
      const offsetVal = Number(params[params.length - 1]);
      filtered = filtered.slice(offsetVal, offsetVal + limitVal);
    } else if (normalized.includes("LIMIT")) {
      const limitVal = Number(params[params.length - 1]);
      filtered = filtered.slice(0, limitVal);
    }

    return filtered.map(r => {
      const user = memoryData.users.find(u => u.id === r.created_by);
      return {
        ...r,
        creator_name: user ? user.fullname : "System/Staff",
        creatorname: user ? user.fullname : "System/Staff"
      };
    });
  }

  // 4. SELECT l.*, u.username ... FROM audit_logs
  if (normalized.includes("FROM AUDIT_LOGS")) {
    const logs = [...memoryData.audit_logs];
    logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const limitedLogs = logs.slice(0, 100);

    return limitedLogs.map(l => {
      const user = memoryData.users.find(u => u.id === l.user_id);
      return {
        ...l,
        username: user ? user.username : "system",
        fullname: user ? user.fullname : "System",
        role: user ? user.role : "admin"
      };
    });
  }

  return [];
}

function executeMemoryMutation(sql: string, params: any[]): { id: number; changes: number } {
  const normalized = sql.replace(/\s+/g, " ").trim().toUpperCase();

  if (normalized.includes("INSERT INTO DAILY_REPORTS")) {
    const nextId = memoryData.daily_reports.reduce((max, r) => Math.max(max, r.id || 0), 0) + 1;
    const [date, year, month, week, day, customer_base, mobile_banking, internet_banking, atm, merchant, created_by] = params;
    const now = new Date().toISOString();
    const newReport = {
      id: nextId,
      date,
      year: Number(year),
      month: Number(month),
      week: Number(week),
      day,
      customer_base: Number(customer_base),
      mobile_banking: Number(mobile_banking),
      internet_banking: Number(internet_banking),
      atm: Number(atm),
      merchant: Number(merchant),
      created_by: Number(created_by),
      created_at: now,
      updated_at: now
    };
    memoryData.daily_reports.push(newReport);
    return { id: nextId, changes: 1 };
  }

  if (normalized.includes("UPDATE DAILY_REPORTS")) {
    const id = Number(params[params.length - 1]);
    const found = memoryData.daily_reports.find(r => r.id === id);
    if (found) {
      found.date = params[0];
      found.year = Number(params[1]);
      found.month = Number(params[2]);
      found.week = Number(params[3]);
      found.day = params[4];
      found.customer_base = Number(params[5]);
      found.mobile_banking = Number(params[6]);
      found.internet_banking = Number(params[7]);
      found.atm = Number(params[8]);
      found.merchant = Number(params[9]);
      found.updated_at = new Date().toISOString();
      return { id, changes: 1 };
    }
    return { id: 0, changes: 0 };
  }

  if (normalized.includes("DELETE FROM DAILY_REPORTS")) {
    const id = Number(params[0]);
    const initialLen = memoryData.daily_reports.length;
    memoryData.daily_reports = memoryData.daily_reports.filter(r => r.id !== id);
    return { id, changes: initialLen - memoryData.daily_reports.length };
  }

  if (normalized.includes("INSERT INTO AUDIT_LOGS")) {
    const nextId = memoryData.audit_logs.reduce((max, l) => Math.max(max, l.id || 0), 0) + 1;
    const [user_id, action, details] = params;
    memoryData.audit_logs.push({
      id: nextId,
      user_id: user_id ? Number(user_id) : null,
      action,
      details,
      timestamp: new Date().toISOString()
    });
    return { id: nextId, changes: 1 };
  }

  return { id: 0, changes: 0 };
}

// Primary async raw query runner (Promise-based)
export async function run(sql: string, params: any[] = []): Promise<{ id: number; changes: number }> {
  if (useMemoryFallback) {
    return executeMemoryMutation(sql, params);
  }
  try {
    const convertedSql = convertSql(sql);
    const result = await pool.query(convertedSql, params);
    const id = result.rows[0]?.id || 0;
    
    // Reload the cache asynchronously to ensure synchronous helpers have the latest snapshot
    reloadCache().catch(err => console.error("[SQL Cache] Reload error after run:", err));
    
    return { id, changes: result.rowCount || 0 };
  } catch (err) {
    console.warn("[SQL] pg query failed in run(), falling back to memory execution:", err);
    useMemoryFallback = true;
    return executeMemoryMutation(sql, params);
  }
}

// Primary single-row fetcher (Promise-based)
export async function get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
  if (useMemoryFallback) {
    const rows = executeMemoryQuery(sql, params);
    return rows[0] as T;
  }
  try {
    const convertedSql = convertSql(sql);
    const result = await pool.query(convertedSql, params);
    const row = result.rows[0];
    if (!row) return undefined;
    return normalizeRow(row) as T;
  } catch (err) {
    console.warn("[SQL] pg query failed in get(), falling back to memory execution:", err);
    useMemoryFallback = true;
    const rows = executeMemoryQuery(sql, params);
    return rows[0] as T;
  }
}

// Primary multi-row fetcher (Promise-based)
export async function all<T>(sql: string, params: any[] = []): Promise<T[]> {
  if (useMemoryFallback) {
    return executeMemoryQuery(sql, params) as T[];
  }
  try {
    const convertedSql = convertSql(sql);
    const result = await pool.query(convertedSql, params);
    return result.rows.map(row => normalizeRow(row)) as T[];
  } catch (err) {
    console.warn("[SQL] pg query failed in all(), falling back to memory execution:", err);
    useMemoryFallback = true;
    return executeMemoryQuery(sql, params) as T[];
  }
}

// Setup and seed default database state (called on startup)
export async function initializeDatabase() {
  console.log("[SQL] Initializing and seeding Cloud SQL PostgreSQL database...");
  
  try {
    // Run schema migration to add mobile column if it doesn't exist
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(100)");

    // 1. Fetch existing users to check seeding
    const usersRes = await pool.query("SELECT * FROM users ORDER BY id ASC");
    memoryData.users = usersRes.rows.map(row => ({
      id: row.id,
      username: row.username,
      password: row.password,
      fullname: row.fullname,
      role: row.role as "admin" | "staff",
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      telegram_id: row.telegram_id || undefined,
      mobile: row.mobile || undefined
    }));
    
    // Seed default administrator if not present
    const adminExists = memoryData.users.find(u => u.username === "admin");
    if (!adminExists) {
      const adminHashed = await bcrypt.hash("admin123", 10);
      const seedAdminRes = await pool.query(
        "INSERT INTO users (username, password, fullname, role) VALUES ($1, $2, $3, $4) RETURNING *",
        ["admin", adminHashed, "Administrator (Bunna Bank)", "admin"]
      );
      if (seedAdminRes.rows.length > 0) {
        const u = seedAdminRes.rows[0];
        memoryData.users.push({
          id: u.id,
          username: u.username,
          password: u.password,
          fullname: u.fullname,
          role: u.role as "admin" | "staff",
          created_at: new Date(u.created_at).toISOString()
        });
        console.log("[SQL] Seeded default admin credentials into Cloud SQL.");
      }
    }

    // Seed default staff if not present
    const staffExists = memoryData.users.find(u => u.username === "staff");
    if (!staffExists) {
      const staffHashed = await bcrypt.hash("staff123", 10);
      const seedStaffRes = await pool.query(
        "INSERT INTO users (username, password, fullname, role) VALUES ($1, $2, $3, $4) RETURNING *",
        ["staff", staffHashed, "Branch Staff (Hamusit)", "staff"]
      );
      if (seedStaffRes.rows.length > 0) {
        const u = seedStaffRes.rows[0];
        memoryData.users.push({
          id: u.id,
          username: u.username,
          password: u.password,
          fullname: u.fullname,
          role: u.role as "admin" | "staff",
          created_at: new Date(u.created_at).toISOString()
        });
        console.log("[SQL] Seeded default staff credentials into Cloud SQL.");
      }
    }

    // 2. Fetch reports to check seeding
    const reportsRes = await pool.query("SELECT * FROM daily_reports ORDER BY date ASC");
    memoryData.daily_reports = reportsRes.rows.map(row => ({
      id: row.id,
      date: row.date,
      year: Number(row.year),
      month: Number(row.month),
      week: Number(row.week),
      day: row.day,
      customer_base: Number(row.customer_base),
      mobile_banking: Number(row.mobile_banking),
      internet_banking: Number(row.internet_banking),
      atm: Number(row.atm),
      merchant: Number(row.merchant),
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
      created_by: row.created_by ? Number(row.created_by) : null
    }));

    // Seed beautiful demo records if empty
    if (memoryData.daily_reports.length === 0) {
      console.log("[SQL] Seeding demo campaign reports into Cloud SQL daily_reports...");
      const sampleData = [
        { date: "2026-07-10", year: 2026, month: 7, week: 2, day: "Friday", customer_base: 12, mobile_banking: 15, internet_banking: 3, atm: 8, merchant: 4 },
        { date: "2026-07-11", year: 2026, month: 7, week: 2, day: "Saturday", customer_base: 15, mobile_banking: 18, internet_banking: 4, atm: 5, merchant: 2 },
        { date: "2026-07-13", year: 2026, month: 7, week: 3, day: "Monday", customer_base: 22, mobile_banking: 25, internet_banking: 6, atm: 12, merchant: 5 },
        { date: "2026-07-14", year: 2026, month: 7, week: 3, day: "Tuesday", customer_base: 18, mobile_banking: 20, internet_banking: 5, atm: 10, merchant: 3 },
        { date: "2026-07-15", year: 2026, month: 7, week: 3, day: "Wednesday", customer_base: 25, mobile_banking: 28, internet_banking: 8, atm: 15, merchant: 6 },
        { date: "2026-07-16", year: 2026, month: 7, week: 3, day: "Thursday", customer_base: 20, mobile_banking: 22, internet_banking: 7, atm: 11, merchant: 4 },
        { date: "2026-07-17", year: 2026, month: 7, week: 3, day: "Friday", customer_base: 30, mobile_banking: 35, internet_banking: 12, atm: 20, merchant: 8 },
        { date: "2026-07-18", year: 2026, month: 7, week: 3, day: "Saturday", customer_base: 28, mobile_banking: 32, internet_banking: 10, atm: 18, merchant: 7 }
      ];

      const adminUser = memoryData.users.find(u => u.username === "admin");
      const creatorId = adminUser ? adminUser.id : 1;

      for (const d of sampleData) {
        const seedReportRes = await pool.query(
          `INSERT INTO daily_reports (
             date, year, month, week, day, customer_base, mobile_banking, internet_banking, atm, merchant, created_by, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) RETURNING *`,
          [d.date, d.year, d.month, d.week, d.day, d.customer_base, d.mobile_banking, d.internet_banking, d.atm, d.merchant, creatorId]
        );
        if (seedReportRes.rows.length > 0) {
          const r = seedReportRes.rows[0];
          memoryData.daily_reports.push({
            id: r.id,
            date: r.date,
            year: Number(r.year),
            month: Number(r.month),
            week: Number(r.week),
            day: r.day,
            customer_base: Number(r.customer_base),
            mobile_banking: Number(r.mobile_banking),
            internet_banking: Number(r.internet_banking),
            atm: Number(r.atm),
            merchant: Number(r.merchant),
            created_at: new Date(r.created_at).toISOString(),
            updated_at: new Date(r.updated_at).toISOString(),
            created_by: r.created_by ? Number(r.created_by) : null
          });
        }
      }
      console.log(`[SQL] Successfully seeded ${sampleData.length} initial demo reports.`);
    }

    // 3. Load other configurations
    const configRes = await pool.query("SELECT * FROM system_config WHERE key = 'telegram_token'");
    if (configRes.rows.length > 0 && configRes.rows[0].value) {
      memoryData.telegram_token = configRes.rows[0].value;
    } else {
      const defaultToken = "8903754658:AAH5SaMsXiwk4zDiJCPJvI-X1gs3AwLuicU";
      await pool.query(
        `INSERT INTO system_config (key, value) VALUES ('telegram_token', $1)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [defaultToken]
      );
      memoryData.telegram_token = defaultToken;
      console.log("[SQL] Seeded default user Telegram Bot Token: " + defaultToken);
    }

    console.log("[SQL] Cloud SQL cache initialization completed successfully.");
  } catch (err) {
    console.warn("[SQL] Critical error during database cache seeding. Falling back to memory fallback mode:", err);
    useMemoryFallback = true;
  }
}

// Telegram Token Helpers
export function getTelegramToken(): string {
  return memoryData.telegram_token || process.env.TELEGRAM_BOT_TOKEN || "";
}

export function setTelegramToken(token: string) {
  memoryData.telegram_token = token;
  pool.query(
    `INSERT INTO system_config (key, value) VALUES ('telegram_token', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [token]
  ).catch(err => console.error("[SQL] setTelegramToken write failure:", err));
}

// Link Telegram User Account
export function linkTelegramUser(username: string, telegramId: string | number): User | null {
  const user = memoryData.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (user) {
    user.telegram_id = String(telegramId);
    pool.query(
      "UPDATE users SET telegram_id = $1 WHERE id = $2",
      [String(telegramId), user.id]
    ).catch(err => console.error("[SQL] linkTelegramUser write failure:", err));
    return user;
  }
  return null;
}

// Register dynamic Telegram user or update details
export async function registerTelegramUser(fullname: string, username: string, passwordHashed: string, telegramId: string, mobile: string): Promise<User> {
  const existingIndex = memoryData.users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (existingIndex !== -1) {
    const user = memoryData.users[existingIndex];
    user.fullname = fullname;
    user.password = passwordHashed;
    user.telegram_id = telegramId;
    user.mobile = mobile;
    
    await pool.query(
      "UPDATE users SET fullname = $1, password = $2, telegram_id = $3, mobile = $4 WHERE id = $5",
      [fullname, passwordHashed, telegramId, mobile, user.id]
    );
    return user;
  } else {
    const nextId = memoryData.users.reduce((max, u) => Math.max(max, u.id || 0), 0) + 1;
    const newUser: User = {
      id: nextId,
      username,
      password: passwordHashed,
      fullname,
      role: "staff",
      created_at: new Date().toISOString(),
      telegram_id: telegramId,
      mobile
    };
    memoryData.users.push(newUser);
    
    await pool.query(
      "INSERT INTO users (id, username, password, fullname, role, telegram_id, mobile, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())",
      [nextId, username, passwordHashed, fullname, "staff", telegramId, mobile]
    );
    return newUser;
  }
}

// Retrieve user linked to a Telegram account
export function getUserByTelegramId(telegramId: string | number): User | null {
  const user = memoryData.users.find(u => String(u.telegram_id) === String(telegramId));
  return user || null;
}

// Unlink Telegram account from user profile
export function unlinkTelegramUser(telegramId: string | number): boolean {
  const user = memoryData.users.find(u => String(u.telegram_id) === String(telegramId));
  if (user) {
    delete user.telegram_id;
    pool.query(
      "UPDATE users SET telegram_id = NULL WHERE id = $1",
      [user.id]
    ).catch(err => console.error("[SQL] unlinkTelegramUser write failure:", err));
    return true;
  }
  return false;
}

// Raw cache selectors for Telegram analytics and administration
export function getRawReports(): DailyReport[] {
  return memoryData.daily_reports;
}

export function getRawUsers(): User[] {
  return memoryData.users;
}

// Insert report generated through the Telegram Bot Interface
export function insertRawReport(report: Omit<DailyReport, "id" | "created_at" | "updated_at">): DailyReport {
  const nextId = memoryData.daily_reports.reduce((max, r) => Math.max(max, r.id || 0), 0) + 1;
  const now = new Date().toISOString();
  
  const newReport: DailyReport = {
    id: nextId,
    ...report,
    created_at: now,
    updated_at: now
  };
  memoryData.daily_reports.push(newReport);

  pool.query(
    `INSERT INTO daily_reports (
       id, date, year, month, week, day, customer_base, mobile_banking, internet_banking, atm, merchant, created_by, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
     ON CONFLICT (date) DO UPDATE SET
       year = EXCLUDED.year,
       month = EXCLUDED.month,
       week = EXCLUDED.week,
       day = EXCLUDED.day,
       customer_base = EXCLUDED.customer_base,
       mobile_banking = EXCLUDED.mobile_banking,
       internet_banking = EXCLUDED.internet_banking,
       atm = EXCLUDED.atm,
       merchant = EXCLUDED.merchant,
       created_by = EXCLUDED.created_by,
       updated_at = NOW()`,
    [
      nextId,
      report.date,
      report.year,
      report.month,
      report.week,
      report.day,
      report.customer_base,
      report.mobile_banking,
      report.internet_banking,
      report.atm,
      report.merchant,
      report.created_by
    ]
  ).catch(err => console.error("[SQL] insertRawReport write failure:", err));

  return newReport;
}

// Update report details from Telegram interface
export function updateRawReport(id: number, report: Partial<DailyReport>): DailyReport | null {
  const found = memoryData.daily_reports.find(r => r.id === id);
  if (found) {
    Object.assign(found, report);
    found.updated_at = new Date().toISOString();

    pool.query(
      `UPDATE daily_reports SET
         date = $1, year = $2, month = $3, week = $4, day = $5,
         customer_base = $6, mobile_banking = $7, internet_banking = $8,
         atm = $9, merchant = $10, created_by = $11, updated_at = NOW()
       WHERE id = $12`,
      [
        found.date,
        found.year,
        found.month,
        found.week,
        found.day,
        found.customer_base,
        found.mobile_banking,
        found.internet_banking,
        found.atm,
        found.merchant,
        found.created_by,
        id
      ]
    ).catch(err => console.error("[SQL] updateRawReport write failure:", err));

    return found;
  }
  return null;
}

// Delete report via Telegram administrator action
export function deleteRawReport(id: number): boolean {
  const initialLen = memoryData.daily_reports.length;
  memoryData.daily_reports = memoryData.daily_reports.filter(r => r.id !== id);

  pool.query("DELETE FROM daily_reports WHERE id = $1", [id])
    .catch(err => console.error("[SQL] deleteRawReport write failure:", err));

  return memoryData.daily_reports.length < initialLen;
}
