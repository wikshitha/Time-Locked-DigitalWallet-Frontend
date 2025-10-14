import { useEffect, useState } from "react";
import API from "../utils/api.js";
import { useAuthStore } from "../store/useAuthStore.js";

export default function ReleaseReviewPage() {
  const { token } = useAuthStore();
  const [releases, setReleases] = useState([]);
  const [message, setMessage] = useState("");

  const fetchReleases = async () => {
    try {
      const res = await API.get("/api/releases/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReleases(res.data);
    } catch (err) {
      console.error("Error fetching releases:", err);
      setMessage("❌ Failed to load pending releases");
    }
  };

  useEffect(() => {
    if (token) fetchReleases();
  }, [token]);

  const handleDecision = async (releaseId, status) => {
    try {
      await API.post(
        "/api/releases/confirm",
        { releaseId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`✅ Release ${status} successfully!`);
      fetchReleases();
    } catch (err) {
      console.error("Decision failed:", err);
      setMessage("❌ Failed to record decision");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          🔍 Release Review Dashboard
        </h1>

        {message && <p className="text-sm mb-3 text-blue-600">{message}</p>}

        {releases.length === 0 ? (
          <p className="text-gray-500">No pending releases right now.</p>
        ) : (
          <ul className="space-y-4">
            {releases.map((r) => (
              <li
                key={r._id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {r.vaultId?.name || "Unnamed Vault"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: {r.status} | Approvals:{" "}
                    {r.approvalsReceived}/{r.approvalsNeeded}
                  </p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleDecision(r._id, "approved")}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleDecision(r._id, "rejected")}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    ❌ Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
