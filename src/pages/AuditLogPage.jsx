import { useEffect, useState } from "react";
import API from "../utils/api.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { Link } from "react-router-dom";

export default function AuditLogPage() {
  const { token } = useAuthStore();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await API.get("/api/logs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLogs(res.data);
      } catch (err) {
        console.error("Error fetching logs:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchLogs();
  }, [token]);

  if (loading)
    return <div className="flex h-screen items-center justify-center text-gray-600">Loading logs...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">📜 Audit Logs</h1>

        {logs.length === 0 ? (
          <p className="text-gray-500">No logs recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border p-2 text-left">Action</th>
                  <th className="border p-2 text-left">User</th>
                  <th className="border p-2 text-left">Role</th>
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
                    <td className="border p-2">{log.user?.role || "-"}</td>
                    <td className="border p-2 text-gray-600">
                      {log.details?.vaultId
                        ? `Vault: ${log.details.vaultId}`
                        : log.details?.note || "-"}
                    </td>
                    <td className="border p-2 text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
