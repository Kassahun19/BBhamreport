import { 
  getTelegramToken, 
  getUserByTelegramId, 
  linkTelegramUser, 
  unlinkTelegramUser, 
  getRawReports, 
  getRawUsers, 
  insertRawReport, 
  deleteRawReport,
  updateRawReport,
  registerTelegramUser
} from "./database.js";
import bcrypt from "bcryptjs";

// Session tracking map
// Chat ID -> Session State
interface Session {
  chatId: string;
  step: "idle" | "await_login_user" | "await_login_pass" | "submit_date" | "submit_accounts" | "submit_mobile" | "submit_internet" | "submit_atm" | "submit_merchant" | "submit_confirm" | "search_custom_date" | "edit_accounts" | "edit_mobile" | "edit_internet" | "edit_atm" | "edit_merchant" | "edit_confirm" | "forgotten_date" | "forgotten_accounts" | "forgotten_mobile" | "forgotten_internet" | "forgotten_atm" | "forgotten_merchant" | "forgotten_confirm" | "register_firstname" | "register_lastname" | "register_username" | "register_mobile" | "verify_reporting_user" | "verify_reporting_pass" | "edit_select_products" | "edit_product_value";
  usernameAttempt?: string;
  tempReport?: {
    id?: number;
    date: string;
    customer_base: number;
    mobile_banking: number;
    internet_banking: number;
    atm: number;
    merchant: number;
  };
  regFirstname?: string;
  regLastname?: string;
  regUsername?: string;
  regMobile?: string;
  editSelectedProducts?: string[];
  editCurrentIndex?: number;
  verifiedForReporting?: boolean;
  verifyUsernameAttempt?: string;
  pendingAction?: "submit" | "edit" | "forgotten";
}

const sessions = new Map<string, Session>();

// Helper to format date nicely: 18 July 2026
function formatDateNicely(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

// Get week number from date
function getWeekNumber(dateStr: string): number {
  const d = new Date(dateStr);
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
}

// Helper to get day name of week
function getDayName(dateStr: string): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date(dateStr).getDay()];
}

// Send telegram message
async function sendTelegramMessage(token: string, chatId: string, text: string, replyMarkup?: any) {
  try {
    const body: any = {
      chat_id: chatId,
      text: text,
      parse_mode: "HTML"
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      console.error(`Telegram API sendMessage error: ${res.statusText}`, await res.text());
    }
  } catch (err) {
    console.error("Failed to send Telegram message:", err);
  }
}

// Answer callback query to resolve spinner
async function answerCallbackQuery(token: string, callbackQueryId: string, text?: string, showAlert = false) {
  try {
    const body: any = {
      callback_query_id: callbackQueryId
    };
    if (text) {
      body.text = text;
      body.show_alert = showAlert;
    }
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error("Failed to answer callback query:", err);
  }
}

// Edit existing telegram message text
async function editTelegramMessageText(token: string, chatId: string, messageId: number, text: string, replyMarkup?: any) {
  try {
    const body: any = {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: "HTML"
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }
    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error("Failed to edit telegram message text:", err);
  }
}

// Send document (CSV/text files)
async function sendTelegramDocument(token: string, chatId: string, filename: string, content: string, caption?: string) {
  try {
    const boundary = "----TelegramBotBoundary" + Math.random().toString(16);
    const payload = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="chat_id"\r\n\r\n` +
      `${chatId}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="document"; filename="${filename}"\r\n` +
      `Content-Type: text/csv\r\n\r\n` +
      `${content}\r\n` +
      `--${boundary}--` +
      `\r\n`;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`
      },
      body: payload
    });

    if (!res.ok) {
      console.error(`Telegram API sendDocument error: ${res.statusText}`, await res.text());
    }
  } catch (err) {
    console.error("Failed to send Telegram document:", err);
  }
}

// Helper to resolve the correct App URL
function getAppUrl(): string {
  return process.env.APP_URL || "https://ais-dev-tp42fi4trlyc7ipolwijlw-46967922848.europe-west2.run.app";
}

// Inline keyboard mapping to correct web app pages/actions
function getWebPortalInlineKeyboard() {
  const appUrl = getAppUrl();
  return {
    inline_keyboard: [
      [
        { text: "🏠 Web Home", url: `${appUrl}?view=home` },
        { text: "📊 Web Dashboard", url: `${appUrl}?view=dashboard` }
      ],
      [
        { text: "🔑 Web Login", url: `${appUrl}?view=login` },
        { text: "📝 Web Register Info", url: `${appUrl}?view=about` }
      ],
      [
        { text: "📈 Web Statistics", url: `${appUrl}?view=statistics` },
        { text: "🤖 Open Web App", web_app: { url: appUrl } }
      ]
    ]
  };
}

const PRODUCT_KEYS = [
  { key: "customer_base", label: "🏦 Accounts Opened" },
  { key: "mobile_banking", label: "📱 Mobile Banking" },
  { key: "internet_banking", label: "💻 Internet Banking" },
  { key: "atm", label: "💳 ATM Card Issued" },
  { key: "merchant", label: "🛒 Merchant Acquired" }
];

function getEditProductsInlineKeyboard(selectedKeys: string[] = []) {
  const keyboard = PRODUCT_KEYS.map(prod => {
    const isChecked = selectedKeys.includes(prod.key);
    const icon = isChecked ? "✅" : "⬜";
    return [
      {
        text: `${icon} ${prod.label}`,
        callback_data: `toggle_${prod.key}`
      }
    ];
  });

  keyboard.push([
    { text: "➡️ Continue to Edit", callback_data: "edit_continue" },
    { text: "❌ Cancel", callback_data: "edit_cancel" }
  ]);

  return { inline_keyboard: keyboard };
}

