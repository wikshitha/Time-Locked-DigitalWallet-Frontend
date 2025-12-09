import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../utils/api.js";
import { useAuthStore } from "../store/useAuthStore.js";
import {
  PlusIcon,
  ChevronLeftIcon,
  EyeIcon,
  TrashIcon,
  LockClosedIcon,
  UserGroupIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setMessage({ type: "error", text: "Failed to fetch vaults" });
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchVaults();
  }, [token]);

  // ---------------- Create Vault ----------------
  const handleCreateVault = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");
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
      toast.success("Vault created successfully!");
      setMessage({ type: "success", text: "Vault created successfully!" });
    } catch (err) {
      console.error("Create vault error:", err);
      toast.error("Failed to create vault: " );
      setMessage({
        type: "error",
        text: "Failed to create vault: " + (err.response?.data?.error || err.message),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------- Delete Vault ----------------
  const handleDeleteVault = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vault? This action cannot be undone.")) return;
    setMessage("");

    try {
      await API.delete(`/api/vaults/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOwnedVaults((prev) => prev.filter((v) => v._id !== id));
      toast.success("Vault deleted successfully!");
      setMessage({ type: "success", text: "Vault deleted successfully" });
    } catch (err) {
      console.error("Delete vault error:", err);
      toast.error("Failed to delete vault: ");
      setMessage({
        type: "error",
        text: "Failed to delete vault: " + (err.response?.data?.message || ""),
      });
    }
  };

  const renderVaultCard = (vault, isOwner) => (
    <div
      key={vault._id}
      className="group relative backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:bg-white/10 hover:border-cyan-400/50"
    >
      <div className="flex flex-col h-full">
        <div className="flex-grow">
          <h3 className="font-bold text-lg text-white truncate">{vault.title}</h3>
          <p className="text-sm text-white/60 mt-1 h-10 overflow-hidden">
            {vault.description || "No description provided."}
          </p>
          <div className="text-xs text-white/40 mt-3">
            {isOwner ? (
              `Created: ${new Date(vault.createdAt).toLocaleDateString()}`
            ) : (
              <>
                Owner: {vault.ownerId?.firstName} {vault.ownerId?.lastName}
                <br />
                My Role:{" "}
                <span className="font-medium capitalize text-cyan-400">
                  {vault.participants?.find(p => p.participantId?._id === user?._id)?.role || "participant"}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 flex justify-end items-center gap-2">
          <button
            onClick={() => navigate(`/vaults/${vault._id}`)}
            className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
          >
            <EyeIcon className="w-4 h-4" />
            View
          </button>
          {isOwner && (
            <button
              onClick={() => handleDeleteVault(vault._id)}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-400 font-semibold transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ---------------- Render ----------------
  return (
    <div className="min-h-screen w-full bg-slate-50 text-gray-900">
      {/* Header */}
  <header className="bg-white backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-wide flex items-center gap-2 text-gray-800">
            <span className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-lg text-sm shadow">Vaults</span>
            <span className="text-gray-700 font-semibold">Manager</span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Create Vault Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 sticky top-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <PlusIcon className="w-6 h-6 text-blue-600" />
              Create New Vault
            </h2>
            {message && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message.text}
              </div>
            )}
            <form onSubmit={handleCreateVault} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Title</label>
                <input
                  type="text"
                  placeholder="Vault Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
                <textarea
                  placeholder="Short description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
                  rows="3"
                ></textarea>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-1">
                  <InformationCircleIcon className="w-4 h-4 text-indigo-500" /> Release Rules (days)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {["inactivityPeriod", "gracePeriod", "timeLock", "approvalsRequired"].map((key) => (
                    <div key={key}>
                      <label className="block text-[10px] font-medium text-gray-500 mb-1 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-md px-2 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-lg font-semibold text-white shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isSubmitting ? "Creating..." : "Create Vault"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Vault Lists */}
        <div className="lg:col-span-2 space-y-10">
          {/* Owned Vaults */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <LockClosedIcon className="w-6 h-6 text-blue-600" /> My Vaults
                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                  {ownedVaults.length}
                </span>
              </h2>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : ownedVaults.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center bg-white">
                <p className="text-sm text-gray-700 font-medium">You haven't created any vaults yet.</p>
                <p className="text-xs text-gray-500 mt-1">Create one using the form on the left.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {ownedVaults.map((vault) => (
                  <div
                    key={vault._id}
                    className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition p-5 flex flex-col"
                  >
                    <h3 className="font-semibold text-gray-900 truncate tracking-wide">{vault.title}</h3>
                    <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                      {vault.description || "No description provided."}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-3">Created: {new Date(vault.createdAt).toLocaleDateString()}</p>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-3">
                      <button
                        onClick={() => navigate(`/vaults/${vault._id}`)}
                        className="text-sm font-semibold text-blue-600 hover:text-indigo-600 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      >
                        <EyeIcon className="w-4 h-4" /> View
                      </button>
                      <button
                        onClick={() => handleDeleteVault(vault._id)}
                        className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                      >
                        <TrashIcon className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Participated Vaults */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserGroupIcon className="w-6 h-6 text-indigo-600" /> Participating
                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                  {participatedVaults.length}
                </span>
              </h2>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : participatedVaults.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center bg-white">
                <p className="text-sm text-gray-700 font-medium">You are not participating in any vaults yet.</p>
                <p className="text-xs text-gray-500 mt-1">You will see vaults you are invited to here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {participatedVaults.map((vault) => (
                  <div
                    key={vault._id}
                    className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition p-5 flex flex-col"
                  >
                    <h3 className="font-semibold text-gray-900 truncate tracking-wide">{vault.title}</h3>
                    <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                      {vault.description || "No description provided."}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-3">
                      Owner: {vault.ownerId?.firstName} {vault.ownerId?.lastName}
                      <br />
                      My Role:{" "}
                      <span className="font-medium capitalize text-indigo-600">
                        {vault.participants?.find(p => p.participantId?._id === user?._id)?.role || "participant"}
                      </span>
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-3">
                      <button
                        onClick={() => navigate(`/vaults/${vault._id}`)}
                        className="text-sm font-semibold text-indigo-600 hover:text-blue-600 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                      >
                        <EyeIcon className="w-4 h-4" /> View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
