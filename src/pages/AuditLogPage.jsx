import { useEffect, useState } from "react";
import API from "../utils/api.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { Link } from "react-router-dom";

export default function AuditLogPage() {
  const { token } = useAuthStore();
  const [ownedVaultLogs, setOwnedVaultLogs] = useState([]);
  const [participantVaultLogs, setParticipantVaultLogs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const renderLogTable = (logs) => {
    if (!logs || logs.length === 0) {
      return <p className="text-gray-500 italic text-sm">No logs recorded.</p>;
    }

    const formatDetails = (log) => {
      const details = log.details;
      if (!details) return "-";

      // Handle different action types
      switch (log.action) {
        case "Created Vault":
          return `Vault: ${details.vaultName || "Unknown"}`;
        
        case "Uploaded File":
          return (
            <div className="flex flex-col gap-0.5">
              <span>📄 File: {details.fileName || "Unknown"}</span>
              {details.vaultName && <span className="text-gray-500">Vault: {details.vaultName}</span>}
            </div>
          );
        
        case "Added Participant":
          return (
            <div className="flex flex-col gap-0.5">
              <span>👤 {details.participantName || details.participantEmail}</span>
              <span className="text-gray-500">Role: <span className="capitalize font-medium">{details.role}</span></span>
            </div>
          );
        
        case "Removed Participant":
          return (
            <div className="flex flex-col gap-0.5">
              <span>👤 {details.participantName || details.participantEmail}</span>
              <span className="text-gray-500">Role: <span className="capitalize font-medium">{details.role}</span></span>
            </div>
          );
        
        case "Deleted Vault":
          return `Vault: ${details.vaultName || "Unknown"}`;
        
        case "Release Triggered":
          return (
            <div className="flex flex-col gap-0.5">
              <span>🚀 Release initiated</span>
              {details.gracePeriodDesc && <span className="text-gray-500">Grace Period: {details.gracePeriodDesc}</span>}
            </div>
          );
        
        default:
          // Fallback for other actions
          if (details.vaultName) return `Vault: ${details.vaultName}`;
          if (details.releaseId) return `Release ID: ${details.releaseId}`;
          if (details.note) return details.note;
          return JSON.stringify(details).substring(0, 80);
      }
    };

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="border p-2 text-left">Action</th>
              <th className="border p-2 text-left">User</th>
              <th className="border p-2 text-left">Details</th>
              <th className="border p-2 text-left">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id} className="hover:bg-gray-50">
                <td className="border p-2 font-medium">{log.action}</td>
                <td className="border p-2">
                  {log.user
                    ? `${log.user.firstName} ${log.user.lastName}`
                    : "System"}
                </td>
                <td className="border p-2 text-gray-600 text-xs">
                  {formatDetails(log)}
                </td>
                <td className="border p-2 text-gray-500 text-xs">
                  {new Date(log.timestamp).toLocaleString()}
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
      <div className="flex h-screen items-center justify-center text-gray-600">
        Loading logs...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Audit Logs</h1>

        {/* My Owned Vaults Logs Section */}
        <div className="bg-white shadow-lg rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-semibold">
              My Vaults
            </div>
            <span className="text-sm text-gray-600">
              ({ownedVaultLogs.length} vault{ownedVaultLogs.length !== 1 ? 's' : ''})
            </span>
          </div>

          {ownedVaultLogs.length === 0 ? (
            <p className="text-gray-500 italic">No logs found for your owned vaults.</p>
          ) : (
            <div className="space-y-6">
              {ownedVaultLogs.map((vaultLog) => (
                <div key={vaultLog.vaultId} className="border rounded-lg p-4 bg-slate-50">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-blue-600">🔐</span>
                    {vaultLog.vaultTitle}
                    <span className="text-xs text-gray-500 font-normal">
                      ({vaultLog.logs.length} log{vaultLog.logs.length !== 1 ? 's' : ''})
                    </span>
                  </h3>
                  {renderLogTable(vaultLog.logs)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vaults I'm Participating In Section */}
        <div className="bg-white shadow-lg rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold">
              Vaults I'm Participating In
            </div>
            <span className="text-sm text-gray-600">
              ({participantVaultLogs.length} vault{participantVaultLogs.length !== 1 ? 's' : ''})
            </span>
          </div>

          {participantVaultLogs.length === 0 ? (
            <p className="text-gray-500 italic">No logs found for vaults you're participating in.</p>
          ) : (
            <div className="space-y-6">
              {participantVaultLogs.map((vaultLog) => (
                <div key={vaultLog.vaultId} className="border rounded-lg p-4 bg-slate-50">
                  <h3 className="text-lg font-semibold text-gray-700 mb-1 flex items-center gap-2">
                    <span className="text-purple-600">👥</span>
                    {vaultLog.vaultTitle}
                    <span className="text-xs text-gray-500 font-normal">
                      ({vaultLog.logs.length} log{vaultLog.logs.length !== 1 ? 's' : ''})
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 mb-3 ml-7">
                    Your role: <span className="font-medium capitalize">{vaultLog.userRole}</span>
                  </p>
                  {renderLogTable(vaultLog.logs)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/dashboard"
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
