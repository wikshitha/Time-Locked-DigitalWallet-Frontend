import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api.js";
import { useAuthStore } from "../store/useAuthStore.js";

export default function VaultsPage() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();

  const [ownedVaults, setOwnedVaults] = useState([]);
  const [participatedVaults, setParticipatedVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    inactivityPeriod: 3,
    gracePeriod: 2,
    timeLock: 7,
    approvalsRequired: 1,
  });

  // ---------------- Fetch Vaults ----------------
  useEffect(() => {
    const fetchVaults = async () => {
      try {
        const res = await API.get("/api/vaults", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOwnedVaults(res.data.ownedVaults || []);
        setParticipatedVaults(res.data.participatedVaults || []);
      } catch (err) {
        console.error("Error fetching vaults:", err);
        setMessage("❌ Failed to fetch vaults");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchVaults();
  }, [token]);

  // ---------------- Create Vault ----------------
  const handleCreateVault = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post(
        "/api/vaults",
        {
          title: form.title,
          description: form.description,
          ruleSet: {
            inactivityPeriod: Number(form.inactivityPeriod),
            gracePeriod: Number(form.gracePeriod),
            timeLock: Number(form.timeLock),
            approvalsRequired: Number(form.approvalsRequired),
          },
          sealedKeys: [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOwnedVaults([...ownedVaults, res.data.vault]);
      setForm({
        title: "",
        description: "",
        inactivityPeriod: 3,
        gracePeriod: 2,
        timeLock: 7,
        approvalsRequired: 1,
      });
      setMessage("✅ Vault created successfully!");
    } catch (err) {
      console.error("Create vault error:", err);
      setMessage("❌ Failed to create vault: " + (err.response?.data?.error || err.message));
    }
  };

  // ---------------- Delete Vault ----------------
  const handleDeleteVault = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vault?")) return;
    try {
      await API.delete(`/api/vaults/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOwnedVaults((prev) => prev.filter((v) => v._id !== id));
      setMessage("🗑️ Vault deleted successfully");
    } catch (err) {
      console.error("Delete vault error:", err);
      setMessage("❌ Failed to delete vault: " + (err.response?.data?.message || ""));
    }
  };

  // ---------------- Render ----------------
  if (loading)
    return <div className="text-center text-gray-500 mt-10">Loading vaults...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">My Vaults Dashboard</h1>

        {message && <p className="mb-3 text-sm text-gray-600">{message}</p>}

        {/* Create Vault Form - All users can create vaults */}
        <form onSubmit={handleCreateVault} className="mb-6 space-y-3 border-b pb-6">
          <h2 className="text-xl font-semibold text-gray-700">Create New Vault</h2>
          <input
            type="text"
            placeholder="Vault Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border p-2 rounded"
            required
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border p-2 rounded"
          ></textarea>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <input
              type="number"
              placeholder="Inactivity (days)"
              value={form.inactivityPeriod}
              onChange={(e) =>
                setForm({ ...form, inactivityPeriod: e.target.value })
              }
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Grace Period (days)"
              value={form.gracePeriod}
              onChange={(e) =>
                setForm({ ...form, gracePeriod: e.target.value })
              }
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Time Lock (days)"
              value={form.timeLock}
              onChange={(e) =>
                setForm({ ...form, timeLock: e.target.value })
              }
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Approvals Needed"
              value={form.approvalsRequired}
              onChange={(e) =>
                setForm({ ...form, approvalsRequired: e.target.value })
              }
              className="border p-2 rounded"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
          >
            Create Vault
          </button>
        </form>

        {/* My Vaults (Owned) Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            📁 My Vaults ({ownedVaults.length})
          </h2>
          {ownedVaults.length === 0 ? (
            <p className="text-gray-500 text-sm">You haven't created any vaults yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200 border rounded-lg">
              {ownedVaults.map((vault) => (
                <li
                  key={vault._id}
                  className="py-4 px-4 flex justify-between items-center hover:bg-gray-50"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{vault.title}</p>
                    <p className="text-gray-500 text-sm">{vault.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Created: {new Date(vault.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/vaults/${vault._id}`)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteVault(vault._id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Participated Vaults Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            🤝 Vaults I Participate In ({participatedVaults.length})
          </h2>
          {participatedVaults.length === 0 ? (
            <p className="text-gray-500 text-sm">
              You are not participating in any vaults yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 border rounded-lg">
              {participatedVaults.map((vault) => {
                // Find user's role in this vault
                const myParticipation = vault.participants?.find(
                  (p) => p.participantId?._id === user?._id
                );
                const myRole = myParticipation?.role || "participant";

                return (
                  <li
                    key={vault._id}
                    className="py-4 px-4 flex justify-between items-center hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{vault.title}</p>
                      <p className="text-gray-500 text-sm">{vault.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Owner: {vault.ownerId?.firstName} {vault.ownerId?.lastName} •{" "}
                        My Role: <span className="font-medium capitalize">{myRole}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/vaults/${vault._id}`)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
