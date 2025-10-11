import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import API from "../utils/api.js";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout, token } = useAuthStore();
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch vaults for the logged-in user
  useEffect(() => {
    const fetchVaults = async () => {
      try {
        const res = await API.get("/api/vaults", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVaults(res.data);
      } catch (err) {
        console.error("Error fetching vaults:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVaults();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return <p className="text-center mt-10">Loading user...</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome, {user.firstName} 
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <div className="bg-white shadow rounded p-4 mb-6">
        <p>
          <span className="font-semibold">Email:</span> {user.email}
        </p>
        <p>
          <span className="font-semibold">Role:</span> {user.role}
        </p>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Your Vaults</h2>

      {loading ? (
        <p>Loading vaults...</p>
      ) : vaults.length === 0 ? (
        <p>No vaults yet. Create one to get started.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vaults.map((v) => (
            <div
              key={v._id}
              className="bg-white rounded shadow p-4 hover:shadow-lg transition"
            >
              <h3 className="text-lg font-bold text-blue-700 mb-1">
                {v.title}
              </h3>
              <p className="text-gray-600 mb-2">
                {v.description || "No description"}
              </p>
              {v.ruleSetId && (
                <p className="text-sm text-gray-500">
                  ⏱ Inactivity: {v.ruleSetId.inactivityPeriod} days • Grace:{" "}
                  {v.ruleSetId.gracePeriod} days
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
