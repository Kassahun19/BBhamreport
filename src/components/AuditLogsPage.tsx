import { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  Search, 
  Calendar, 
  Clock, 
  User as UserIcon, 
  Info,
  RefreshCw
} from "lucide-react";
import { AuditLog } from "../types";
import { fetchAuditLogs } from "../utils/api";

interface AuditLogsProps {
  onNotification: (msg: string, type: "success" | "error") => void;
}

export default function AuditLogsPage({ onNotification }: AuditLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAuditLogs();
      setLogs(data);
    } catch (err: any) {
      onNotification(err.message || "Failed to retrieve system audit logs", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      (log.details && log.details.toLowerCase().includes(term)) ||
      (log.fullname && log.fullname.toLowerCase().includes(term)) ||
      (log.username && log.username.toLowerCase().includes(term))
    );
  });

  return (
    <div id="audit-logs-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left">
      
      {/* Page Title Block */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-2 bg-brand-gold" />
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-brand-green tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5.5 h-5.5 text-brand-gold" />
            System Audit & Operator Logs
          </h2>
          <p className="text-xs text-gray-500">
            Secure tracking of user logins, database creations, updates, and deletes for the Hamusit Branch campaign reports.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Logs
        </button>
      </div>

      {/* Search Header row */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm max-w-md relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search action, details, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 focus:border-brand-green focus:outline-none rounded-xl"
          />
        </div>
      </div>

      {/* Logs Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse">
            
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-bold font-mono border-b border-gray-100 select-none">
                <th className="px-4 py-3 text-left">Timestamp</th>
                <th className="px-4 py-3 text-left">Operator</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Audit Details</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-xs font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                    <span className="animate-pulse">Loading system audit register...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  
                  // Style actions with custom coloring chips
                  let chipColor = "bg-gray-100 text-gray-600 border-gray-200";
                  if (log.action.includes("Create")) {
                    chipColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  } else if (log.action.includes("Update")) {
                    chipColor = "bg-blue-50 text-blue-700 border-blue-100";
                  } else if (log.action.includes("Delete")) {
                    chipColor = "bg-red-50 text-red-700 border-red-100";
                  } else if (log.action.includes("Login")) {
                    chipColor = "bg-amber-50 text-amber-700 border-amber-100";
                  }

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/30 transition-colors">
                      {/* Timestamp */}
                      <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{log.timestamp}</span>
                        </span>
                      </td>

                      {/* Operator User */}
                      <td className="px-4 py-3.5 font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                          <div>
                            <p className="leading-none text-gray-800">{log.fullname || "Anonymous"}</p>
                            <p className="text-[9px] font-semibold text-gray-400 mt-0.5 leading-none uppercase font-sans">
                              {log.role || "unknown"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Action Chip */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border ${chipColor}`}>
                          {log.action}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="px-4 py-3.5 text-gray-600 max-w-sm font-sans text-xs leading-relaxed">
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
}
