import React, { useState, useEffect } from "react";
import { 
  Bot, 
  Key, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  RefreshCw, 
  ExternalLink,
  Lock,
  UserCheck
} from "lucide-react";
import { getHeaders } from "../utils/api";

interface TelegramBotConfigPageProps {
  onNotification: (message: string, type: "success" | "error") => void;
}

export default function TelegramBotConfigPage({ onNotification }: TelegramBotConfigPageProps) {
  const [token, setToken] = useState("");
  const [obfuscatedToken, setObfuscatedToken] = useState("");
  const [botUsername, setBotUsername] = useState("HamusitDailyReportBot");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBotConfig();
  }, []);

  const fetchBotConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/telegram/config", {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setObfuscatedToken(data.token);
        setToken(data.fullToken || "");
        if (data.botUsername) {
          setBotUsername(data.botUsername);
        }
      } else {
        onNotification("Failed to load Telegram bot configuration", "error");
      }
    } catch (err) {
      console.error(err);
      onNotification("Failed to connect to server", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/telegram/config", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ token })
      });
      if (res.ok) {
        onNotification("Telegram Bot token updated successfully!", "success");
        fetchBotConfig();
      } else {
        onNotification("Failed to save bot token", "error");
      }
    } catch (err) {
      console.error(err);
      onNotification("Failed to save token", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="telegram-config-panel" className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-green flex items-center justify-center text-brand-gold shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                Telegram Bot Integration
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Link and manage the Bunna Bank Hamusit Branch Daily Reporting Bot
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchBotConfig}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-brand-green border border-gray-200 hover:border-brand-green rounded-lg bg-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Reload Settings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Settings Card */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveConfig} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 font-mono uppercase tracking-wider mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-brand-gold" /> Bot Credentials
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Bot Token (From @BotFather)
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="e.g. 1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  className="w-full text-sm font-mono border border-gray-200 focus:border-brand-green rounded-xl px-4 py-3 outline-none transition-all"
                />
                <p className="mt-1.5 text-[11px] text-gray-400 font-medium leading-relaxed">
                  {obfuscatedToken ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Configured bot: {obfuscatedToken}
                    </span>
                  ) : (
                    "No Bot Token set. The background poller is currently inactive."
                  )}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                  Bot Username
                </label>
                <div className="flex items-center">
                  <span className="bg-gray-100 border border-r-0 border-gray-200 text-gray-500 px-3 py-3 rounded-l-xl text-sm font-mono">
                    @
                  </span>
                  <input
                    type="text"
                    value={botUsername}
                    disabled
                    className="w-full text-sm font-mono border border-gray-200 bg-gray-50 text-gray-500 rounded-r-xl px-4 py-3 outline-none"
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-extrabold uppercase font-mono tracking-wider text-amber-800">
                    Security Protection
                  </p>
                  <p className="mt-0.5 font-medium">
                    The Telegram Bot connects directly to this server's JSON database file in real-time. Make sure to keep your Bot Token highly confidential.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full md:w-auto bg-brand-green hover:bg-brand-green-light text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-md shadow-green-glow flex items-center justify-center gap-2"
                >
                  {isSaving ? "Saving Config..." : "Save Bot Configuration"}
                </button>
              </div>
            </div>
          </form>

          {/* Quick Access Card */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 font-mono uppercase tracking-wider mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-brand-gold" /> Bot Launch Information
            </h3>
            <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
              <p className="font-medium">
                The Bunna Bank Hamusit Branch Telegram Bot is a fully functional conversational interface configured with responsive keyboard and inline buttons.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50">
                  <p className="font-extrabold font-mono text-gray-800 uppercase tracking-wide">
                    Live Web Integration
                  </p>
                  <p className="mt-1">
                    Submissions made via the Telegram Bot are processed instantly into the shared database, and are immediately visible in the charts and statistics of this portal.
                  </p>
                </div>

                <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50">
                  <p className="font-extrabold font-mono text-gray-800 uppercase tracking-wide">
                    Polling Daemon Status
                  </p>
                  <p className="mt-1">
                    The bot runs via a lightweight, secure background polling service. You do not need to configure complex webhooks, reverse-proxies, or public SSL certificates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Guide Card */}
        <div className="space-y-6">
          <div className="bg-brand-green-dark border border-brand-green bg-[#0c4326] text-white rounded-3xl p-6 shadow-lg">
            <h3 className="text-sm font-extrabold font-mono uppercase tracking-wider text-brand-gold flex items-center gap-2 mb-4">
              <HelpCircle className="w-4 h-4" /> User Link Guide
            </h3>
            
            <div className="space-y-4 text-xs leading-relaxed">
              <p className="font-semibold text-gray-200">
                How branch staff and admins connect their Telegram chat:
              </p>

              <ol className="list-decimal pl-4 space-y-3 font-medium text-gray-300">
                <li>
                  Open Telegram and search for <b>@{botUsername}</b>.
                </li>
                <li>
                  Click <b>Start</b> or send <code>/start</code>.
                </li>
                <li>
                  Login using your employee username and password with the following command:
                  <div className="bg-[#072a18] p-2.5 rounded-xl text-brand-gold font-mono text-[11px] mt-1.5 break-all border border-green-800">
                    /login [username] [password]
                  </div>
                </li>
                <li>
                  Once logged in, your Telegram profile is safely bound to your employee record, and you can submit reports instantly!
                </li>
              </ol>

              <div className="border-t border-green-800/60 pt-4 mt-2">
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-brand-gold hover:bg-yellow-500 text-[#0c4326] font-bold py-2.5 rounded-xl transition-all"
                >
                  Launch Bot in Telegram
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h4 className="text-xs font-extrabold text-gray-900 font-mono uppercase tracking-wider mb-3">
              Features Implemented
            </h4>
            <ul className="text-xs text-gray-500 font-semibold space-y-2.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Conversational Report Submission (multi-step keyboard guidance)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Today's, Weekly, Monthly, and Yearly Performance Summaries</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Search Reports by Date and Range filters</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Top Performance (Best Day calculation)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>CSV File Dataset Export directly on Telegram</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Employee Login verification</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
