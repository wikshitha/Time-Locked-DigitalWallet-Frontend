import { useState, useEffect } from "react";
import API from "../utils/api.js";
import { useAuthStore } from "../store/useAuthStore.js";

export default function VaultsPage() {
  const { token } = useAuthStore();
  const [vaults, setVaults] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    inactivityPeriod: "",
    gracePeriod: "",
    timeLock: "",
    approvalsRequired: 1,
  });
  const [editingVault, setEditingVault] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch user's vaults
  const fetchVaults = async () => {
    try {
      const res = await API.get("/api/vaults", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVaults(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch vaults");
    }
  };

  useEffect(() => {
    if (token) fetchVaults();
  }, [token]);

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Create or Update Vault
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const ruleSet = {
      inactivityPeriod: Number(form.inactivityPeriod),
      gracePeriod: Number(form.gracePeriod),
      timeLock: Number(form.timeLock),
      approvalsRequired: Number(form.approvalsRequired),
    };

    const payload = {
      title: form.title,
      description: form.description,
      ruleSet,
      sealedKeys: [],
    };

    try {
      if (editingVault) {
        // Update existing vault
        await API.put(`/api/vaults/${editingVault._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Create new vault
        await API.post("/api/vaults", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setForm({
        title: "",
        description: "",
        inactivityPeriod: "",
        gracePeriod: "",
        timeLock: "",
        approvalsRequired: 1,
      });
      setEditingVault(null);
      fetchVaults();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to save vault");
    } finally {
      setLoading(false);
    }
  };

  // Edit vault
  const handleEdit = (vault) => {
    setEditingVault(vault);
    setForm({
      title: vault.title,
      description: vault.description,
      inactivityPeriod: vault.ruleSetId?.inactivityPeriod || "",
      gracePeriod: vault.ruleSetId?.gracePeriod || "",
      timeLock: vault.ruleSetId?.timeLock || "",
      approvalsRequired: vault.ruleSetId?.approvalsRequired || 1,
    });
  };

  // Delete vault
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vault?")) return;

    try {
      await API.delete(`/api/vaults/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchVaults();
    } catch (err) {
      console.error(err);
      setError("Failed to delete vault");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 text-center">
          {editingVault ? "Edit Vault" : "Create New Vault"}
        </h1>

        {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="title"
            placeholder="Vault Title"
            value={form.title}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
          <input
            type="text"
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
          <input
            type="number"
            name="inactivityPeriod"
            placeholder="Inactivity Period (days)"
            value={form.inactivityPeriod}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
          <input
            type="number"
            name="gracePeriod"
            placeholder="Grace Period (days)"
            value={form.gracePeriod}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
          <input
            type="number"
            name="timeLock"
            placeholder="Time Lock (days)"
            value={form.timeLock}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
          <input
            type="number"
            name="approvalsRequired"
            placeholder="Approvals Required"
            value={form.approvalsRequired}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            min="1"
          />

          <div className="md:col-span-2 flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : editingVault ? "Update Vault" : "Create Vault"}
            </button>
            {editingVault && (
              <button
                type="button"
                onClick={() => {
                  setEditingVault(null);
                  setForm({
                    title: "",
                    description: "",
                    inactivityPeriod: "",
                    gracePeriod: "",
                    timeLock: "",
                    approvalsRequired: 1,
                  });
                }}
                className="ml-4 bg-gray-300 text-gray-800 py-2 px-6 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="max-w-5xl mx-auto mt-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">My Vaults</h2>

        {vaults.length === 0 ? (
          <p className="text-gray-500">No vaults found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vaults.map((v) => (
              <div key={v._id} className="bg-white p-4 rounded-lg shadow border">
                <h3 className="font-semibold text-lg">{v.title}</h3>
                <p className="text-gray-600 mb-2">{v.description || "No description"}</p>
                <div className="text-sm text-gray-500 mb-3">
                  <p>Inactivity: {v.ruleSetId?.inactivityPeriod} days</p>
                  <p>Grace Period: {v.ruleSetId?.gracePeriod} days</p>
                  <p>Time Lock: {v.ruleSetId?.timeLock} days</p>
                  <p>Approvals: {v.ruleSetId?.approvalsRequired}</p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => handleEdit(v)}
                    className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(v._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
