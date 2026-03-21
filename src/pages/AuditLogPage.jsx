import { useEffect, useState } from "react";
import API from "../utils/api.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiClock,
  FiFileText,
  FiShield,
  FiUser,
  FiTrash2,
  FiUploadCloud,
  FiPlusCircle,
  FiMinusCircle,
  FiBox,
  FiArrowLeft,
  FiSearch
} from "react-icons/fi";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function AuditLogPage() {
  const { token } = useAuthStore();
  const [ownedVaultLogs, setOwnedVaultLogs] = useState([]);
  const [participantVaultLogs, setParticipantVaultLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await API.get("/api/auditlogs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOwnedVaultLogs(res.data.ownedVaultLogs || []);
        setParticipantVaultLogs(res.data.participantVaultLogs || []);
      } catch (err) {
        console.error("Error fetching logs:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchLogs();
  }, [token]);

  const getActionIcon = (action) => {
    switch (action) {
      case "Created Vault": return <FiPlusCircle className="text-emerald-400 w-4 h-4 sm:w-5 sm:h-5" />;
      case "Deleted Vault": return <FiTrash2 className="text-rose-400 w-4 h-4 sm:w-5 sm:h-5" />;
      case "Uploaded File": return <FiUploadCloud className="text-[#ffeb00] w-4 h-4 sm:w-5 sm:h-5" />;
      case "Added Participant": return <FiUser className="text-blue-400 w-4 h-4 sm:w-5 sm:h-5" />;
      case "Removed Participant": return <FiMinusCircle className="text-orange-400 w-4 h-4 sm:w-5 sm:h-5" />;
      case "Release Triggered": return <FiActivity className="text-[#ffeb00] w-4 h-4 sm:w-5 sm:h-5" />;
      default: return <FiFileText className="text-white/60 w-4 h-4 sm:w-5 sm:h-5" />;
    }
  };

  const getActionStyle = (action) => {
    switch (action) {
      case "Created Vault": return "bg-emerald-500/30 text-emerald-300 border-emerald-500/50";
      case "Deleted Vault": return "bg-rose-500/30 text-rose-300 border-rose-500/50";
      case "Uploaded File": return "bg-[#344cb7]/30 text-[#ffeb00] border-[#344cb7]/50";
      case "Added Participant": return "bg-blue-500/30 text-blue-300 border-blue-500/50";
      case "Removed Participant": return "bg-orange-500/30 text-orange-300 border-orange-500/50";
      case "Release Triggered": return "bg-[#ffeb00]/30 text-[#ffeb00] border-[#ffeb00]/50";
      default: return "bg-white/20 text-white/90 border-white/30";
    }
  };

  const renderLogTable = (logs) => {
    const filteredLogs = logs.filter(log =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user?.firstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user?.lastName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!filteredLogs || filteredLogs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-white/60">
          <FiActivity className="w-10 h-10 sm:w-12 sm:h-12 mb-3 opacity-40" />
          <p className="text-sm sm:text-base font-medium">No matching activity logs</p>
        </div>
      );
    }

    const formatDetails = (log) => {
      const details = log.details;
      if (!details) return <span className="text-white/70">-</span>;

      switch (log.action) {
        case "Created Vault":
        case "Deleted Vault":
          return <span className="font-semibold text-white">{details.vaultName || "Unknown Vault"}</span>;

        case "Uploaded File":
          return (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{details.fileName || "Unknown File"}</span>
            </div>
          );

        case "Added Participant":
        case "Removed Participant":
          return (
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-white">{details.participantName || details.participantEmail}</span>
              <span className="text-xs bg-[#ffeb00]/20 text-[#ffeb00] px-2.5 py-1 rounded-lg w-fit capitalize font-bold border border-[#ffeb00]/30">
                {details.role}
              </span>
            </div>
          );

        case "Release Triggered":
          return (
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-white">Release Sequence Initiated</span>
              {details.gracePeriodDesc && <span className="text-xs text-[#ffeb00]/90">⏳ {details.gracePeriodDesc}</span>}
            </div>
          );

        default:
          if (details.vaultName) return details.vaultName;
          if (details.releaseId) return `Release ID: ${details.releaseId}`;
          if (details.note) return details.note;
          return <span className="text-white/60 truncate max-w-[200px] block" title={JSON.stringify(details)}>{JSON.stringify(details)}</span>;
      }
    };

    return (
      <div className="overflow-x-auto rounded-xl sm:rounded-2xl border-2 border-white/20">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-white/10 to-transparent border-b-2 border-white/20">
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-black text-[#ffeb00] uppercase tracking-wider">Activity</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-black text-[#ffeb00] uppercase tracking-wider">User</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-black text-[#ffeb00] uppercase tracking-wider">Details</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-black text-[#ffeb00] uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredLogs.map((log) => (
              <tr key={log._id} className="hover:bg-white/10 transition-colors">
                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold border-2 ${getActionStyle(log.action)}`}>
                    {getActionIcon(log.action)}
                    <span className="hidden sm:inline">{log.action}</span>
                    <span className="sm:hidden">{log.action.split(" ")[0]}</span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#ffeb00] to-[#ffd700] text-[#000957] text-xs font-bold flex items-center justify-center shadow-lg">
                      {(log.user?.firstName?.[0] || "S").toUpperCase()}
                    </div>
                    <span className="text-xs sm:text-sm text-white/90 font-semibold">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : "System"}
                    </span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-white/80">
                  {formatDetails(log)}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-xs text-white/60">
                      {new Date(log.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading)
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#000957] via-[#1a2470] to-[#344cb7] flex items-center justify-center relative overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#ffeb00]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#344cb7]/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#ffeb00]/30 border-t-[#ffeb00] rounded-full animate-spin"></div>
          <p className="text-white/70 text-base font-bold">Loading audit logs...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#000957] via-[#1a2470] to-[#344cb7] text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#ffeb00]/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#344cb7]/10 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-[#ffeb00]/3 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#000957]/95 via-[#1a2470]/95 to-[#000957]/95 backdrop-blur-xl shadow-2xl border-b-2 border-[#ffeb00]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 lg:h-24">
            {/* Logo and Title */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-[#ffeb00] to-[#ffd700] text-[#000957] px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 rounded-xl shadow-2xl font-black text-sm sm:text-base lg:text-lg animate-pulse">
                📋 Audit
              </div>
              <h1 className="hidden sm:block text-lg sm:text-xl lg:text-2xl font-black bg-gradient-to-r from-white via-[#ffeb00] to-white bg-clip-text text-transparent">
                Activity Logs
              </h1>
            </div>

            {/* Back Button */}
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 sm:gap-2 bg-white/10 hover:bg-gradient-to-r hover:from-[#ffeb00] hover:to-[#ffd700] hover:text-[#000957] active:scale-95 transition-all px-3 py-2 sm:px-4 sm:py-2.5 lg:px-5 lg:py-3 rounded-xl border-2 border-[#ffeb00]/50 hover:border-[#ffeb00] font-bold shadow-lg text-xs sm:text-sm lg:text-base group"
            >
              <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Welcome Section */}
        <div className="mb-8 sm:mb-10 lg:mb-12 animate-fade-in-up">
          <div className="bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border-2 border-[#ffeb00]/30 shadow-2xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 sm:mb-3 flex items-center gap-3">
              <FiShield className="text-[#ffeb00]" />
              Track All Activities
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-white/80 font-medium leading-relaxed">
              Monitor vault operations, user actions, and security events with complete <span className="text-[#ffeb00] font-bold">audit visibility</span>.
            </p>
          </div>
        </div>

        {/* Search Filter */}
        <div className="mb-8 sm:mb-10 lg:mb-12 animate-fade-in-up" style={{animationDelay: '100ms'}}>
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ffeb00] w-5 h-5" />
            <input
              type="text"
              placeholder="Search by action, user name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3 sm:py-4 bg-white/10 border-2 border-[#ffeb00]/30 hover:border-[#ffeb00]/50 focus:border-[#ffeb00] rounded-xl sm:rounded-2xl text-white placeholder-white/50 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#ffeb00]/30 transition-all backdrop-blur-sm font-medium"
            />
          </div>
        </div>

        {/* Audit Logs Sections */}
        {ownedVaultLogs.length > 0 && (
          <div className="mb-8 sm:mb-10 lg:mb-12 animate-fade-in-up" style={{animationDelay: '200ms'}}>
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="bg-gradient-to-br from-[#ffeb00] to-[#ffd700] text-[#000957] p-3 rounded-2xl shadow-2xl animate-bounce-slow">
                <FiBox className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
                  🏠 My Vaults
                  <span className="ml-3 inline-flex items-center justify-center bg-[#ffeb00] text-[#000957] px-3 py-1 rounded-xl text-base sm:text-lg font-black">
                    {ownedVaultLogs.length}
                  </span>
                </h2>
                <p className="text-white/70 mt-1 text-sm sm:text-base">Activity in vaults you own</p>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {ownedVaultLogs.map((vaultLog, index) => (
                <div
                  key={vaultLog.vaultId}
                  className="bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border-2 border-white/30 hover:border-[#ffeb00] transition-all animate-fade-in-up hover:shadow-[0_0_40px_rgba(255,235,0,0.2)]"
                  style={{animationDelay: `${index * 50}ms`}}
                >
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-3">
                      <span className="text-[#ffeb00]">🔐</span>
                      {vaultLog.vaultTitle}
                    </h3>
                    <span className="bg-[#ffeb00]/20 text-[#ffeb00] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold border border-[#ffeb00]/50">
                      {vaultLog.logs.length} events
                    </span>
                  </div>
                  {renderLogTable(vaultLog.logs)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Participant Vaults Section */}
        {participantVaultLogs.length > 0 && (
          <div className="animate-fade-in-up" style={{animationDelay: '400ms'}}>
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="bg-gradient-to-br from-[#344cb7] to-[#5568d3] text-white p-3 rounded-2xl shadow-2xl animate-bounce-slow">
                <FiUser className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
                  👥 Participating Vaults
                  <span className="ml-3 inline-flex items-center justify-center bg-[#ffeb00] text-[#000957] px-3 py-1 rounded-xl text-base sm:text-lg font-black">
                    {participantVaultLogs.length}
                  </span>
                </h2>
                <p className="text-white/70 mt-1 text-sm sm:text-base">Activity in vaults you participate in</p>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {participantVaultLogs.map((vaultLog, index) => (
                <div
                  key={vaultLog.vaultId}
                  className="bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl border-2 border-white/30 hover:border-[#ffeb00] transition-all animate-fade-in-up hover:shadow-[0_0_40px_rgba(255,235,0,0.2)]"
                  style={{animationDelay: `${index * 50}ms`}}
                >
                  <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
                    <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-3">
                      <span className="text-[#ffeb00]">🔐</span>
                      {vaultLog.vaultTitle}
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                      <span className="bg-[#344cb7]/30 text-[#ffeb00] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold border border-[#344cb7]/50 capitalize">
                        Role: {vaultLog.userRole}
                      </span>
                      <span className="bg-[#ffeb00]/20 text-[#ffeb00] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold border border-[#ffeb00]/50">
                        {vaultLog.logs.length} events
                      </span>
                    </div>
                  </div>
                  {renderLogTable(vaultLog.logs)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {ownedVaultLogs.length === 0 && participantVaultLogs.length === 0 && (
          <div className="bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-12 sm:p-16 lg:p-20 text-center border-3 border-dashed border-[#ffeb00]/30">
            <FiActivity className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 opacity-40 text-[#ffeb00]" />
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">No activity logs found</p>
            <p className="text-sm sm:text-base text-white/70 mt-2">Activity will appear here as you use the vaults</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-12 sm:mt-16 lg:mt-20 py-6 sm:py-8 lg:py-10 text-center border-t-2 border-[#ffeb00]/20 bg-gradient-to-r from-[#000957]/80 via-[#1a2470]/80 to-[#000957]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm sm:text-base text-white/60">
            📊 Complete audit trail for your digital vault system
          </p>
        </div>
      </footer>
    </div>
  );
}
