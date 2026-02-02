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
    <div className="min-h-screen w-full bg-gradient-to-br from-[#000957] via-[#1a2470] to-[#344cb7] text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#ffeb00]/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#344cb7]/10 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-[#ffeb00]/3 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#000957]/95 via-[#1a2470]/95 to-[#000957]/95 backdrop-blur-xl shadow-2xl border-b-2 border-[#ffeb00]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 lg:h-24">
            {/* Logo and Title */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-[#ffeb00] to-[#ffd700] text-[#000957] px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 rounded-xl shadow-2xl font-black text-sm sm:text-base lg:text-lg animate-pulse">
                🔐 LegacyLock
              </div>
              <h1 className="hidden sm:block text-lg sm:text-xl lg:text-2xl font-black bg-gradient-to-r from-white via-[#ffeb00] to-white bg-clip-text text-transparent">
                Dashboard
              </h1>
            </div>

            {/* User Info and Logout */}
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-white font-bold text-sm lg:text-base">👤 {user?.firstName || "User"}</span>
                <span className="text-[#ffeb00]/80 text-xs font-medium">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 sm:gap-2 bg-white/10 hover:bg-gradient-to-r hover:from-[#ffeb00] hover:to-[#ffd700] hover:text-[#000957] active:scale-95 transition-all px-3 py-2 sm:px-4 sm:py-2.5 lg:px-5 lg:py-3 rounded-xl border-2 border-[#ffeb00]/50 hover:border-[#ffeb00] font-bold shadow-lg text-xs sm:text-sm lg:text-base group"
              >
                <ArrowRightEndOnRectangleIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Welcome Section */}
        <div className="mb-8 sm:mb-10 lg:mb-12 animate-fade-in-up">
          <div className="bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 border-2 border-[#ffeb00]/30 shadow-2xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 sm:mb-3">
              Welcome back, <span className="text-[#ffeb00]">{user?.firstName}!</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-white/80 font-medium leading-relaxed">
              Securely manage your digital legacy with <span className="text-[#ffeb00] font-bold">encrypted vaults</span>, 
              <span className="text-[#ffeb00] font-bold"> time-locked releases</span>, and 
              <span className="text-[#ffeb00] font-bold"> complete audit visibility</span>.
            </p>
          </div>
        </div>

        {/* Pending Actions Section */}
        {!loading && (pendingApprovals.length > 0 || revokableReleases.length > 0) && (
          <div className="mb-8 sm:mb-10 lg:mb-12 space-y-6 sm:space-y-8 animate-fade-in-up" style={{animationDelay: '200ms'}}>
            {/* Pending Approvals */}
            {pendingApprovals.length > 0 && (
              <div className="bg-gradient-to-br from-[#ffeb00]/20 via-[#ffeb00]/10 to-transparent backdrop-blur-xl border-3 border-[#ffeb00] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl hover:shadow-[0_0_50px_rgba(255,235,0,0.3)] transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-gradient-to-br from-[#ffeb00] to-[#ffd700] text-[#000957] p-3 rounded-2xl shadow-2xl animate-bounce-slow shrink-0">
                    <ExclamationTriangleIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#ffeb00] flex items-center gap-2 flex-wrap">
                      ⚠️ Action Required
                      <span className="inline-flex items-center justify-center bg-[#000957] text-[#ffeb00] px-3 py-1 rounded-xl text-base sm:text-lg font-black border-2 border-[#ffeb00]">
                        {pendingApprovals.length}
                      </span>
                    </h2>
                    <p className="text-white/90 mt-2 text-sm sm:text-base lg:text-lg font-medium">
                      The following releases need your approval as a witness.
                    </p>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {pendingApprovals.map((release, index) => (
                    <div
                      key={release._id}
                      className="bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl border-2 border-white/30 hover:border-[#ffeb00] transition-all animate-fade-in-up"
                      style={{animationDelay: `${index * 100}ms`}}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-white flex items-start gap-2">
                            <span className="text-[#ffeb00]">🔐</span>
                            <span className="break-words">{release.vaultId?.title || "Unnamed Vault"}</span>
                          </h3>
                          <p className="text-sm sm:text-base text-white/90 font-medium leading-relaxed">
                            ⏰ Grace period ended. Owner has been inactive for the specified period.
                          </p>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-white/70">
                            <span className="bg-[#ffeb00]/20 px-3 py-1 rounded-lg font-bold text-[#ffeb00]">
                              Your role: <span className="capitalize">{release.participantRole}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
                          <button
                            onClick={() => handleApprove(release._id, release.vaultId?._id)}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 rounded-xl shadow-xl transition-all transform hover:scale-105 active:scale-95 text-sm sm:text-base"
                          >
                            <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(release._id, release.vaultId?._id)}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 rounded-xl shadow-xl transition-all transform hover:scale-105 active:scale-95 text-sm sm:text-base"
                          >
                            <XCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
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
              <div className="bg-gradient-to-br from-[#344cb7]/30 via-[#1a2470]/20 to-transparent backdrop-blur-xl border-3 border-[#344cb7] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl hover:shadow-[0_0_50px_rgba(52,76,183,0.3)] transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-gradient-to-br from-[#ffeb00] to-[#ffd700] text-[#000957] p-3 rounded-2xl shadow-2xl animate-bounce-slow shrink-0">
                    <ClockIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-2 flex-wrap">
                      ⏳ Grace Period Active
                      <span className="inline-flex items-center justify-center bg-[#ffeb00] text-[#000957] px-3 py-1 rounded-xl text-base sm:text-lg font-black">
                        {revokableReleases.length}
                      </span>
                    </h2>
                    <p className="text-white/90 mt-2 text-sm sm:text-base lg:text-lg font-medium">
                      You can revoke these releases during the grace period if you're still active.
                    </p>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {revokableReleases.map((release, index) => (
                    <div
                      key={release._id}
                      className="bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl border-2 border-white/30 hover:border-[#ffeb00] transition-all animate-fade-in-up"
                      style={{animationDelay: `${index * 100}ms`}}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-white flex items-start gap-2">
                            <span className="text-[#ffeb00]">🔐</span>
                            <span className="break-words">{release.vaultId?.title || "Unnamed Vault"}</span>
                          </h3>
                          <p className="text-sm sm:text-base text-white/90 font-medium leading-relaxed">
                            📢 Release triggered due to inactivity. Currently in grace period.
                          </p>
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <span className="bg-[#ffeb00]/20 px-3 py-1.5 rounded-lg font-bold text-[#ffeb00]">
                              Ends: {new Date(release.gracePeriodEnd).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <button
                            onClick={() => handleRevoke(release._id, release.vaultId?._id, release.vaultId?.title)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 rounded-xl shadow-xl transition-all transform hover:scale-105 active:scale-95 text-sm sm:text-base"
                          >
                            <XCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
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

        {/* Quick Actions Grid */}
        <div className="animate-fade-in-up" style={{animationDelay: '400ms'}}>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white flex items-center gap-3">
              <span className="text-[#ffeb00]">⚡</span>
              Quick Actions
            </h2>
            <p className="text-sm sm:text-base text-white/70 mt-2">Navigate to key features and manage your digital legacy</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {menuItems.map((item, index) => (
              <Link to={item.link} key={item.title} className="group">
                <div 
                  className="relative bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl hover:shadow-[0_0_40px_rgba(255,235,0,0.4)] transition-all border-2 border-white/20 hover:border-[#ffeb00] overflow-hidden h-full flex flex-col transform hover:scale-105 hover:-translate-y-2 animate-fade-in-up"
                  style={{animationDelay: `${(index + 1) * 100}ms`}}
                >
                  {/* Gradient Accent Bar */}
                  <div className={`h-1.5 sm:h-2 w-full bg-gradient-to-r ${item.color} group-hover:h-3 transition-all`}></div>
                  
                  {/* Card Content */}
                  <div className="p-5 sm:p-6 lg:p-8 flex flex-col flex-grow">
                    {/* Icon */}
                    <div className="flex justify-center mb-4 sm:mb-6">
                      <div className={`p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${item.color} shadow-2xl group-hover:scale-110 group-hover:rotate-6 transform transition-all duration-300`}>
                        <item.icon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black mb-2 sm:mb-3 text-white group-hover:text-[#ffeb00] transition-colors text-center">
                      {item.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-xs sm:text-sm lg:text-base text-white/80 group-hover:text-white/90 flex-grow leading-relaxed text-center px-2">
                      {item.description}
                    </p>
                    
                    {/* CTA */}
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/20 group-hover:border-[#ffeb00]/50 transition-colors">
                      <div className="flex items-center justify-center gap-2 text-sm sm:text-base font-bold text-[#ffeb00] group-hover:text-white transition-colors">
                        <span>Explore</span>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#ffeb00]/0 to-[#ffeb00]/0 group-hover:from-[#ffeb00]/10 group-hover:to-transparent transition-all pointer-events-none"></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-12 sm:mt-16 lg:mt-20 py-6 sm:py-8 lg:py-10 text-center border-t-2 border-[#ffeb00]/20 bg-gradient-to-r from-[#000957]/80 via-[#1a2470]/80 to-[#000957]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-3 sm:mb-4">
            <p className="text-base sm:text-lg lg:text-xl font-black text-white flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-[#ffeb00]">🔒</span>
              Secure
              <span className="text-white/50">•</span>
              <span className="text-[#ffeb00]">🔐</span>
              Encrypted
              <span className="text-white/50">•</span>
              <span className="text-[#ffeb00]">⏱️</span>
              Time-Locked
            </p>
          </div>
          <div className="bg-gradient-to-r from-[#ffeb00] via-white to-[#ffeb00] bg-clip-text text-transparent">
            <p className="text-sm sm:text-base lg:text-lg font-black">
              LegacyLock - Protecting Your Digital Legacy
            </p>
          </div>
          <p className="text-xs sm:text-sm text-white/60 mt-2 sm:mt-3">
            © 2026 All rights reserved. Your data, encrypted and secured.
          </p>
        </div>
      </footer>
    </div>
  );
}
