// frontend/src/pages/ReleaseDashboard.jsx
import { useEffect, useState } from "react";
import API from "../utils/api.js";
import { useAuthStore } from "../store/useAuthStore.js";

export default function ReleaseDashboard() {
  const { token } = useAuthStore();
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        const res = await API.get("/api/releases", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReleases(res.data);
      } catch (err) {
        console.error("Error fetching releases:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchReleases();

    // Refresh every 60s for live countdown
    const interval = setInterval(fetchReleases, 60000);
    return () => clearInterval(interval);
  }, [token]);

  const getCountdown = (release) => {
    const end = new Date(release.countdownEnd);
    const now = new Date();
    const diff = end - now;

    if (diff <= 0) return { text: "🔓 Released", percent: 100 };

    const total = end - new Date(release.triggeredAt);
    const percent = Math.min(100, ((total - diff) / total) * 100);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    return { text: `${days}d ${hours}h ${minutes}m remaining`, percent };
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Loading releases...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          🔐 Release Dashboard
        </h1>

        {releases.length === 0 ? (
          <p className="text-gray-500">No releases found.</p>
        ) : (
          <div className="space-y-4">
            {releases.map((release) => {
              const countdown = getCountdown(release);
              return (
                <div
                  key={release._id}
                  className="p-4 border rounded-lg shadow-sm hover:shadow-md transition bg-gray-50"
                >
                  <h2 className="text-lg font-semibold text-gray-700">
                    {release.vaultId?.name || "Unnamed Vault"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Status: {release.status}
                  </p>

                  {/* 🕒 Countdown progress for approved releases */}
                  {release.status === "approved" && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{countdown.text}</span>
                        <span>{Math.round(countdown.percent)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full">
                        <div
                          className="h-2 bg-green-500 rounded-full transition-all duration-1000"
                          style={{ width: `${countdown.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {release.status === "released" && (
                    <p className="mt-2 text-green-600 font-medium">
                      ✅ Vault Released at{" "}
                      {new Date(release.completedAt).toLocaleString()}
                    </p>
                  )}

                  {release.status === "pending" && (
                    <p className="mt-2 text-yellow-600">
                      🕓 Waiting for approvals...
                    </p>
                  )}

                  {release.status === "rejected" && (
                    <p className="mt-2 text-red-600">
                      ❌ Release rejected by a participant.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
