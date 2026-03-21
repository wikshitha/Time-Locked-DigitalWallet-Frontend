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
      case "Created Vault": return <FiPlusCircle className="text-emerald-500" />;
      case "Deleted Vault": return <FiTrash2 className="text-rose-500" />;
      case "Uploaded File": return <FiUploadCloud className="text-primary" />;
      case "Added Participant": return <FiUser className="text-secondary" />;
      case "Removed Participant": return <FiMinusCircle className="text-orange-500" />;
      case "Release Triggered": return <FiActivity className="text-actiion" />;
      default: return <FiFileText className="text-gray-400" />;
    }
  };

  const getActionStyle = (action) => {
    switch (action) {
      case "Created Vault": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Deleted Vault": return "bg-rose-50 text-rose-700 border-rose-100";
      case "Uploaded File": return "bg-primary/5 text-primary border-primary/20";
      case "Added Participant": return "bg-secondary/5 text-secondary border-secondary/20";
      case "Removed Participant": return "bg-orange-50 text-orange-700 border-orange-100";
      case "Release Triggered": return "bg-yellow-50 text-yellow-700 border-yellow-100";
      default: return "bg-gray-50 text-gray-700 border-gray-100";
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
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <FiActivity className="w-8 h-8 mb-2 opacity-20" />
          <p className="text-sm">No matching activity logs found.</p>
        </div>
      );
    }

    const formatDetails = (log) => {
      const details = log.details;
      if (!details) return <span className="text-gray-400">-</span>;

      // Handle different action types
      switch (log.action) {
        case "Created Vault":
        case "Deleted Vault":
          return <span className="font-medium text-gray-700">{details.vaultName || "Unknown Vault"}</span>;
        
        case "Uploaded File":
          return (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">{details.fileName || "Unknown File"}</span>
            </div>
          );
        
        case "Added Participant":
        case "Removed Participant":
          return (
            <div className="flex flex-col">
              <span className="font-medium text-gray-700">{details.participantName || details.participantEmail}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full w-fit mt-1 capitalize">
                {details.role}
              </span>
            </div>
          );
        
        case "Release Triggered":
          return (
            <div className="flex flex-col">
              <span className="font-medium text-gray-700">Release Sequence Initiated</span>
              {details.gracePeriodDesc && <span className="text-xs text-amber-600 mt-1">Grace Period: {details.gracePeriodDesc}</span>}
            </div>
          );
        
        default:
          if (details.vaultName) return details.vaultName;
          if (details.releaseId) return `Release ID: ${details.releaseId}`;
          if (details.note) return details.note;
          return <span className="text-gray-500 truncate max-w-[200px] block" title={JSON.stringify(details)}>{JSON.stringify(details)}</span>;
      }
    };

    return (
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {filteredLogs.map((log) => (
              <tr key={log._id} className="group hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border ${getActionStyle(log.action)}`}>
                    {getActionIcon(log.action)}
                    {log.action}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {(log.user?.firstName?.[0] || "S").toUpperCase()}
                    </div>
                    <span className="text-sm text-secondary font-medium">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : "System"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatDetails(log)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-secondary">
                      {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-xs text-gray-400">
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
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm font-medium">Loading audit trail...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-secondary flex items-center gap-3">
              <FiShield className="text-primary" />
              Audit Logs
            </h1>
            <p className="text-slate-500 mt-1">Track all activities and security events across your vaults.</p>
          </div>
          
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full md:w-64 transition-all"
            />
          </div>
        </div>

        {/* My Owned Vaults Logs Section */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-secondary flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <FiBox />
              </span>
              My Vaults
            </h2>
            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-semibold">
              {ownedVaultLogs.length}
            </span>
          </div>

          {ownedVaultLogs.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-300">
              <p className="text-gray-500">No activity logs found for your owned vaults.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {ownedVaultLogs.map((vaultLog) => (
                <div key={vaultLog.vaultId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-slate-50/30">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      {vaultLog.vaultTitle}
                    </h3>
                    <span className="text-xs text-gray-500 bg-white border px-2 py-1 rounded-md">
                      {vaultLog.logs.length} events
                    </span>
                  </div>
                  <div className="p-4 sm:p-6 bg-slate-50/30">
                    {renderLogTable(vaultLog.logs)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Vaults I'm Participating In Section */}
        {participantVaultLogs.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-secondary flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                  <FiUser />
                </span>
                Participating Vaults
              </h2>
              <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                {participantVaultLogs.length}
              </span>
            </div>

            <div className="grid gap-6">
              {participantVaultLogs.map((vaultLog) => (
                <div key={vaultLog.vaultId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-slate-50/30">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-secondary">
                        {vaultLog.vaultTitle}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-secondary/5 text-secondary border border-secondary/20 capitalize">
                        {vaultLog.userRole}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 bg-white border px-2 py-1 rounded-md">
                      {vaultLog.logs.length} events
                    </span>
                  </div>
                  <div className="p-4 sm:p-6 bg-slate-50/30">
                    {renderLogTable(vaultLog.logs)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="pt-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-primary font-medium transition-colors"
          >
            <FiArrowLeft /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
