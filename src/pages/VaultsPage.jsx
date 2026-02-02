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
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function VaultsPage() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();

  const [ownedVaults, setOwnedVaults] = useState([]);
  const [participatedVaults, setParticipatedVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    inactivityPeriod: 3,
    gracePeriod: 2,
    timeLock: 7,
    approvalsRequired: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState("owned");

  // ---------------- Fetch Vaults ----------------
  useEffect(() => {
    const fetchVaults = async () => {
      setLoading(true);
      try {
        const res = await API.get("/api/vaults", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOwnedVaults(res.data.ownedVaults || []);
        setParticipatedVaults(res.data.participatedVaults || []);
      } catch (err) {
        console.error("Error fetching vaults:", err);
        toast.error("Failed to fetch vaults.");
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
    setMessage(null);
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
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOwnedVaults([res.data.vault, ...ownedVaults]);
      setForm({
        title: "",
        description: "",
        inactivityPeriod: 3,
        gracePeriod: 2,
        timeLock: 7,
        approvalsRequired: 1,
      });
      toast.success("Vault created successfully!");
      setShowCreateForm(false);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message;
      toast.error(`Failed to create vault: ${errorMessage}`);
      setMessage({
        type: "error",
        text: `Failed to create vault: ${errorMessage}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------- Delete Vault ----------------
  const handleDeleteVault = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vault? This action cannot be undone.")) return;
    
    try {
      await API.delete(`/api/vaults/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOwnedVaults((prev) => prev.filter((v) => v._id !== id));
      toast.success("Vault deleted successfully!");
    } catch (err) {
      toast.error("Failed to delete vault.");
    }
  };

  const renderVaultCard = (vault, isOwner) => (
    <div
      key={vault._id}
      className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 transition-all duration-300 hover:border-[#ffeb00]/80 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#ffeb00]/10"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-bold text-lg sm:text-xl text-white group-hover:text-[#ffeb00] transition-colors break-words flex-1">
            {vault.title}
          </h3>
          <span
            className={`text-[10px] sm:text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
              isOwner
                ? "bg-[#ffeb00] text-[#000957]"
                : "bg-white/10 text-white/80 border border-white/20"
            }`}
          >
            {isOwner ? "Owner" : vault.participants?.find(p => p.participantId?._id === user?._id)?.role || "Member"}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-white/70 mt-2 h-10 overflow-hidden leading-relaxed">
          {vault.description || "No description provided."}
        </p>
      </div>
      <div className="mt-2 px-5 sm:px-6 pb-4 sm:pb-5 border-t border-white/10 pt-4 flex items-center justify-between gap-2">
        <p className="text-[10px] sm:text-xs text-white/60">
          {isOwner ? (
            `Created: ${new Date(vault.createdAt).toLocaleDateString()}`
          ) : (
            <span className="flex items-center gap-1.5">
              <UserGroupIcon className="w-3 h-3" />
              Owner: {vault.ownerId?.firstName}
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/vaults/${vault._id}`)}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#ffeb00] bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <EyeIcon className="w-4 h-4" />
            View
          </button>
          {isOwner && (
            <button
              onClick={() => handleDeleteVault(vault._id)}
              className="flex items-center justify-center w-8 h-8 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ---------------- Render ----------------
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#000957] via-[#1a2470] to-[#344cb7] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#000957]/80 via-[#1a2470]/80 to-[#000957]/80 backdrop-blur-xl shadow-2xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-sm font-bold text-[#ffeb00] hover:text-white transition-colors group"
            >
              <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/20 transition-colors">
                <ChevronLeftIcon className="w-5 h-5" />
              </div>
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r from-white via-[#ffeb00] to-white bg-clip-text text-transparent">
              Vault Manager
            </h1>
            <div className="w-24 sm:w-32"></div> {/* Spacer */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Create Vault Section */}
        <section className="mb-8 sm:mb-12">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="w-full flex items-center justify-between p-4 sm:p-6 transition-colors hover:bg-white/5 cursor-pointer"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-[#ffeb00] to-[#ffd700] text-[#000957] p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg">
                  <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {showCreateForm ? "Close Form" : "Create a New Vault"}
                </h2>
              </div>
              <ChevronDownIcon
                className={`w-6 h-6 sm:w-7 sm:h-7 text-[#ffeb00] transition-transform duration-300 ${
                  showCreateForm ? "rotate-180" : ""
                }`}
              />
            </button>

            {showCreateForm && (
              <div className="p-4 sm:p-6 border-t border-white/10 animate-fade-in">
                {message && message.type === "error" && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg text-sm">
                    {message.text}
                  </div>
                )}
                <form onSubmit={handleCreateVault} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#ffeb00] mb-2">Title</label>
                      <input
                        type="text"
                        placeholder="e.g., Family Photos"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full bg-white/5 border-2 border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#ffeb00] focus:border-[#ffeb00] transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#ffeb00] mb-2">Description</label>
                      <input
                        type="text"
                        placeholder="Short description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full bg-white/5 border-2 border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#ffeb00] focus:border-[#ffeb00] transition"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm font-semibold text-[#ffeb00] mb-3 flex items-center gap-2">
                      <InformationCircleIcon className="w-5 h-5" />
                      Release Rules (in days)
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                      {/*
                        key: "inactivityPeriod", label: "Inactivity" },
                        { key: "gracePeriod", label: "Grace" },
                        { key: "timeLock", label: "Time Lock" },
                        { key: "approvalsRequired", label: "Approvals" },
                      */}
                      { [
                        { key: "inactivityPeriod", label: "Inactivity" },
                        { key: "gracePeriod", label: "Grace" },
                        { key: "timeLock", label: "Time Lock" },
                        { key: "approvalsRequired", label: "Approvals" },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="block text-xs font-medium text-white/80 mb-1.5">{label}</label>
                          <input
                            type="number"
                            min="1"
                            value={form[key]}
                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                            className="w-full bg-white/5 border-2 border-white/20 rounded-lg px-3 py-2 text-white text-center font-bold focus:outline-none focus:ring-2 focus:ring-[#ffeb00] focus:border-[#ffeb00] transition"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto font-bold text-[#000957] bg-gradient-to-r from-[#ffeb00] to-[#ffd700] hover:from-[#ffd700] hover:to-[#ffeb00] px-8 py-3 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-100 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-t-[#000957] border-r-[#000957] border-b-[#000957]/30 border-l-[#000957]/30 rounded-full animate-spin"></div>
                          Creating...
                        </>
                      ) : (
                        "Create Vault"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* Vaults List Section */}
        <section>
          {/* Tabs */}
          <div className="flex items-center border-b border-white/10 mb-6 sm:mb-8">
            <button
              onClick={() => setActiveTab("owned")}
              className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all cursor-pointer ${
                activeTab === "owned"
                  ? "text-[#ffeb00] border-b-2 border-[#ffeb00]"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <LockClosedIcon className="w-5 h-5" />
              My Vaults
              <span className="bg-white/10 text-white/80 text-xs font-bold px-2 py-0.5 rounded-full">
                {ownedVaults.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("participating")}
              className={`flex items-center gap-2 px-4 py-3 font-semibold transition-all cursor-pointer ${
                activeTab === "participating"
                  ? "text-[#ffeb00] border-b-2 border-[#ffeb00]"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <UserGroupIcon className="w-5 h-5" />
              Participating
              <span className="bg-white/10 text-white/80 text-xs font-bold px-2 py-0.5 rounded-full cursor-po">
                {participatedVaults.length}
              </span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-16">
              <div className="w-12 h-12 border-4 border-t-[#ffeb00] border-r-[#ffeb00] border-b-[#ffeb00]/30 border-l-[#ffeb00]/30 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="animate-fade-in">
              {activeTab === "owned" && (
                ownedVaults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {ownedVaults.map((vault) => renderVaultCard(vault, true))}
                  </div>
                ) : (
                  <div className="text-center py-12 px-6 bg-white/5 rounded-2xl border border-dashed border-white/20">
                    <p className="text-lg font-semibold text-white/90">You haven't created any vaults yet.</p>
                    <p className="text-sm text-white/60 mt-2">Click "Create a New Vault" above to get started.</p>
                  </div>
                )
              )}
              {activeTab === "participating" && (
                participatedVaults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {participatedVaults.map((vault) => renderVaultCard(vault, false))}
                  </div>
                ) : (
                  <div className="text-center py-12 px-6 bg-white/5 rounded-2xl border border-dashed border-white/20">
                    <p className="text-lg font-semibold text-white/90">You are not participating in any vaults.</p>
                    <p className="text-sm text-white/60 mt-2">Vaults shared with you will appear here.</p>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
