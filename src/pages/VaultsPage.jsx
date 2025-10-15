import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../utils/api.js";
import { useAuthStore } from "../store/useAuthStore.js";

export default function VaultsPage() {
  const { token } = useAuthStore();
  const navigate = useNavigate();

  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingVault, setEditingVault] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    inactivityPeriod: 3,
    gracePeriod: 2,
    timeLock: 7,
    approvalsRequired: 1,
  });

  // Fetch vaults
  useEffect(() => {
    const fetchVaults = async () => {
      try {
        const res = await API.get("/api/vaults", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVaults(res.data);
      } catch (err) {
        console.error(err);
        setMessage(" Failed to fetch vaults");
      } finally {
        setLoading(false);
      }
    };
    fetchVaults();
  }, [token]);

  // Handle create vault
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
      setVaults([...vaults, res.data.vault]);
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
      console.error(err);
      setMessage(
        " Failed to create vault: " +
          (err.response?.data?.error || err.message)
      );
    }
  };

  // Handle edit
  const handleEditVault = (vault) => {
    setEditingVault(vault._id);
    setForm({
      title: vault.title,
      description: vault.description || "",
      inactivityPeriod: vault.ruleSetId?.inactivityPeriod || 3,
      gracePeriod: vault.ruleSetId?.gracePeriod || 2,
      timeLock: vault.ruleSetId?.timeLock || 7,
      approvalsRequired: vault.ruleSetId?.approvalsRequired || 1,
    });
  };

  // Handle update vault
  const handleUpdateVault = async (e) => {
    e.preventDefault();
    try {
      await API.put(
        `/api/vaults/${editingVault}`,
        {
          title: form.title,
          description: form.description,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVaults((prev) =>
        prev.map((v) =>
          v._id === editingVault ? { ...v, title: form.title, description: form.description } : v
        )
      );
      setEditingVault(null);
      setMessage("✅ Vault updated successfully!");
    } catch (err) {
      console.error(err);
      setMessage(" Update failed: " + (err.response?.data?.message || err.message));
    }
  };

  // Handle delete vault
  const handleDeleteVault = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vault?")) return;
    try {
      await API.delete(`/api/vaults/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVaults((prev) => prev.filter((v) => v._id !== id));
      setMessage("🗑️ Vault deleted successfully");
    } catch (err) {
      console.error(err);
      setMessage(" Failed to delete vault");
    }
  };

  if (loading)
    return <div className="text-center text-gray-500 mt-10">Loading vaults...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Your Vaults</h1>

        {message && <p className="mb-3 text-sm text-gray-600">{message}</p>}

        {/* Create or Edit Vault Form */}
        <form
          onSubmit={editingVault ? handleUpdateVault : handleCreateVault}
          className="mb-6 space-y-3"
        >
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

          {!editingVault && (
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
          )}

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
          >
            {editingVault ? "Update Vault" : "Create Vault"}
          </button>

          {editingVault && (
            <button
              type="button"
              onClick={() => setEditingVault(null)}
              className="text-sm text-gray-600 hover:underline mt-1"
            >
              Cancel Editing
            </button>
          )}
        </form>

        {/* Vault List */}
        {vaults.length === 0 ? (
          <p className="text-gray-500 text-sm">No vaults yet. Create one above.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {vaults.map((vault) => (
              <li
                key={vault._id}
                className="py-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-gray-800">{vault.title}</p>
                  <p className="text-gray-500 text-sm">{vault.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditVault(vault)}
                    className="text-yellow-600 hover:text-yellow-800"
                  >
                    Edit Vault
                  </button>
                  <button
                    onClick={() => handleDeleteVault(vault._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => navigate(`/vaults/${vault._id}`)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                     View
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
