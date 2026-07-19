import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullname: text("fullname").notNull(),
  role: text("role").$type<"admin" | "staff">().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  telegramId: text("telegram_id")
});

// 2. Daily Reports Table
export const dailyReports = pgTable("daily_reports", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  week: integer("week").notNull(),
  day: text("day").notNull(),
  customerBase: integer("customer_base").default(0).notNull(),
  mobileBanking: integer("mobile_banking").default(0).notNull(),
  internetBanking: integer("internet_banking").default(0).notNull(),
  atm: integer("atm").default(0).notNull(),
  merchant: integer("merchant").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" })
});

// 3. Audit Logs Table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  details: text("details").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});

// 4. System Config Table (e.g. to store Telegram Bot Token securely)
export const systemConfig = pgTable("system_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  reports: many(dailyReports),
  logs: many(auditLogs)
}));

export const dailyReportsRelations = relations(dailyReports, ({ one }) => ({
  creator: one(users, {
    fields: [dailyReports.createdBy],
    references: [users.id]
  })
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id]
  })
}));
