// src/pages/ReleaseReviewPage.jsx
import { useEffect, useState } from "react";
import API from "../utils/api.js";
import { useAuthStore } from "../store/useAuthStore.js";

export default function ReleaseReviewPage() {
  const { token, user } = useAuthStore();
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetchReleases = async () => {
      setLoading(true);
      try {
        const res = await API.get("/api/releases", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReleases(res.data.releases || res.data); // handle both shapes
      } catch (err) {
        console.error("Error fetching releases", err);
        setMsg("Failed to load releases");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchReleases();
  }, [token]);

  const handleDecision = async (releaseId, decision) => {
    try {
      setMsg("");
      const res = await API.post(
        "/api/releases/confirm",
        { releaseId, status: decision, comment: `${user.firstName} ${decision}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg(res.data.message || "Done");
      // refresh
      const refreshed = await API.get("/api/releases", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReleases(refreshed.data.releases || refreshed.data);
    } catch (err) {
      console.error("Decision error", err);
      setMsg(err.response?.data?.message || "Error sending decision");
    }
  };

  if (loading) return <div>Loading releases...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Releases requiring your attention</h1>
      {msg && <div className="mb-3 text-sm text-red-600">{msg}</div>}
      {releases.length === 0 ? (
        <div>No releases to review.</div>
      ) : (
        <ul className="space-y-4">
          {releases.map((r) => (
            <li key={r._id} className="p-4 border rounded">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{r.vaultId?.title || "Vault"}</div>
                  <div className="text-sm text-gray-600">Status: {r.status}</div>
                  <div className="text-sm text-gray-600">
                    Triggered: {new Date(r.triggeredAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDecision(r._id, "approved")}
                    className="px-3 py-1 bg-green-600 text-white rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecision(r._id, "rejected")}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
