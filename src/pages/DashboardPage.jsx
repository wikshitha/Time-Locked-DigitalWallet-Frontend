import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import { useEffect, useState } from "react";
import API from "../utils/api.js";
import toast from "react-hot-toast";
import {
  ShieldCheckIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowRightEndOnRectangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function DashboardPage() {
  const { user, logout, token } = useAuthStore();
  const navigate = useNavigate();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [revokableReleases, setRevokableReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingActions();
  }, [token]);

  const fetchPendingActions = async () => {
    try {
      const res = await API.get("/api/releases", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Filter releases that need user action
      const participantReleases = res.data.participantVaultReleases || [];
      const ownedReleases = res.data.ownedVaultReleases || [];
      
      // Pending approvals (for witnesses) - include both "pending" and "in_progress" statuses
      const needsApproval = participantReleases.filter(
        r => (r.status === "pending" || r.status === "in_progress") && !r.userHasConfirmed && r.gracePeriodEnded
      );
      setPendingApprovals(needsApproval);
      
      // Revokable releases (for owners during grace period) - include both statuses
      const canRevoke = ownedReleases.filter(
        r => (r.status === "pending" || r.status === "in_progress") && !r.gracePeriodEnded
      );
      setRevokableReleases(canRevoke);
    } catch (err) {
      console.error("Error fetching pending actions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (releaseId, vaultId) => {
    try {
      await API.post(
        `/api/releases/confirm`,
        {
          releaseId: releaseId,
          status: "approved",
          comment: "Approved from dashboard"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("✅ Release approved successfully!");
      fetchPendingActions(); // Refresh
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve release");
    }
  };

  const handleReject = async (releaseId, vaultId) => {
    const comment = prompt("Please provide a reason for rejection:");
    if (!comment) return;
    
    try {
      await API.post(
        `/api/releases/confirm`,
        {
          releaseId: releaseId,
          status: "rejected",
          comment
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Release rejected!");
      fetchPendingActions(); // Refresh
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject release");
    }
  };

  const handleRevoke = async (releaseId, vaultId, vaultTitle) => {
    const reason = prompt(
      `Are you sure you want to revoke the release for "${vaultTitle}"?\n\nOptional: Enter a reason for revocation:`
    );
    if (reason === null) return;

    try {
      await API.post(
        "/api/releases/revoke",
        { releaseId, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("✅ Release revoked successfully! The system will continue monitoring for inactivity.");
      fetchPendingActions(); // Refresh
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to revoke release");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    {
      title: "Manage Vaults",
      description: "Create, view, and manage your secure digital vaults.",
      link: "/vaults",
      icon: ShieldCheckIcon,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "View Releases",
      description: "Monitor the status of vault releases and approvals.",
      link: "/releases",
      icon: ClockIcon,
      color: "from-purple-500 to-indigo-500",
    },
    {
      title: "View Audit Logs",
      description: "Track all activities and access history for your vaults.",
      link: "/logs",
      icon: DocumentTextIcon,
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#000957] via-[#344cb7] to-[#000957] text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#000957] via-[#344cb7] to-[#000957] shadow-2xl border-b border-[#ffeb00]/20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <h1 className="text-xl md:text-3xl font-extrabold tracking-wide flex items-center gap-3">
            <div className="bg-[#ffeb00] text-[#000957] px-4 py-2 rounded-xl shadow-lg font-black">
              LegacyLock
            </div>
            <span className="bg-gradient-to-r from-white to-[#ffeb00] bg-clip-text text-transparent">Dashboard</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-[#ffeb00] font-bold text-lg">{user?.firstName || "User"}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/10 hover:bg-[#ffeb00] hover:text-[#000957] active:scale-95 transition-all px-5 py-2.5 rounded-xl border-2 border-[#ffeb00] font-bold shadow-lg"
            >
              <ArrowRightEndOnRectangleIcon className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="mb-10 text-center">
          <p className="text-xl md:text-2xl text-white/90 font-medium">
            Securely manage vaults, releases & audit visibility.
          </p>
        </div>

        {/* Pending Actions Section */}
        {!loading && (pendingApprovals.length > 0 || revokableReleases.length > 0) && (
          <div className="mb-8 space-y-6">
            {/* Pending Approvals */}
            {pendingApprovals.length > 0 && (
              <div className="bg-gradient-to-br from-[#ffeb00]/20 to-[#ffeb00]/5 backdrop-blur-xl border-2 border-[#ffeb00] rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-[#ffeb00] text-[#000957] p-3 rounded-xl">
                    <ExclamationTriangleIcon className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-[#ffeb00]">
                    Action Required: Pending Approvals ({pendingApprovals.length})
                  </h2>
                </div>
                <p className="text-white/90 mb-4 text-lg">
                  The following releases need your approval as a witness.
                </p>
                <div className="space-y-4">
                  {pendingApprovals.map((release) => (
                    <div
                      key={release._id}
                      className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 hover:border-[#ffeb00] transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-[#ffeb00] mb-2">
                            {release.vaultId?.title || "Unnamed Vault"}
                          </h3>
                          <p className="text-sm text-white/80 mb-2">
                            Grace period ended. Owner has been inactive for the specified period.
                          </p>
                          <p className="text-xs text-white/60">
                            Your role: <span className="font-bold text-[#ffeb00] capitalize">{release.participantRole}</span>
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApprove(release._id, release.vaultId?._id)}
                            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all transform hover:scale-105"
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(release._id, release.vaultId?._id)}
                            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all transform hover:scale-105"
                          >
                            <XCircleIcon className="w-5 h-5" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revokable Releases */}
            {revokableReleases.length > 0 && (
              <div className="bg-gradient-to-br from-[#344cb7]/30 to-[#000957]/20 backdrop-blur-xl border-2 border-[#344cb7] rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-[#ffeb00] text-[#000957] p-3 rounded-xl">
                    <ClockIcon className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-[#ffeb00]">
                    Grace Period Active: Revokable Releases ({revokableReleases.length})
                  </h2>
                </div>
                <p className="text-white/90 mb-4 text-lg">
                  You can revoke these releases during the grace period if you're still active.
                </p>
                <div className="space-y-4">
                  {revokableReleases.map((release) => (
                    <div
                      key={release._id}
                      className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 hover:border-[#ffeb00] transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-[#ffeb00] mb-2">
                            {release.vaultId?.title || "Unnamed Vault"}
                          </h3>
                          <p className="text-sm text-white/80 mb-2">
                            Release triggered due to inactivity. Currently in grace period.
                          </p>
                          <p className="text-xs text-white/60">
                            Grace period ends: <span className="font-bold text-[#ffeb00]">{new Date(release.gracePeriodEnd).toLocaleString()}</span>
                          </p>
                        </div>
                        <div>
                          <button
                            onClick={() => handleRevoke(release._id, release.vaultId?._id, release.vaultId?.title)}
                            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all transform hover:scale-105"
                          >
                            <XCircleIcon className="w-5 h-5" />
                            Revoke Release
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {menuItems.map((item) => (
            <Link to={item.link} key={item.title}>
              <div className="group relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl hover:shadow-[0_0_30px_rgba(255,235,0,0.3)] transition-all border-2 border-white/20 hover:border-[#ffeb00] overflow-hidden h-full flex flex-col">
                {/* Gradient Accent */}
                <div className={`h-2 w-full bg-gradient-to-r ${item.color}`}></div>
                <div className="p-8 flex flex-col flex-grow">
                  <div className="flex justify-center mb-6">
                    <div className={`p-5 rounded-2xl bg-gradient-to-br ${item.color} shadow-2xl group-hover:scale-110 transform transition-transform`}>
                      <item.icon className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-black mb-3 text-white group-hover:text-[#ffeb00] transition-colors">
                    {item.title}
                  </h2>
                  <p className="text-sm text-white/80 flex-grow leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-6">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-[#ffeb00] group-hover:text-white transition-colors">
                      Go to {item.title.split(" ")[0]} →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

       
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-white/60 border-t border-white/10">
        <p className="text-lg font-semibold">🔒 Secure • Encrypted • Time-Locked</p>
        <p className="mt-2 text-[#ffeb00]/80">LegacyLock - Protecting Your Digital Legacy</p>
      </footer>
    </div>
  );
}