// Main Menu Keyboard
function getMainMenuKeyboard(isAdmin: boolean) {
  const keyboard = [
    [{ text: "📋 Submit Daily Report" }, { text: "✏️ Edit Last Report" }],
    [{ text: "🕒 Report Forgotten Date" }],
    [{ text: "📊 View Performance" }, { text: "📈 Statistics Dashboard" }],
    [{ text: "📅 Reports by Date" }, { text: "🏆 Top Performance" }],
    [{ text: "📄 Export Reports" }, { text: "👤 My Reports" }],
    [{ text: "🌐 Web Portal Shortcuts" }],
    [{ text: "⚙️ Settings" }, { text: "ℹ️ Help" }]
  ];
  if (isAdmin) {
    keyboard.push([{ text: "👨💼 Admin Menu" }]);
  }
  return {
    keyboard: keyboard,
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

// Submenu: View Performance Keyboard
function getPerformanceKeyboard() {
  return {
    keyboard: [
      [{ text: "📅 Today's Report" }, { text: "📆 Weekly Report" }],
      [{ text: "🗓 Monthly Report" }, { text: "📈 Yearly Report" }],
      [{ text: "📊 Overall Performance" }],
      [{ text: "🔙 Main Menu" }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

// Submenu: Reports by Date Keyboard
function getReportsByDateKeyboard() {
  return {
    keyboard: [
      [{ text: "Today" }, { text: "Yesterday" }],
      [{ text: "Last 7 Days" }, { text: "This Month" }],
      [{ text: "Last Month" }, { text: "Custom Date" }],
      [{ text: "🔙 Main Menu" }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

// Submenu: Export Keyboard
function getExportKeyboard() {
  return {
    keyboard: [
      [{ text: "📊 Download CSV" }],
      [{ text: "🔙 Main Menu" }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

// Submenu: Settings Keyboard
function getSettingsKeyboard() {
  return {
    keyboard: [
      [{ text: "Change Language" }, { text: "Notification ON/OFF" }],
      [{ text: "Unlink Telegram Account" }],
      [{ text: "🔙 Main Menu" }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

// Submenu: Admin Keyboard
function getAdminKeyboard() {
  return {
    keyboard: [
      [{ text: "👥 Manage Users" }, { text: "📈 View All Reports" }],
      [{ text: "📊 System Statistics" }, { text: "📄 Export Database" }],
      [{ text: "🔙 Main Menu" }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

// Process direct command or text message
async function handleTelegramMessage(token: string, chatId: string, text: string) {
  const trimmed = text.trim();
  let session = sessions.get(chatId);

  if (!session) {
    session = { chatId, step: "idle" };
    sessions.set(chatId, session);
  }

  // Check user authentication
  const user = getUserByTelegramId(chatId);

  // If not registered/logged in, process registration flow
  if (!user) {
    if (trimmed.startsWith("/login")) {
      const parts = trimmed.split(/\s+/);
      if (parts.length < 3) {
        await sendTelegramMessage(token, chatId, "⚠️ Usage: `/login <username> <password>`\nExample: `/login staff staff123` or `/login admin admin123`");
        return;
      }
      const username = parts[1];
      const password = parts[2];

      const dbUsers = getRawUsers();
      const foundUser = dbUsers.find(u => u.username.toLowerCase() === username.toLowerCase());

      if (foundUser) {
        const match = await bcrypt.compare(password, foundUser.password);
        if (match) {
          linkTelegramUser(foundUser.username, chatId);
          session.step = "idle";
          const first = foundUser.fullname.split(" ")[0];
          await sendTelegramMessage(token, chatId, `✅ <b>Login Successful!</b>\nWelcome back, <b>${first}</b> (${foundUser.role.toUpperCase()})!`, getMainMenuKeyboard(foundUser.role === "admin"));
        } else {
          await sendTelegramMessage(token, chatId, "❌ Invalid username or password. Please try again.");
        }
      } else {
        await sendTelegramMessage(token, chatId, "❌ User not found in the Bunna Bank employee database.");
      }
      return;
    }

    if (session.step === "register_firstname") {
      if (trimmed === "❌ Cancel" || trimmed === "/cancel") {
        session.step = "idle";
        await sendTelegramMessage(token, chatId, "❌ Registration cancelled. Send /start to register.");
        return;
      }
      session.regFirstname = trimmed;
      session.step = "register_lastname";
      await sendTelegramMessage(token, chatId, `👤 Thanks, <b>${trimmed}</b>! Now enter your <b>Last Name</b> (e.g. <code>Mulatu</code>):`, {
        keyboard: [[{ text: "❌ Cancel" }]],
        resize_keyboard: true,
        one_time_keyboard: true
      });
      return;
    }

    if (session.step === "register_lastname") {
      if (trimmed === "❌ Cancel" || trimmed === "/cancel") {
        session.step = "idle";
        await sendTelegramMessage(token, chatId, "❌ Registration cancelled. Send /start to register.");
        return;
      }
      session.regLastname = trimmed;
      session.step = "register_username";
      await sendTelegramMessage(token, chatId, "🔑 Great! Now enter your <b>User ID</b>:", {
        keyboard: [[{ text: "❌ Cancel" }]],
        resize_keyboard: true,
        one_time_keyboard: true
      });
      return;
    }

    if (session.step === "register_username") {
      if (trimmed === "❌ Cancel" || trimmed === "/cancel") {
        session.step = "idle";
        await sendTelegramMessage(token, chatId, "❌ Registration cancelled. Send /start to register.");
        return;
      }
      session.regUsername = trimmed;
      session.step = "register_mobile";
      await sendTelegramMessage(token, chatId, "📱 Almost done! Enter your <b>Mobile Number</b>:", {
        keyboard: [[{ text: "❌ Cancel" }]],
        resize_keyboard: true,
        one_time_keyboard: true
      });
      return;
    }

    if (session.step === "register_mobile") {
      if (trimmed === "❌ Cancel" || trimmed === "/cancel") {
        session.step = "idle";
        await sendTelegramMessage(token, chatId, "❌ Registration cancelled. Send /start to register.");
        return;
      }
      session.regMobile = trimmed;
      
      const firstname = session.regFirstname || "Staff";
      const lastname = session.regLastname || "Member";
      const fullname = `${firstname} ${lastname}`;
      const username = session.regUsername || "staff";
      const mobile = session.regMobile || "";
      const passwordHashed = await bcrypt.hash("Kassahun@Bunna", 10);

      const newUser = await registerTelegramUser(fullname, username, passwordHashed, chatId, mobile);
      
      session.step = "idle";

      await sendTelegramMessage(token, chatId, 
        `🎉 <b>Registration Successful!</b>\n\n` +
        `Welcome back, <b>${firstname}</b>. Use the keyboard buttons to navigate.`,
        getMainMenuKeyboard(newUser.role === "admin")
      );
      return;
    }

    // Default unauthenticated / first time prompt
    session.step = "register_firstname";
    await sendTelegramMessage(token, chatId, 
      `🏦 <b>Bunna Bank Hamusit Branch</b>\nDaily Performance Report System\n\n` +
      `👋 Welcome to our branch performance bot! It looks like you are opening the bot for the first time.\n\n` +
      `Please register your profile to begin.\n\n` +
      `👤 Enter your <b>First Name</b> (e.g. <code>Kassahun</code>):`,
      { remove_keyboard: true }
    );
    return;
  }

  // Handle Cancel / Go Back anytime
  if (trimmed === "🔙 Main Menu" || trimmed === "❌ Cancel" || trimmed === "/cancel") {
    session.step = "idle";
    await sendTelegramMessage(token, chatId, "🔙 Returned to Main Menu.", getMainMenuKeyboard(user.role === "admin"));
    return;
  }

  // Handle /start for authenticated user
  if (trimmed === "/start") {
    const firstname = user.fullname.split(" ")[0];
    await sendTelegramMessage(token, chatId, `🏦 <b>Bunna Bank Hamusit Branch</b>\nDaily Performance Report System\n\nWelcome back, <b>${firstname}</b>. Use the keyboard buttons to navigate.`, getMainMenuKeyboard(user.role === "admin"));
    return;
  }

  // Authorization verification steps for the 3 main tasks
  if (session.step === "verify_reporting_user") {
    if (trimmed === "❌ Cancel" || trimmed === "/cancel" || trimmed === "🔙 Main Menu") {
      session.step = "idle";
      await sendTelegramMessage(token, chatId, "❌ Authorization cancelled.", getMainMenuKeyboard(user.role === "admin"));
      return;
    }

    if (trimmed !== "4994") {
      session.step = "idle";
      await sendTelegramMessage(token, chatId, 
        `⚠️ <b>Warning: Unauthorized Access Attempt!</b>\n\n` +
        `The User ID you entered is incorrect. Submit daily report, edit last report, and report forgotten date functionalities are restricted. Please contact your administrator.`,
        getMainMenuKeyboard(user.role === "admin")
      );
      return;
    }

    session.verifyUsernameAttempt = trimmed;
    session.step = "verify_reporting_pass";
    await sendTelegramMessage(token, chatId, "🔒 Enter the reporting <b>Password</b>:", {
      keyboard: [[{ text: "❌ Cancel" }]],
      resize_keyboard: true,
      one_time_keyboard: true
    });
    return;
  }

  if (session.step === "verify_reporting_pass") {
    if (trimmed === "❌ Cancel" || trimmed === "/cancel" || trimmed === "🔙 Main Menu") {
      session.step = "idle";
      await sendTelegramMessage(token, chatId, "❌ Authorization cancelled.", getMainMenuKeyboard(user.role === "admin"));
      return;
    }

    if (trimmed !== "Kassahun@Bunna") {
      session.step = "idle";
      await sendTelegramMessage(token, chatId, 
        `⚠️ <b>Warning: Unauthorized Access Attempt!</b>\n\n` +
        `The password you entered is incorrect. Access to reporting and editing is denied. Please contact your supervisor.`,
        getMainMenuKeyboard(user.role === "admin")
      );
      return;
    }

    session.verifiedForReporting = true;
    await sendTelegramMessage(token, chatId, "✅ <b>Authorization Successful!</b>");

    // Immediately proceed to the pending action!
    if (session.pendingAction === "submit") {
      session.step = "submit_date";
      const todayStr = new Date().toISOString().split("T")[0];
      const todayPretty = formatDateNicely(todayStr);

      await sendTelegramMessage(token, chatId, 
        `📋 <b>Submit Daily Performance Report</b>\n\n` +
        `📅 Date: <b>${todayPretty}</b>\n\n` +
        `Enter today's figures or click button below to use today's date:`,
        {
          keyboard: [
            [{ text: `Use Today (${todayStr})` }],
            [{ text: "❌ Cancel" }]
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      );
    } else if (session.pendingAction === "edit") {
      const reports = getRawReports().filter(r => r.created_by === user.id);
      if (reports.length === 0) {
        session.step = "idle";
        await sendTelegramMessage(token, chatId, "❌ You have not submitted any report yet. Please submit a daily report first.", getMainMenuKeyboard(user.role === "admin"));
        return;
      }

      reports.sort((a, b) => b.id - a.id);
      const lastReport = reports[0];

      // Check 24 hour limit (unless admin)
      const createdAt = new Date(lastReport.created_at).getTime();
      const now = Date.now();
      const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);

      if (hoursElapsed > 24 && user.role !== "admin") {
        session.step = "idle";
        const formattedCreated = new Date(lastReport.created_at).toLocaleString();
        await sendTelegramMessage(token, chatId, 
          `❌ <b>Editing Disabled</b>\n\n` +
          `Your last report was submitted on <b>${formatDateNicely(lastReport.date)}</b> (registered at ${formattedCreated}), which is more than 24 hours ago.\n\n` +
          `Editing is only permitted within 24 hours of submission.`, 
          getMainMenuKeyboard(false)
        );
        return;
      }

      session.tempReport = {
        id: lastReport.id,
        date: lastReport.date,
        customer_base: lastReport.customer_base,
        mobile_banking: lastReport.mobile_banking,
        internet_banking: lastReport.internet_banking,
        atm: lastReport.atm,
        merchant: lastReport.merchant
      };
      session.editSelectedProducts = [];
      session.step = "edit_select_products";

      const msg = `✏️ <b>Edit Last Daily Report</b>\n` +
        `📅 Date: <b>${formatDateNicely(lastReport.date)}</b>\n\n` +
        `Current Figures:\n` +
        `🏦 Accounts Opened: <b>${lastReport.customer_base}</b>\n` +
        `📱 Mobile Banking: <b>${lastReport.mobile_banking}</b>\n` +
        `💻 Internet Banking: <b>${lastReport.internet_banking}</b>\n` +
        `💳 ATM issued: <b>${lastReport.atm}</b>\n` +
        `🛒 Merchant acquired: <b>${lastReport.merchant}</b>\n\n` +
        `Please select/check the products you want to edit. Other products will remain unchanged:\n\n` +
        `Select your preferences below:`;

      await sendTelegramMessage(token, chatId, msg, getEditProductsInlineKeyboard(session.editSelectedProducts));
    } else if (session.pendingAction === "forgotten") {
      session.step = "forgotten_date";
      await sendTelegramMessage(token, chatId,
        `🕒 <b>Report Forgotten / Unreported Inputs</b>\n\n` +
        `Please enter the forgotten or unreported date in <b>YYYY-MM-DD</b> format (e.g., <code>2026-07-15</code>):`,
        {
          keyboard: [[{ text: "❌ Cancel" }]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      );
    }
    return;
  }

  // Conversational Report Submit Flow State Machine
  if (session.step === "submit_date") {
    let dateStr = trimmed;
    if (trimmed === "Today" || trimmed.includes("Use Today")) {
      dateStr = new Date().toISOString().split("T")[0];
    }
    // Simple format validate
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      await sendTelegramMessage(token, chatId, "❌ Invalid date format. Please send a valid date like <code>YYYY-MM-DD</code> (e.g. <code>2026-07-18</code>):");
      return;
    }
    session.tempReport = {
      date: dateStr,
      customer_base: 0,
      mobile_banking: 0,
      internet_banking: 0,
      atm: 0,
      merchant: 0
    };
    session.step = "submit_accounts";
    await sendTelegramMessage(token, chatId, "🏦 Enter <b>Accounts Opened</b> today:");
    return;
  }

  if (session.step === "edit_product_value") {
    const products = session.editSelectedProducts || [];
    const index = session.editCurrentIndex || 0;
    const currentKey = products[index];

    if (!currentKey) {
      session.step = "idle";
      await sendTelegramMessage(token, chatId, "❌ Error in editing flow. Cancelled.", getMainMenuKeyboard(user.role === "admin"));
      return;
    }

    const val = parseInt(trimmed, 10);
    if (isNaN(val) || val < 0) {
      const prodObj = PRODUCT_KEYS.find(p => p.key === currentKey);
      const label = prodObj ? prodObj.label : currentKey;
      await sendTelegramMessage(token, chatId, `❌ Please enter a valid positive number for ${label}:`);
      return;
    }

    // Save the new value
    if (session.tempReport) {
      (session.tempReport as any)[currentKey] = val;
    }

    // Move to next product
    const nextIndex = index + 1;
    if (nextIndex < products.length) {
      session.editCurrentIndex = nextIndex;
      const nextKey = products[nextIndex];
      const prodObj = PRODUCT_KEYS.find(p => p.key === nextKey);
      const label = prodObj ? prodObj.label : nextKey;
      const curVal = session.tempReport ? (session.tempReport as any)[nextKey] : 0;
      await sendTelegramMessage(token, chatId, `✏️ ${label}\n\nEnter new value for <b>${prodObj?.label || nextKey}</b> (Current: ${curVal}):`, {
        keyboard: [[{ text: "❌ Cancel" }]],
        resize_keyboard: true,
        one_time_keyboard: true
      });
    } else {
      // Done with all edited products! Let's show confirmation screen
      session.step = "edit_confirm";
      const tr = session.tempReport!;
      const msg = `💾 <b>Confirm Updated Report Details</b>\n\n` +
        `📅 Date: <b>${formatDateNicely(tr.date)}</b>\n\n` +
        `🏦 Accounts Opened: <b>${tr.customer_base}</b>\n` +
        `📱 Mobile Banking: <b>${tr.mobile_banking}</b>\n` +
        `💻 Internet Banking: <b>${tr.internet_banking}</b>\n` +
        `💳 ATM Card Issued: <b>${tr.atm}</b>\n` +
        `🛒 Merchant Acquired: <b>${tr.merchant}</b>\n\n` +
        `Please select <b>💾 Confirm Edit</b> or <b>❌ Cancel</b> below:`;

      await sendTelegramMessage(token, chatId, msg, {
        keyboard: [
          [{ text: "💾 Confirm Edit" }],
          [{ text: "❌ Cancel" }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      });
    }
    return;
  }

  if (session.step === "edit_confirm") {
    if (trimmed === "💾 Confirm Edit" || trimmed.toLowerCase() === "confirm") {
      const tr = session.tempReport;
      if (tr && tr.id) {
        updateRawReport(tr.id, {
          customer_base: tr.customer_base,
          mobile_banking: tr.mobile_banking,
          internet_banking: tr.internet_banking,
          atm: tr.atm,
          merchant: tr.merchant,
          created_by: user.id
        });

        const total = tr.customer_base + tr.mobile_banking + tr.internet_banking + tr.atm + tr.merchant;

        await sendTelegramMessage(token, chatId, 
          `✅ <b>Report Edited and Updated Successfully</b>\n\n` +
          `<b>Updated Figures</b>\n\n` +
          `🏦 Accounts : <b>${tr.customer_base}</b>\n` +
          `📱 Mobile Banking : <b>${tr.mobile_banking}</b>\n` +
          `💻 Internet Banking : <b>${tr.internet_banking}</b>\n` +
          `💳 ATM : <b>${tr.atm}</b>\n` +
          `🛒 Merchant : <b>${tr.merchant}</b>\n\n` +
          `Grand Total Activated: <b>${total}</b>`,
          getMainMenuKeyboard(user.role === "admin")
        );
      }
      session.step = "idle";
    } else {
      session.step = "idle";
      await sendTelegramMessage(token, chatId, "❌ Report edit cancelled.", getMainMenuKeyboard(user.role === "admin"));
    }
    return;
  }

  if (session.step === "forgotten_date") {
    const dateStr = trimmed;
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      await sendTelegramMessage(token, chatId, "❌ Invalid date format. Please send a valid date like <code>YYYY-MM-DD</code> (e.g. <code>2026-07-15</code>):");
      return;
    }
    session.tempReport = {
      date: dateStr,
      customer_base: 0,
      mobile_banking: 0,
      internet_banking: 0,
      atm: 0,
      merchant: 0
    };
    session.step = "forgotten_accounts";
    await sendTelegramMessage(token, chatId, `🏦 Enter <b>Accounts Opened</b> for <b>${formatDateNicely(dateStr)}</b>:`, {
      keyboard: [[{ text: "❌ Cancel" }]],
      resize_keyboard: true,
      one_time_keyboard: true
    });
    return;
  }

  if (session.step === "forgotten_accounts") {
    const val = parseInt(trimmed, 10);
    if (isNaN(val) || val < 0) {
      await sendTelegramMessage(token, chatId, "❌ Please enter a valid positive number for Accounts Opened:");
      return;
    }
    if (session.tempReport) session.tempReport.customer_base = val;
    session.step = "forgotten_mobile";
    await sendTelegramMessage(token, chatId, `📱 Enter <b>Mobile Banking</b> registrations for <b>${formatDateNicely(session.tempReport!.date)}</b>:`, {
      keyboard: [[{ text: "❌ Cancel" }]],
      resize_keyboard: true,
      one_time_keyboard: true
    });
    return;
  }

  if (session.step === "forgotten_mobile") {
    const val = parseInt(trimmed, 10);
    if (isNaN(val) || val < 0) {
      await sendTelegramMessage(token, chatId, "❌ Please enter a valid positive number for Mobile Banking:");
      return;
    }
    if (session.tempReport) session.tempReport.mobile_banking = val;
    session.step = "forgotten_internet";
    await sendTelegramMessage(token, chatId, `💻 Enter <b>Internet Banking</b> registrations for <b>${formatDateNicely(session.tempReport!.date)}</b>:`, {
      keyboard: [[{ text: "❌ Cancel" }]],
      resize_keyboard: true,
      one_time_keyboard: true
    });
    return;
  }

  if (session.step === "forgotten_internet") {
    const val = parseInt(trimmed, 10);
    if (isNaN(val) || val < 0) {
      await sendTelegramMessage(token, chatId, "❌ Please enter a valid positive number for Internet Banking:");
      return;
    }
    if (session.tempReport) session.tempReport.internet_banking = val;
    session.step = "forgotten_atm";
    await sendTelegramMessage(token, chatId, `💳 Enter <b>ATM</b> card issuances for <b>${formatDateNicely(session.tempReport!.date)}</b>:`, {
      keyboard: [[{ text: "❌ Cancel" }]],
      resize_keyboard: true,
      one_time_keyboard: true
    });
    return;
  }

  if (session.step === "forgotten_atm") {
    const val = parseInt(trimmed, 10);
    if (isNaN(val) || val < 0) {
      await sendTelegramMessage(token, chatId, "❌ Please enter a valid positive number for ATM:");
      return;
    }
    if (session.tempReport) session.tempReport.atm = val;
    session.step = "forgotten_merchant";
    await sendTelegramMessage(token, chatId, `🛒 Enter <b>Merchant</b> registrations for <b>${formatDateNicely(session.tempReport!.date)}</b>:`, {
      keyboard: [[{ text: "❌ Cancel" }]],
      resize_keyboard: true,
      one_time_keyboard: true
    });
    return;
  }

  if (session.step === "forgotten_merchant") {
    const val = parseInt(trimmed, 10);
    if (isNaN(val) || val < 0) {
      await sendTelegramMessage(token, chatId, "❌ Please enter a valid positive number for Merchant:");
      return;
    }
    if (session.tempReport) session.tempReport.merchant = val;
    session.step = "forgotten_confirm";

    const tr = session.tempReport!;
    const msg = `💾 <b>Confirm Forgotten Report Details</b>\n\n` +
      `📅 Target Date: <b>${formatDateNicely(tr.date)}</b>\n\n` +
      `🏦 Accounts Opened: <b>${tr.customer_base}</b>\n` +
      `📱 Mobile Banking: <b>${tr.mobile_banking}</b>\n` +
      `💻 Internet Banking: <b>${tr.internet_banking}</b>\n` +
      `💳 ATM Card Issued: <b>${tr.atm}</b>\n` +
      `🛒 Merchant Acquired: <b>${tr.merchant}</b>\n\n` +
      `Please select <b>💾 Confirm Submission</b> or <b>❌ Cancel</b> below:`;

    await sendTelegramMessage(token, chatId, msg, {
      keyboard: [
        [{ text: "💾 Confirm Submission" }],
        [{ text: "❌ Cancel" }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    });
    return;
  }

  if (session.step === "forgotten_confirm") {
    if (trimmed === "💾 Confirm Submission" || trimmed.toLowerCase() === "confirm") {
      const tr = session.tempReport;
      if (tr) {
        // Delete existing report if duplicate date
        const reports = getRawReports();
        const existing = reports.find(r => r.date === tr.date);
        if (existing) {
          deleteRawReport(existing.id);
        }

        // Insert new report
        insertRawReport({
          date: tr.date,
          year: new Date(tr.date).getFullYear(),
          month: new Date(tr.date).getMonth() + 1,
          week: getWeekNumber(tr.date),
          day: getDayName(tr.date),
          customer_base: tr.customer_base,
          mobile_banking: tr.mobile_banking,
          internet_banking: tr.internet_banking,
          atm: tr.atm,
          merchant: tr.merchant,
          created_by: user.id
        });

        const total = tr.customer_base + tr.mobile_banking + tr.internet_banking + tr.atm + tr.merchant;

        await sendTelegramMessage(token, chatId, 
          `✅ <b>Forgotten Report Submitted Successfully</b>\n\n` +
          `<b>Figures Recorded for ${formatDateNicely(tr.date)}:</b>\n\n` +
          `🏦 Accounts : <b>${tr.customer_base}</b>\n` +
          `📱 Mobile Banking : <b>${tr.mobile_banking}</b>\n` +
          `💻 Internet Banking : <b>${tr.internet_banking}</b>\n` +
          `💳 ATM : <b>${tr.atm}</b>\n` +
          `🛒 Merchant : <b>${tr.merchant}</b>\n\n` +
          `Grand Total Activated: <b>${total}</b>`,
          getMainMenuKeyboard(user.role === "admin")
        );
      }
      session.step = "idle";
    } else {
      session.step = "idle";
      await sendTelegramMessage(token, chatId, "❌ Forgotten report submission cancelled.", getMainMenuKeyboard(user.role === "admin"));
    }
    return;
  }

  if (session.step === "submit_accounts") {
    const val = parseInt(trimmed, 10);
    if (isNaN(val) || val < 0) {
      await sendTelegramMessage(token, chatId, "❌ Please enter a valid positive number for Accounts Opened:");
      return;
    }
    if (session.tempReport) session.tempReport.customer_base = val;
    session.step = "submit_mobile";
    await sendTelegramMessage(token, chatId, "📱 Enter <b>Mobile Banking</b> registrations today:");
    return;
  }

  if (session.step === "submit_mobile") {
    const val = parseInt(trimmed, 10);
    if (isNaN(val) || val < 0) {
      await sendTelegramMessage(token, chatId, "❌ Please enter a valid positive number for Mobile Banking:");
      return;
    }
    if (session.tempReport) session.tempReport.mobile_banking = val;
    session.step = "submit_internet";
    await sendTelegramMessage(token, chatId, "💻 Enter <b>Internet Banking</b> registrations today:");
    return;
  }

  if (session.step === "submit_internet") {
    const val = parseInt(trimmed, 10);
    if (isNaN(val) || val < 0) {
      await sendTelegramMessage(token, chatId, "❌ Please enter a valid positive number for Internet Banking:");
      return;
    }
    if (session.tempReport) session.tempReport.internet_banking = val;
    session.step = "submit_atm";
    await sendTelegramMessage(token, chatId, "💳 Enter <b>ATM</b> card issuances today:");
    return;
  }

  if (session.step === "submit_atm") {
    const val = parseInt(trimmed, 10);
    if (isNaN(val) || val < 0) {
      await sendTelegramMessage(token, chatId, "❌ Please enter a valid positive number for ATM:");
      return;
    }
    if (session.tempReport) session.tempReport.atm = val;
    session.step = "submit_merchant";
    await sendTelegramMessage(token, chatId, "🛒 Enter <b>Merchant</b> registrations today:");
    return;
  }

  if (session.step === "submit_merchant") {
    const val = parseInt(trimmed, 10);
    if (isNaN(val) || val < 0) {
      await sendTelegramMessage(token, chatId, "❌ Please enter a valid positive number for Merchant:");
      return;
    }
    if (session.tempReport) {
      session.tempReport.merchant = val;
    }
    session.step = "submit_confirm";

    const tr = session.tempReport!;
    const msg = `💾 <b>Confirm Report Details</b>\n\n` +
      `📅 Date: <b>${formatDateNicely(tr.date)}</b>\n\n` +
      `🏦 Accounts Opened: <b>${tr.customer_base}</b>\n` +
      `📱 Mobile Banking: <b>${tr.mobile_banking}</b>\n` +
      `💻 Internet Banking: <b>${tr.internet_banking}</b>\n` +
      `💳 ATM Card Issued: <b>${tr.atm}</b>\n` +
      `🛒 Merchant Acquired: <b>${tr.merchant}</b>\n\n` +
      `Please select <b>💾 Submit Report</b> or <b>❌ Cancel</b> below:`;

    await sendTelegramMessage(token, chatId, msg, {
      keyboard: [
        [{ text: "💾 Submit Report" }],
        [{ text: "❌ Cancel" }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    });
    return;
  }

  if (session.step === "submit_confirm") {
    if (trimmed === "💾 Submit Report" || trimmed.toLowerCase() === "submit") {
      const tr = session.tempReport;
      if (tr) {
        // Delete existing report if duplicate date
        const reports = getRawReports();
        const existing = reports.find(r => r.date === tr.date);
        if (existing) {
          deleteRawReport(existing.id);
        }

        // Insert new report
        insertRawReport({
          date: tr.date,
          year: new Date(tr.date).getFullYear(),
          month: new Date(tr.date).getMonth() + 1,
          week: getWeekNumber(tr.date),
          day: getDayName(tr.date),
          customer_base: tr.customer_base,
          mobile_banking: tr.mobile_banking,
          internet_banking: tr.internet_banking,
          atm: tr.atm,
          merchant: tr.merchant,
          created_by: user.id
        });

        const total = tr.customer_base + tr.mobile_banking + tr.internet_banking + tr.atm + tr.merchant;

        await sendTelegramMessage(token, chatId, 
          `✅ <b>Report Submitted Successfully</b>\n\n` +
          `<b>Today's Total</b>\n\n` +
          `🏦 Accounts : <b>${tr.customer_base}</b>\n` +
          `📱 Mobile Banking : <b>${tr.mobile_banking}</b>\n` +
          `💻 Internet Banking : <b>${tr.internet_banking}</b>\n` +
          `💳 ATM : <b>${tr.atm}</b>\n` +
          `🛒 Merchant : <b>${tr.merchant}</b>\n\n` +
          `Grand Total Activated: <b>${total}</b>`,
          getMainMenuKeyboard(user.role === "admin")
        );
      }
      session.step = "idle";
    } else {
      session.step = "idle";
      await sendTelegramMessage(token, chatId, "❌ Report submission cancelled.", getMainMenuKeyboard(user.role === "admin"));
    }
    return;
  }

  // Custom date search state
  if (session.step === "search_custom_date") {
    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) {
      await sendTelegramMessage(token, chatId, "❌ Invalid date. Please send a date in <code>YYYY-MM-DD</code> format:");
      return;
    }
    const reports = getRawReports();
    const rep = reports.find(r => r.date === trimmed);
    session.step = "idle";

    if (rep) {
      const tot = rep.customer_base + rep.mobile_banking + rep.internet_banking + rep.atm + rep.merchant;
      await sendTelegramMessage(token, chatId,
        `📅 <b>Report for ${formatDateNicely(trimmed)}</b>\n\n` +
        `🏦 Accounts Opened : <b>${rep.customer_base}</b>\n` +
        `📱 Mobile Banking : <b>${rep.mobile_banking}</b>\n` +
        `💻 Internet Banking : <b>${rep.internet_banking}</b>\n` +
        `💳 ATM : <b>${rep.atm}</b>\n` +
        `🛒 Merchant : <b>${rep.merchant}</b>\n\n` +
        `<b>Total Products Activated: ${tot}</b>`,
        getReportsByDateKeyboard()
      );
    } else {
      await sendTelegramMessage(token, chatId, `ℹ️ No report was submitted for <b>${formatDateNicely(trimmed)}</b>.`, getReportsByDateKeyboard());
    }
    return;
  }

  // MAIN MENU ACTIONS
  if (trimmed === "🕒 Report Forgotten Date" || trimmed === "/forgotten" || trimmed === "/forgot" || trimmed === "📋 Submit Daily Report" || trimmed === "✏️ Edit Last Report") {
    if (!session.verifiedForReporting) {
      let pending: "submit" | "edit" | "forgotten" = "submit";
      if (trimmed === "✏️ Edit Last Report") pending = "edit";
      if (trimmed === "🕒 Report Forgotten Date" || trimmed === "/forgotten" || trimmed === "/forgot") pending = "forgotten";
      
      session.pendingAction = pending;
      session.step = "verify_reporting_user";
      await sendTelegramMessage(token, chatId, 
        `🔒 <b>Authorization Required</b>\n\n` +
        `To perform this action, please authenticate with the authorized reporting credentials.\n\n` +
        `👤 Please enter your <b>User ID</b>:`,
        {
          keyboard: [[{ text: "❌ Cancel" }]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      );
      return;
    }
  }

  if (trimmed === "🕒 Report Forgotten Date" || trimmed === "/forgotten" || trimmed === "/forgot") {
    session.step = "forgotten_date";
    await sendTelegramMessage(token, chatId,
      `🕒 <b>Report Forgotten / Unreported Inputs</b>\n\n` +
      `Please enter the forgotten or unreported date in <b>YYYY-MM-DD</b> format (e.g., <code>2026-07-15</code>):`,
      {
        keyboard: [[{ text: "❌ Cancel" }]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    );
    return;
  }

  if (trimmed === "📋 Submit Daily Report") {
    session.step = "submit_date";
    const todayStr = new Date().toISOString().split("T")[0];
    const todayPretty = formatDateNicely(todayStr);

    await sendTelegramMessage(token, chatId, 
      `📋 <b>Submit Daily Performance Report</b>\n\n` +
      `📅 Date: <b>${todayPretty}</b>\n\n` +
      `Enter today's figures or click button below to use today's date:`,
      {
        keyboard: [
          [{ text: `Use Today (${todayStr})` }],
          [{ text: "❌ Cancel" }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    );
    return;
  }

  if (trimmed === "✏️ Edit Last Report") {
    const reports = getRawReports().filter(r => r.created_by === user.id);
    if (reports.length === 0) {
      await sendTelegramMessage(token, chatId, "❌ You have not submitted any report yet. Please submit a daily report first.", getMainMenuKeyboard(user.role === "admin"));
      return;
    }

    // Sort by id descending
    reports.sort((a, b) => b.id - a.id);
    const lastReport = reports[0];

    // Check if within 24 hours of input
    const createdAt = new Date(lastReport.created_at).getTime();
    const now = Date.now();
    const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);

    if (hoursElapsed > 24) {
      const formattedCreated = new Date(lastReport.created_at).toLocaleString();
      await sendTelegramMessage(token, chatId, 
        `❌ <b>Editing Disabled</b>\n\n` +
        `Your last report was submitted on <b>${formatDateNicely(lastReport.date)}</b> (registered at ${formattedCreated}), which is more than 24 hours ago.\n\n` +
        `Editing is only permitted within 24 hours of submission.`, 
        getMainMenuKeyboard(user.role === "admin")
      );
      return;
    }

    // Initialize Edit Session
    session.tempReport = {
      id: lastReport.id,
      date: lastReport.date,
      customer_base: lastReport.customer_base,
      mobile_banking: lastReport.mobile_banking,
      internet_banking: lastReport.internet_banking,
      atm: lastReport.atm,
      merchant: lastReport.merchant
    };
    session.editSelectedProducts = [];
    session.step = "edit_select_products";

    const msg = `✏️ <b>Edit Last Daily Report</b>\n` +
      `📅 Date: <b>${formatDateNicely(lastReport.date)}</b>\n\n` +
      `Current Figures:\n` +
      `🏦 Accounts Opened: <b>${lastReport.customer_base}</b>\n` +
      `📱 Mobile Banking: <b>${lastReport.mobile_banking}</b>\n` +
      `💻 Internet Banking: <b>${lastReport.internet_banking}</b>\n` +
      `💳 ATM issued: <b>${lastReport.atm}</b>\n` +
      `🛒 Merchant acquired: <b>${lastReport.merchant}</b>\n\n` +
      `Please select/check the products you want to edit. Other products will remain unchanged:\n\n` +
      `Select your preferences below:`;

    await sendTelegramMessage(token, chatId, msg, getEditProductsInlineKeyboard(session.editSelectedProducts));
    return;
  }

  if (trimmed === "📊 View Performance") {
    await sendTelegramMessage(token, chatId, "📊 Select the performance period to aggregate:", getPerformanceKeyboard());
    return;
  }

  if (trimmed === "📈 Statistics Dashboard") {
    const reports = getRawReports();
    const todayStr = new Date().toISOString().split("T")[0];
    const curYear = new Date().getFullYear();
    const curMonth = new Date().getMonth() + 1;
    const curWeek = getWeekNumber(todayStr);

    const filterReports = (filterFn: (r: any) => boolean) => reports.filter(filterFn);

    const sumField = (list: any[], field: string) => list.reduce((a, b) => a + (b[field] || 0), 0);

    const todayR = filterReports(r => r.date === todayStr);
    const weekR = filterReports(r => r.year === curYear && r.week === curWeek);
    const monthR = filterReports(r => r.year === curYear && r.month === curMonth);
    const yearR = filterReports(r => r.year === curYear);

    const getStatsMsg = (field: string, title: string, icon: string) => {
      return `${icon} <b>${title}</b>\n` +
        `Today : <b>${sumField(todayR, field)}</b>\n` +
        `Week : <b>${sumField(weekR, field)}</b>\n` +
        `Month : <b>${sumField(monthR, field)}</b>\n` +
        `Year : <b>${sumField(yearR, field)}</b>`;
    };

    const dashboardMsg = `📊 <b>Performance Dashboard</b>\n\n` +
      `${getStatsMsg("customer_base", "Accounts Opened", "🏦")}\n\n` +
      `──────────────\n\n` +
      `${getStatsMsg("mobile_banking", "Mobile Banking", "📱")}\n\n` +
      `──────────────\n\n` +
      `${getStatsMsg("internet_banking", "Internet Banking", "💻")}\n\n` +
      `──────────────\n\n` +
      `${getStatsMsg("atm", "ATM Card Issued", "💳")}\n\n` +
      `──────────────\n\n` +
      `${getStatsMsg("merchant", "Merchant Acquired", "🛒")}`;

    await sendTelegramMessage(token, chatId, dashboardMsg);
    return;
  }

  if (trimmed === "📅 Reports by Date") {
    await sendTelegramMessage(token, chatId, "📅 Select pre-set filter or Custom Date to view reports:", getReportsByDateKeyboard());
    return;
  }

  if (trimmed === "🏆 Top Performance") {
    const reports = getRawReports();
    if (reports.length === 0) {
      await sendTelegramMessage(token, chatId, "🏆 No performance records submitted yet.");
      return;
    }
    // Find best day
    let bestDay = reports[0];
    let bestTotal = 0;
    reports.forEach(r => {
      const tot = r.customer_base + r.mobile_banking + r.internet_banking + r.atm + r.merchant;
      const bestTot = bestDay.customer_base + bestDay.mobile_banking + bestDay.internet_banking + bestDay.atm + bestDay.merchant;
      if (tot > bestTot) {
        bestDay = r;
        bestTotal = tot;
      } else if (tot === bestTot && !bestTotal) {
        bestTotal = tot;
      }
    });

    if (!bestTotal) {
      bestTotal = bestDay.customer_base + bestDay.mobile_banking + bestDay.internet_banking + bestDay.atm + bestDay.merchant;
    }

    const msg = `🏆 <b>Best Day</b>\n\n` +
      `Date: <b>${formatDateNicely(bestDay.date)}</b>\n` +
      `Total Products: <b>${bestTotal}</b>\n\n` +
      `🏦 Accounts Opened: <b>${bestDay.customer_base}</b>\n` +
      `📱 Mobile Banking: <b>${bestDay.mobile_banking}</b>\n` +
      `💻 Internet Banking: <b>${bestDay.internet_banking}</b>\n` +
      `💳 ATM: <b>${bestDay.atm}</b>\n` +
      `🛒 Merchant: <b>${bestDay.merchant}</b>`;

    await sendTelegramMessage(token, chatId, msg);
    return;
  }

  if (trimmed === "📄 Export Reports") {
    await sendTelegramMessage(token, chatId, "📄 Choose your action to export campaign metrics:", getExportKeyboard());
    return;
  }

  if (trimmed === "📊 Download CSV") {
    const reports = getRawReports();
    if (reports.length === 0) {
      await sendTelegramMessage(token, chatId, "⚠️ No data available to export.");
      return;
    }
    let csv = "ID,Date,Day,Accounts,Mobile,Internet,ATM,Merchant,Total\n";
    reports.forEach(r => {
      const total = r.customer_base + r.mobile_banking + r.internet_banking + r.atm + r.merchant;
      csv += `${r.id},${r.date},${r.day},${r.customer_base},${r.mobile_banking},${r.internet_banking},${r.atm},${r.merchant},${total}\n`;
    });
    await sendTelegramDocument(token, chatId, "bunna_bank_campaign_report.csv", csv, "Here is the full branch performance dataset in CSV format.");
    return;
  }

  if (trimmed === "👤 My Reports") {
    const reports = getRawReports().filter(r => r.created_by === user.id);
    const totalCount = reports.length;
    const lastSub = reports.length > 0 ? formatDateNicely(reports[0].date) : "None";

    const msg = `👤 <b>My Reports Profile</b>\n\n` +
      `User: <b>${user.fullname} (${user.role.toUpperCase()})</b>\n` +
      `Total Reports Submitted: <b>${totalCount}</b>\n` +
      `Last Submission: <b>${lastSub}</b>\n\n` +
      `To edit today's report, use the online Web portal at:\n<code>${process.env.APP_URL || "https://ai.studio/build"}</code>`;

    await sendTelegramMessage(token, chatId, msg);
    return;
  }

  if (trimmed === "⚙️ Settings") {
    await sendTelegramMessage(token, chatId, "⚙️ Settings configuration panels:", getSettingsKeyboard());
    return;
  }

  if (trimmed === "🌐 Web Portal Shortcuts" || trimmed === "/web" || trimmed === "/menu") {
    const appUrl = getAppUrl();
    const msg = `🌐 <b>BB Hamusit Branch Web Portal Shortcuts</b>\n\n` +
      `Access our interactive features and beautiful charts directly:\n\n` +
      `• <b>Home</b>: Landing page and high-level campaign overviews.\n` +
      `• <b>Dashboard</b>: View real-time activation tables and product metrics.\n` +
      `• <b>Login</b>: Sign in securely with your operator credentials.\n` +
      `• <b>Register Info</b>: Guidelines on employee credentials creation.\n` +
      `• <b>Statistics</b>: Detailed product growth charts and performance graphs.\n\n` +
      `Select a view below to open in your browser, or launch the interactive <b>Web App directly inside Telegram</b>:`;
      
    await sendTelegramMessage(token, chatId, msg, getWebPortalInlineKeyboard());
    return;
  }

  if (trimmed === "Unlink Telegram Account") {
    unlinkTelegramUser(chatId);
    session.step = "idle";
    await sendTelegramMessage(token, chatId, "✅ <b>Account Unlinked successfully!</b>\nYour Telegram profile has been signed out from the branch reporting system.", { remove_keyboard: true });
    return;
  }

  if (trimmed === "Change Language" || trimmed === "Notification ON/OFF") {
    await sendTelegramMessage(token, chatId, "ℹ️ Feature available in the upcoming software update.");
    return;
  }

  if (trimmed === "ℹ️ Help") {
    const helpMsg = `🏦 <b>Bunna Bank Hamusit Bot Help</b>\n\n` +
      `This bot streamlines daily performance uploads for the campaign.\n\n` +
      `💡 <b>Available Commands:</b>\n` +
      `• /start - Reload the bot and check login\n` +
      `• /login <code>[username] [password]</code> - Authenticate\n` +
      `• /forgotten - Report custom forgotten/unreported date\n` +
      `• /web - Open Web Portal links/WebApp shortcuts\n` +
      `• /cancel - Reset ongoing submission flows\n\n` +
      `👤 <b>Web Portal Link:</b>\n` +
      `You can view beautiful responsive charts, analytics tables, and download official Excel/PDF reports on the Web Portal at:\n` +
      `<code>${getAppUrl()}</code>`;
    await sendTelegramMessage(token, chatId, helpMsg);
    return;
  }

  // VIEW PERFORMANCE CHOICES
  if (trimmed === "📅 Today's Report") {
    const reports = getRawReports();
    const todayStr = new Date().toISOString().split("T")[0];
    const rep = reports.find(r => r.date === todayStr);

    if (rep) {
      const tot = rep.customer_base + rep.mobile_banking + rep.internet_banking + rep.atm + rep.merchant;
      await sendTelegramMessage(token, chatId,
        `📅 <b>Today's Report</b>\n` +
        `📅 <b>${formatDateNicely(todayStr)}</b>\n\n` +
        `🏦 Accounts Opened : <b>${rep.customer_base}</b>\n` +
        `📱 Mobile Banking : <b>${rep.mobile_banking}</b>\n` +
        `💻 Internet Banking : <b>${rep.internet_banking}</b>\n` +
        `💳 ATM : <b>${rep.atm}</b>\n` +
        `🛒 Merchant : <b>${rep.merchant}</b>\n\n` +
        `<b>Total Products Activated : ${tot}</b>`
      );
    } else {
      await sendTelegramMessage(token, chatId, `ℹ️ No report has been uploaded for today (<b>${formatDateNicely(todayStr)}</b>) yet.`);
    }
    return;
  }

  if (trimmed === "📆 Weekly Report") {
    const reports = getRawReports();
    const todayStr = new Date().toISOString().split("T")[0];
    const curYear = new Date().getFullYear();
    const curWeek = getWeekNumber(todayStr);

    const weekReports = reports.filter(r => r.year === curYear && r.week === curWeek);

    const sum = (field: string) => weekReports.reduce((a, b) => a + (b[field] || 0), 0);

    const total = sum("customer_base") + sum("mobile_banking") + sum("internet_banking") + sum("atm") + sum("merchant");

    await sendTelegramMessage(token, chatId,
      `📆 <b>Weekly Report</b>\n` +
      `<b>Week ${curWeek}</b>\n\n` +
      `🏦 Accounts Opened : <b>${sum("customer_base")}</b>\n` +
      `📱 Mobile Banking : <b>${sum("mobile_banking")}</b>\n` +
      `💻 Internet Banking : <b>${sum("internet_banking")}</b>\n` +
      `💳 ATM : <b>${sum("atm")}</b>\n` +
      `🛒 Merchant : <b>${sum("merchant")}</b>\n\n` +
      `<b>Grand Total : ${total}</b>`
    );
    return;
  }

  if (trimmed === "🗓 Monthly Report") {
    const reports = getRawReports();
    const d = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const curYear = d.getFullYear();
    const curMonth = d.getMonth() + 1;

    const monthReports = reports.filter(r => r.year === curYear && r.month === curMonth);
    const sum = (field: string) => monthReports.reduce((a, b) => a + (b[field] || 0), 0);
    const total = sum("customer_base") + sum("mobile_banking") + sum("internet_banking") + sum("atm") + sum("merchant");

    await sendTelegramMessage(token, chatId,
      `🗓 <b>Monthly Report</b>\n` +
      `<b>${months[curMonth - 1]} ${curYear}</b>\n\n` +
      `🏦 Accounts Opened : <b>${sum("customer_base")}</b>\n` +
      `📱 Mobile Banking : <b>${sum("mobile_banking")}</b>\n` +
      `💻 Internet Banking : <b>${sum("internet_banking")}</b>\n` +
      `💳 ATM : <b>${sum("atm")}</b>\n` +
      `🛒 Merchant : <b>${sum("merchant")}</b>\n\n` +
      `<b>Grand Total : ${total.toLocaleString()}</b>`
    );
    return;
  }

  if (trimmed === "📈 Yearly Report") {
    const reports = getRawReports();
    const curYear = new Date().getFullYear();

    const yearReports = reports.filter(r => r.year === curYear);
    const sum = (field: string) => yearReports.reduce((a, b) => a + (b[field] || 0), 0);
    const total = sum("customer_base") + sum("mobile_banking") + sum("internet_banking") + sum("atm") + sum("merchant");

    await sendTelegramMessage(token, chatId,
      `📈 <b>Yearly Report</b>\n` +
      `<b>Year ${curYear}</b>\n\n` +
      `🏦 Accounts Opened : <b>${sum("customer_base").toLocaleString()}</b>\n` +
      `📱 Mobile Banking : <b>${sum("mobile_banking").toLocaleString()}</b>\n` +
      `💻 Internet Banking : <b>${sum("internet_banking").toLocaleString()}</b>\n` +
      `💳 ATM : <b>${sum("atm").toLocaleString()}</b>\n` +
      `🛒 Merchant : <b>${sum("merchant").toLocaleString()}</b>\n\n` +
      `<b>Overall Total : ${total.toLocaleString()}</b>`
    );
    return;
  }

  if (trimmed === "📊 Overall Performance") {
    const reports = getRawReports();
    const sum = (field: string) => reports.reduce((a, b) => a + (b[field] || 0), 0);
    const total = sum("customer_base") + sum("mobile_banking") + sum("internet_banking") + sum("atm") + sum("merchant");

    await sendTelegramMessage(token, chatId,
      `📊 <b>Overall Performance</b>\n` +
      `<b>All-Time Aggregated</b>\n\n` +
      `🏦 Accounts Opened : <b>${sum("customer_base").toLocaleString()}</b>\n` +
      `📱 Mobile Banking : <b>${sum("mobile_banking").toLocaleString()}</b>\n` +
      `💻 Internet Banking : <b>${sum("internet_banking").toLocaleString()}</b>\n` +
      `💳 ATM : <b>${sum("atm").toLocaleString()}</b>\n` +
      `🛒 Merchant : <b>${sum("merchant").toLocaleString()}</b>\n\n` +
      `<b>Overall Total : ${total.toLocaleString()}</b>`
    );
    return;
  }

  // REPORTS BY DATE FILTER KEYWORDS
  if (trimmed === "Today") {
    const todayStr = new Date().toISOString().split("T")[0];
    const rep = getRawReports().find(r => r.date === todayStr);
    if (rep) {
      const tot = rep.customer_base + rep.mobile_banking + rep.internet_banking + rep.atm + rep.merchant;
      await sendTelegramMessage(token, chatId,
        `📅 <b>Report for Today (${formatDateNicely(todayStr)})</b>\n\n` +
        `🏦 Accounts Opened : <b>${rep.customer_base}</b>\n` +
        `📱 Mobile Banking : <b>${rep.mobile_banking}</b>\n` +
        `💻 Internet Banking : <b>${rep.internet_banking}</b>\n` +
        `💳 ATM : <b>${rep.atm}</b>\n` +
        `🛒 Merchant : <b>${rep.merchant}</b>\n\n` +
        `<b>Total: ${tot}</b>`
      );
    } else {
      await sendTelegramMessage(token, chatId, `ℹ️ No report submitted for today yet.`);
    }
    return;
  }

  if (trimmed === "Yesterday") {
    const yes = new Date();
    yes.setDate(yes.getDate() - 1);
    const yesStr = yes.toISOString().split("T")[0];
    const rep = getRawReports().find(r => r.date === yesStr);
    if (rep) {
      const tot = rep.customer_base + rep.mobile_banking + rep.internet_banking + rep.atm + rep.merchant;
      await sendTelegramMessage(token, chatId,
        `📅 <b>Report for Yesterday (${formatDateNicely(yesStr)})</b>\n\n` +
        `🏦 Accounts Opened : <b>${rep.customer_base}</b>\n` +
        `📱 Mobile Banking : <b>${rep.mobile_banking}</b>\n` +
        `💻 Internet Banking : <b>${rep.internet_banking}</b>\n` +
        `💳 ATM : <b>${rep.atm}</b>\n` +
        `🛒 Merchant : <b>${rep.merchant}</b>\n\n` +
        `<b>Total: ${tot}</b>`
      );
    } else {
      await sendTelegramMessage(token, chatId, `ℹ️ No report found for yesterday (${formatDateNicely(yesStr)}).`);
    }
    return;
  }

  if (trimmed === "Last 7 Days") {
    const dStr = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split("T")[0];
    const filtered = getRawReports().filter(r => r.date >= dStr);
    if (filtered.length === 0) {
      await sendTelegramMessage(token, chatId, "ℹ️ No report in last 7 days.");
      return;
    }
    let msg = `📅 <b>Reports in Last 7 Days</b>\n\n`;
    filtered.forEach(r => {
      const tot = r.customer_base + r.mobile_banking + r.internet_banking + r.atm + r.merchant;
      msg += `• <b>${r.date}</b> (${r.day.substring(0, 3)}): Total <b>${tot}</b> (AC: ${r.customer_base}, MB: ${r.mobile_banking})\n`;
    });
    await sendTelegramMessage(token, chatId, msg);
    return;
  }

  if (trimmed === "This Month") {
    const curYear = new Date().getFullYear();
    const curMonth = new Date().getMonth() + 1;
    const filtered = getRawReports().filter(r => r.year === curYear && r.month === curMonth);
    if (filtered.length === 0) {
      await sendTelegramMessage(token, chatId, "ℹ️ No reports in this month.");
      return;
    }
    let msg = `📅 <b>This Month's Submissions</b>\n\n`;
    filtered.slice(0, 15).forEach(r => {
      const tot = r.customer_base + r.mobile_banking + r.internet_banking + r.atm + r.merchant;
      msg += `• <b>${r.date}</b>: <b>${tot} products</b>\n`;
    });
    if (filtered.length > 15) {
      msg += `<i>And ${filtered.length - 15} more on the Web Portal...</i>`;
    }
    await sendTelegramMessage(token, chatId, msg);
    return;
  }

  if (trimmed === "Last Month") {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const prevYear = d.getFullYear();
    const prevMonth = d.getMonth() + 1;
    const filtered = getRawReports().filter(r => r.year === prevYear && r.month === prevMonth);
    if (filtered.length === 0) {
      await sendTelegramMessage(token, chatId, "ℹ️ No reports found in last month.");
      return;
    }
    let msg = `📅 <b>Last Month's Submissions</b>\n\n`;
    filtered.slice(0, 15).forEach(r => {
      const tot = r.customer_base + r.mobile_banking + r.internet_banking + r.atm + r.merchant;
      msg += `• <b>${r.date}</b>: <b>${tot} products</b>\n`;
    });
    await sendTelegramMessage(token, chatId, msg);
    return;
  }

  if (trimmed === "Custom Date") {
    session.step = "search_custom_date";
    await sendTelegramMessage(token, chatId, "📅 Please enter custom date in <code>YYYY-MM-DD</code> format (e.g. <code>2026-07-15</code>):");
    return;
  }

  // ADMIN MENU ACTIONS
  if (trimmed === "👨💼 Admin Menu" && user.role === "admin") {
    await sendTelegramMessage(token, chatId, "👨💼 Welcome to the Branch Admin command terminal:", getAdminKeyboard());
    return;
  }

  if (trimmed === "👥 Manage Users" && user.role === "admin") {
    const users = getRawUsers();
    let msg = "👥 <b>Branch Employees Profile List</b>\n\n";
    users.forEach(u => {
      msg += `• <b>${u.fullname}</b> (@${u.username}) - Role: <b>${u.role.toUpperCase()}</b>${u.telegram_id ? " (Telegram linked)" : " (No telegram)"}\n`;
    });
    await sendTelegramMessage(token, chatId, msg);
    return;
  }

  if (trimmed === "📈 View All Reports" && user.role === "admin") {
    const reps = getRawReports().slice(0, 15);
    let msg = "📈 <b>Recent Daily Branch Reports</b>\n\n";
    reps.forEach(r => {
      const tot = r.customer_base + r.mobile_banking + r.internet_banking + r.atm + r.merchant;
      msg += `• <b>${r.date}</b> (${r.day}): <b>${tot}</b> (AC:${r.customer_base} MB:${r.mobile_banking} IB:${r.internet_banking} ATM:${r.atm} ME:${r.merchant})\n`;
    });
    if (getRawReports().length > 15) msg += `\n<i>Full dataset with filters available on the Web Portal.</i>`;
    await sendTelegramMessage(token, chatId, msg);
    return;
  }

  if (trimmed === "📊 System Statistics" && user.role === "admin") {
    const reps = getRawReports();
    const users = getRawUsers();
    const totalA = reps.reduce((s, r) => s + (r.customer_base || 0), 0);
    const totalM = reps.reduce((s, r) => s + (r.mobile_banking || 0), 0);
    const grand = reps.reduce((s, r) => s + (r.customer_base + r.mobile_banking + r.internet_banking + r.atm + r.merchant), 0);

    const msg = `📊 <b>System Telemetry & Database Statistics</b>\n\n` +
      `• Total Branch Employees: <b>${users.length}</b>\n` +
      `• Active Report Days: <b>${reps.length}</b>\n` +
      `• Accounts Opened: <b>${totalA.toLocaleString()}</b>\n` +
      `• Mobile Banking Registrations: <b>${totalM.toLocaleString()}</b>\n` +
      `• Grand Activations: <b>${grand.toLocaleString()}</b>\n\n` +
      `System Engine is running healthy.`;
    await sendTelegramMessage(token, chatId, msg);
    return;
  }

  if (trimmed === "📄 Export Database" && user.role === "admin") {
    const rawData = {
      users: getRawUsers(),
      daily_reports: getRawReports()
    };
    await sendTelegramDocument(token, chatId, "bunna_bank_database_backup.json", JSON.stringify(rawData, null, 2), "Here is the full database raw backup in JSON format.");
    return;
  }

  // Fallback / Unknown messages
  await sendTelegramMessage(token, chatId, `⚠️ Command or message not recognized. Please use the menu buttons to navigate.`, getMainMenuKeyboard(user.role === "admin"));
}

// Handle inline keyboard checkbox interactions
async function handleTelegramCallbackQuery(token: string, callbackQuery: any) {
  const chatId = String(callbackQuery.message.chat.id);
  const data = callbackQuery.data;
  const messageId = callbackQuery.message.message_id;
  const callbackQueryId = callbackQuery.id;

  let session = sessions.get(chatId);
  if (!session) {
    session = { chatId, step: "idle" };
    sessions.set(chatId, session);
  }

  const user = getUserByTelegramId(chatId);
  if (!user) {
    await answerCallbackQuery(token, callbackQueryId, "⚠️ Session expired. Please register first.", true);
    return;
  }

  if (session.step !== "edit_select_products") {
    await answerCallbackQuery(token, callbackQueryId, "⚠️ This edit session is no longer active.", true);
    return;
  }

  const reports = getRawReports().filter(r => r.created_by === user.id);
  if (reports.length === 0) {
    await answerCallbackQuery(token, callbackQueryId, "❌ No reports found.", true);
    return;
  }
  reports.sort((a, b) => b.id - a.id);
  const lastReport = reports[0];

  if (data.startsWith("toggle_")) {
    const fieldName = data.substring(7);
    if (!session.editSelectedProducts) {
      session.editSelectedProducts = [];
    }
    const idx = session.editSelectedProducts.indexOf(fieldName);
    if (idx > -1) {
      session.editSelectedProducts.splice(idx, 1);
    } else {
      session.editSelectedProducts.push(fieldName);
    }

    const msg = `✏️ <b>Edit Last Daily Report</b>\n` +
      `📅 Date: <b>${formatDateNicely(lastReport.date)}</b>\n\n` +
      `Current Figures:\n` +
      `🏦 Accounts Opened: <b>${lastReport.customer_base}</b>\n` +
      `📱 Mobile Banking: <b>${lastReport.mobile_banking}</b>\n` +
      `💻 Internet Banking: <b>${lastReport.internet_banking}</b>\n` +
      `💳 ATM issued: <b>${lastReport.atm}</b>\n` +
      `🛒 Merchant acquired: <b>${lastReport.merchant}</b>\n\n` +
      `Please select/check the products you want to edit. Other products will remain unchanged:\n\n` +
      `Select your preferences below:`;

    await editTelegramMessageText(token, chatId, messageId, msg, getEditProductsInlineKeyboard(session.editSelectedProducts));
    await answerCallbackQuery(token, callbackQueryId);
    return;
  }

  if (data === "edit_continue") {
    const selected = session.editSelectedProducts || [];
    if (selected.length === 0) {
      await answerCallbackQuery(token, callbackQueryId, "⚠️ Please select/check at least one product to edit.", true);
      return;
    }

    session.step = "edit_product_value";
    session.editCurrentIndex = 0;
    const firstKey = selected[0];
    const prodObj = PRODUCT_KEYS.find(p => p.key === firstKey);
    const label = prodObj ? prodObj.label : firstKey;
    const curVal = session.tempReport ? (session.tempReport as any)[firstKey] : 0;

    await answerCallbackQuery(token, callbackQueryId);

    // Delete the original interactive message to keep chat clean
    try {
      await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId })
      });
    } catch (e) {
      console.error("Failed to delete interactive message", e);
    }

    await sendTelegramMessage(token, chatId, `✏️ ${label}\n\nEnter new value for <b>${prodObj?.label || firstKey}</b> (Current: ${curVal}):`, {
      keyboard: [[{ text: "❌ Cancel" }]],
      resize_keyboard: true,
      one_time_keyboard: true
    });
    return;
  }

  if (data === "edit_cancel") {
    session.step = "idle";
    await answerCallbackQuery(token, callbackQueryId, "❌ Edit cancelled.");
    
    // Edit or delete message
    try {
      await editTelegramMessageText(token, chatId, messageId, "❌ Edit cancelled.");
    } catch (e) {}

    await sendTelegramMessage(token, chatId, "🔙 Returned to Main Menu.", getMainMenuKeyboard(user.role === "admin"));
    return;
  }
}

// Background poller loop
let isPolling = false;
let lastOffset = 0;

export async function startTelegramBotDaemon() {
  if (isPolling) return;
  isPolling = true;

  console.log("[TELEGRAM] Starting BB Hamusit Bot Poller Daemon...");

  while (true) {
    const token = getTelegramToken();
    if (!token) {
      console.log("[TELEGRAM] TELEGRAM_BOT_TOKEN is not configured. Waiting 10 seconds...");
      await new Promise(resolve => setTimeout(resolve, 10000));
      continue;
    }

    try {
      // Long poll for 5 seconds
      const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastOffset}&timeout=5`, {
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 404) {
          console.error(`[TELEGRAM] Invalid Bot Token. Please check your TELEGRAM_BOT_TOKEN: ${response.statusText}`);
          await new Promise(resolve => setTimeout(resolve, 15000));
          continue;
        }
        throw new Error(`Telegram error status ${response.status}`);
      }

      const body = await response.json();
      if (body.ok && body.result && body.result.length > 0) {
        for (const update of body.result) {
          lastOffset = update.update_id + 1;

          if (update.message && update.message.text) {
            const chatId = String(update.message.chat.id);
            const text = update.message.text;
            console.log(`[TELEGRAM] Message from ${chatId}: ${text}`);
            
            // Handle message asynchronously so polling isn't blocked
            handleTelegramMessage(token, chatId, text).catch(err => {
              console.error("[TELEGRAM] Error handling message:", err);
            });
          }

          if (update.callback_query) {
            const token_val = token;
            handleTelegramCallbackQuery(token_val, update.callback_query).catch(err => {
              console.error("[TELEGRAM] Error handling callback query:", err);
            });
          }
        }
      }
    } catch (err: any) {
      console.warn("[TELEGRAM] Poll network or timeout exception:", err.message);
      // Backoff before retry to prevent high-frequency loop on network failure
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Small sleep between updates
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
