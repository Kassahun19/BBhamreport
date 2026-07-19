import express, { Request, Response, NextFunction } from "express";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { 
  initializeDatabase, 
  run, 
  get, 
  all, 
  db,
  getTelegramToken,
  setTelegramToken
} from "./server/database.js";
import { startTelegramBotDaemon } from "./server/telegramBot.js";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "BUNNA_SECRET_KEY_2026_HAMUSIT";

// Middleware for parsing requests
app.use(express.json());

// Enable CORS and basic security headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Helper to audit log action
async function createAuditLog(userId: number | null, action: string, details: string) {
  try {
    await run(
      "INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)",
      [userId, action, details]
    );
  } catch (err) {
    console.error("Failed to create audit log:", err);
  }
}

// Authentication Middleware
interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    fullname: string;
    role: "admin" | "staff";
  };
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token is required" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }
    req.user = user;
    next();
  });
}

// Require Admin Middleware
function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Administrator privileges required" });
    return;
  }
  next();
}

// API Routes
// 1. Auth Login
app.post("/api/auth/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  try {
    const user = await get<any>("SELECT * FROM users WHERE username = ?", [username.toLowerCase().trim()]);
    if (!user) {
      res.status(400).json({ error: "Invalid username or password" });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(400).json({ error: "Invalid username or password" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, fullname: user.fullname, role: user.role },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    await createAuditLog(user.id, "User Login", `User ${user.username} logged in successfully.`);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        role: user.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Auth me validation
app.get("/api/auth/me", authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// 3. Dashboard metrics summaries
app.get("/api/dashboard/summary", async (req: Request, res: Response) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    
    // Get year & month of today to calculate current month/year aggregates
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12

    // Get Today's counts
    const todayData = await get<any>(
      `SELECT 
        SUM(customer_base) as customer_base, 
        SUM(mobile_banking) as mobile_banking, 
        SUM(internet_banking) as internet_banking, 
        SUM(atm) as atm, 
        SUM(merchant) as merchant 
       FROM daily_reports WHERE date = ?`,
      [todayStr]
    );

    // Get Monthly counts (current calendar month)
    const monthlyData = await get<any>(
      `SELECT 
        SUM(customer_base) as customer_base, 
        SUM(mobile_banking) as mobile_banking, 
        SUM(internet_banking) as internet_banking, 
        SUM(atm) as atm, 
        SUM(merchant) as merchant 
       FROM daily_reports WHERE year = ? AND month = ?`,
      [currentYear, currentMonth]
    );

    // Get Yearly counts
    const yearlyData = await get<any>(
      `SELECT 
        SUM(customer_base) as customer_base, 
        SUM(mobile_banking) as mobile_banking, 
        SUM(internet_banking) as internet_banking, 
        SUM(atm) as atm, 
        SUM(merchant) as merchant 
       FROM daily_reports WHERE year = ?`,
      [currentYear]
    );

    // Get Weekly counts (Let's sum the last 7 entries or entries in the current calendar week)
    // To make it easy and accurate, let's sum reports with week index in current month or reports of the last 7 calendar days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];
    const weeklyData = await get<any>(
      `SELECT 
        SUM(customer_base) as customer_base, 
        SUM(mobile_banking) as mobile_banking, 
        SUM(internet_banking) as internet_banking, 
        SUM(atm) as atm, 
        SUM(merchant) as merchant 
       FROM daily_reports WHERE date >= ?`,
      [weekAgoStr]
    );

    // Get Grand / Overall counts
    const overallData = await get<any>(
      `SELECT 
        SUM(customer_base) as customer_base, 
        SUM(mobile_banking) as mobile_banking, 
        SUM(internet_banking) as internet_banking, 
        SUM(atm) as atm, 
        SUM(merchant) as merchant 
       FROM daily_reports`
    );

    const defaultRow = { customer_base: 0, mobile_banking: 0, internet_banking: 0, atm: 0, merchant: 0 };

    res.json({
      today: todayData && todayData.customer_base !== null ? todayData : defaultRow,
      weekly: weeklyData && weeklyData.customer_base !== null ? weeklyData : defaultRow,
      monthly: monthlyData && monthlyData.customer_base !== null ? monthlyData : defaultRow,
      yearly: yearlyData && yearlyData.customer_base !== null ? yearlyData : defaultRow,
      overall: overallData && overallData.customer_base !== null ? overallData : defaultRow,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. CRUD: Get all daily reports (with search & filtering)
app.get("/api/reports", async (req: Request, res: Response) => {
  const { year, month, week, day, search, limit, offset } = req.query;

  try {
    let sql = `
      SELECT r.*, u.fullname as creator_name 
      FROM daily_reports r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (year) {
      sql += " AND r.year = ?";
      params.push(Number(year));
    }
    if (month) {
      sql += " AND r.month = ?";
      params.push(Number(month));
    }
    if (week) {
      sql += " AND r.week = ?";
      params.push(Number(week));
    }
    if (day) {
      sql += " AND r.day = ?";
      params.push(String(day));
    }
    if (search) {
      sql += " AND (r.date LIKE ? OR r.day LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY r.date DESC";

    if (limit) {
      sql += " LIMIT ?";
      params.push(Number(limit));
    }
    if (offset) {
      sql += " OFFSET ?";
      params.push(Number(offset));
    }

    const reports = await all<any>(sql, params);
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. CRUD: Create Daily Report (Staff / Admin)
app.post("/api/reports", authenticateToken, async (req: AuthRequest, res: Response) => {
  const {
    date,
    customer_base,
    mobile_banking,
    internet_banking,
    atm,
    merchant
  } = req.body;

  // Validation
  if (!date) {
    res.status(400).json({ error: "Date is required" });
    return;
  }

  const c_base = Number(customer_base || 0);
  const m_bank = Number(mobile_banking || 0);
  const i_bank = Number(internet_banking || 0);
  const atm_count = Number(atm || 0);
  const merch = Number(merchant || 0);

  if (c_base < 0 || m_bank < 0 || i_bank < 0 || atm_count < 0 || merch < 0) {
    res.status(400).json({ error: "Activation values cannot be negative" });
    return;
  }

  try {
    // Check duplication
    const duplicate = await get("SELECT id FROM daily_reports WHERE date = ?", [date]);
    if (duplicate) {
      res.status(400).json({ error: `A campaign report already exists for date ${date}` });
      return;
    }

    // Parse date elements
    const reportDate = new Date(date);
    const year = reportDate.getFullYear();
    const month = reportDate.getMonth() + 1; // 1-12
    
    // Simple week of month calculation
    const dayOfMonth = reportDate.getDate();
    const week = Math.ceil(dayOfMonth / 7);

    // Get day name
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = days[reportDate.getDay()];

    const result = await run(
      `INSERT INTO daily_reports 
        (date, year, month, week, day, customer_base, mobile_banking, internet_banking, atm, merchant, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [date, year, month, week, day, c_base, m_bank, i_bank, atm_count, merch, req.user!.id]
    );

    await createAuditLog(
      req.user!.id, 
      "Create Report", 
      `Created report for ${date}: CB=${c_base}, MB=${m_bank}, IB=${i_bank}, ATM=${atm_count}, Merchant=${merch}`
    );

    res.status(201).json({
      message: "Daily campaign report saved successfully",
      id: result.id
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. CRUD: Update Daily Report (Staff / Admin)
app.put("/api/reports/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const {
    date,
    customer_base,
    mobile_banking,
    internet_banking,
    atm,
    merchant
  } = req.body;

  if (!date) {
    res.status(400).json({ error: "Date is required" });
    return;
  }

  const c_base = Number(customer_base || 0);
  const m_bank = Number(mobile_banking || 0);
  const i_bank = Number(internet_banking || 0);
  const atm_count = Number(atm || 0);
  const merch = Number(merchant || 0);

  if (c_base < 0 || m_bank < 0 || i_bank < 0 || atm_count < 0 || merch < 0) {
    res.status(400).json({ error: "Activation values cannot be negative" });
    return;
  }

  try {
    const existing = await get<any>("SELECT * FROM daily_reports WHERE id = ?", [id]);
    if (!existing) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    // Restriction: edit within 24 hours of input unless user is admin
    if (req.user!.role !== "admin") {
      const createdAt = new Date(existing.created_at).getTime();
      const now = Date.now();
      const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);
      if (hoursElapsed > 24) {
        res.status(403).json({ error: "Editing is disabled. Campaign reports can only be edited within 24 hours of submission." });
        return;
      }
    }

    // Check duplication for date if it has been changed
    if (existing.date !== date) {
      const duplicate = await get("SELECT id FROM daily_reports WHERE date = ? AND id != ?", [date, id]);
      if (duplicate) {
        res.status(400).json({ error: `A campaign report already exists for date ${date}` });
        return;
      }
    }

    const reportDate = new Date(date);
    const year = reportDate.getFullYear();
    const month = reportDate.getMonth() + 1;
    const dayOfMonth = reportDate.getDate();
    const week = Math.ceil(dayOfMonth / 7);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day = days[reportDate.getDay()];

    await run(
      `UPDATE daily_reports 
       SET date = ?, year = ?, month = ?, week = ?, day = ?, 
           customer_base = ?, mobile_banking = ?, internet_banking = ?, atm = ?, merchant = ?, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [date, year, month, week, day, c_base, m_bank, i_bank, atm_count, merch, id]
    );

    await createAuditLog(
      req.user!.id, 
      "Update Report", 
      `Updated report ID ${id} (${date}): CB=${c_base} (was ${existing.customer_base}), MB=${m_bank} (was ${existing.mobile_banking}), IB=${i_bank} (was ${existing.internet_banking}), ATM=${atm_count} (was ${existing.atm}), Merchant=${merch} (was ${existing.merchant})`
    );

    res.json({ message: "Daily campaign report updated successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. CRUD: Delete Daily Report (Admin Only)
app.delete("/api/reports/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);

  try {
    const existing = await get<any>("SELECT * FROM daily_reports WHERE id = ?", [id]);
    if (!existing) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    await run("DELETE FROM daily_reports WHERE id = ?", [id]);

    await createAuditLog(
      req.user!.id, 
      "Delete Report", 
      `Deleted report ID ${id} for date ${existing.date} with counts: CB=${existing.customer_base}, MB=${existing.mobile_banking}`
    );

    res.json({ message: "Daily campaign report deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Statistics API
app.get("/api/statistics", async (req: Request, res: Response) => {
  try {
    // Overalls for Pie & Doughnut Chart (Product Performance)
    const productPerformance = await get<any>(
      `SELECT 
        SUM(customer_base) as customerBase, 
        SUM(mobile_banking) as mobileBanking, 
        SUM(internet_banking) as internetBanking, 
        SUM(atm) as atm, 
        SUM(merchant) as merchant 
       FROM daily_reports`
    );

    // Monthly Performance overall for last several months
    const monthlyPerformance = await all<any>(
      `SELECT 
        year, month,
        SUM(customer_base) as customerBase, 
        SUM(mobile_banking) as mobileBanking, 
        SUM(internet_banking) as internetBanking, 
        SUM(atm) as atm, 
        SUM(merchant) as merchant,
        SUM(customer_base + mobile_banking + internet_banking + atm + merchant) as totalActivations
       FROM daily_reports
       GROUP BY year, month
       ORDER BY year ASC, month ASC
       LIMIT 12`
    );

    // Recent Performance (last 10 days) for Area & Line Chart
    const dailyTrend = await all<any>(
      `SELECT 
        date, day,
        customer_base as customerBase, 
        mobile_banking as mobileBanking, 
        internet_banking as internetBanking, 
        atm as atm, 
        merchant as merchant,
        (customer_base + mobile_banking + internet_banking + atm + merchant) as total
       FROM daily_reports
       ORDER BY date ASC
       LIMIT 10`
    );

    // Product Performance by Weekday (Monday to Saturday analysis)
    const weekdayPerformance = await all<any>(
      `SELECT 
        day,
        AVG(customer_base) as avgCustomerBase,
        AVG(mobile_banking) as avgMobileBanking,
        AVG(internet_banking) as avgInternetBanking,
        AVG(atm) as avgAtm,
        AVG(merchant) as avgMerchant,
        SUM(customer_base + mobile_banking + internet_banking + atm + merchant) as total
       FROM daily_reports
       GROUP BY day
       ORDER BY 
         CASE day
           WHEN 'Monday' THEN 1
           WHEN 'Tuesday' THEN 2
           WHEN 'Wednesday' THEN 3
           WHEN 'Thursday' THEN 4
           WHEN 'Friday' THEN 5
           WHEN 'Saturday' THEN 6
           WHEN 'Sunday' THEN 7
         END`
    );

    res.json({
      products: productPerformance || { customerBase: 0, mobileBanking: 0, internetBanking: 0, atm: 0, merchant: 0 },
      monthly: monthlyPerformance,
      trend: dailyTrend,
      weekday: weekdayPerformance
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Get Audit Logs (Admin Only)
app.get("/api/logs", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const logs = await all<any>(`
      SELECT l.*, u.username, u.fullname, u.role
      FROM audit_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.timestamp DESC
      LIMIT 100
    `);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Telegram Bot Configuration API (Admin Only)
app.get("/api/telegram/config", authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const token = getTelegramToken();
    res.json({
      token: token ? `${token.substring(0, 6)}...${token.substring(token.length - 4)}` : "",
      fullToken: token, // send full token securely to admins so they can edit it
      botUsername: "BunnaHamusitReportBot"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/telegram/config", authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { token } = req.body;
  try {
    setTelegramToken(token || "");
    await createAuditLog(req.user?.id || null, "Update Telegram Config", "Telegram Bot Token has been successfully updated.");
    res.json({ success: true, message: "Telegram Bot Token updated successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize database before starting the Express server
initializeDatabase()
  .then(async () => {
    // Setup Vite for Dev vs Production Client Serving
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
      // Launch Telegram Bot poller as background daemon
      startTelegramBotDaemon().catch(err => {
        console.error("[TELEGRAM] Failed to start Telegram Bot Daemon:", err);
      });
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database and start server:", err);
  });
