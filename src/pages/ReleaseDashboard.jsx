// frontend/src/pages/ReleaseDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api.js";
import { useAuthStore } from "../store/useAuthStore.js";
import {
  ChevronLeftIcon,
  LockClosedIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export default function ReleaseDashboard() {
  const { token } = useAuthStore();
  const [ownedVaultReleases, setOwnedVaultReleases] = useState([]);
  const [participantVaultReleases, setParticipantVaultReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setNow] = useState(new Date()); // Used to force re-renders for countdown

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        const res = await API.get("/api/releases", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOwnedVaultReleases(res.data.ownedVaultReleases || []);
        setParticipantVaultReleases(res.data.participantVaultReleases || []);
      } catch (err) {
        console.error("Error fetching releases:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchReleases();

    // Refresh data every 60s
    const dataInterval = setInterval(fetchReleases, 60000);
    // Refresh countdown every second
    const countdownInterval = setInterval(() => setNow(new Date()), 1000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(countdownInterval);
    };
  }, [token]);

  const getCountdown = (release) => {
    if (!release.countdownEnd) return { text: "N/A", percent: 0 };
    const end = new Date(release.countdownEnd);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return { text: "Released", percent: 100 };

    const start = new Date(release.triggeredAt || release.createdAt);
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const percent = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    if (days > 0) return { text: `${days}d ${hours}h left`, percent };
    return { text: `${hours}h ${minutes}m ${seconds}s`, percent };
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "pending":
        return {
          icon: ExclamationTriangleIcon,
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/20",
          text: "Pending Approval",
        };
      case "in_progress":
        return {
          icon: ClockIcon,
          color: "text-blue-400",
          bgColor: "bg-blue-500/20",
          text: "In Progress",
        };
      case "approved":
        return {
          icon: ShieldCheckIcon,
          color: "text-cyan-400",
          bgColor: "bg-cyan-500/20",
          text: "Approved",
        };
      case "released":
        return {
          icon: CheckCircleIcon,
          color: "text-green-400",
          bgColor: "bg-green-500/20",
          text: "Released",
        };
      case "rejected":
        return {
          icon: XCircleIcon,
          color: "text-red-400",
          bgColor: "bg-red-500/20",
          text: "Rejected",
        };
      default:
        return {
          icon: ExclamationTriangleIcon,
          color: "text-gray-400",
          bgColor: "bg-gray-500/20",
          text: "Unknown",
        };
    }
  };

  const renderReleaseCard = (release) => {
    const countdown = getCountdown(release);
    const statusInfo = getStatusInfo(release.status);

    return (
      <div
        key={release._id}
        className="block bg-white/5 p-4 rounded-lg transition-all duration-300 hover:bg-white/10"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="font-bold text-white truncate flex-1">
            {release.vaultId?.title || "Unnamed Vault"}
          </h3>
          <div className={`flex items-center gap-2 text-xs font-bold px-2.5 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
            <statusInfo.icon className="w-4 h-4" />
            <span>{statusInfo.text}</span>
          </div>
        </div>

        {(release.status === "approved" || release.status === "in_progress") && release.countdownEnd && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>{countdown.text}</span>
              <span>{Math.round(countdown.percent)}%</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="h-2 bg-gradient-to-r from-cyan-500 to-green-500 rounded-full transition-all duration-1000"
                style={{ width: `${countdown.percent}%` }}
              ></div>
            </div>
          </div>
        )}

        {release.status === "released" && (
          <p className="mt-2 text-sm text-green-400 flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4" />
            Released on {new Date(release.completedAt).toLocaleDateString()}
          </p>
        )}
        
        {release.participantRole && (
          <p className="text-xs text-white/50 mt-2">
            Your role: <span className="font-medium capitalize">{release.participantRole}</span>
          </p>
        )}
      </div>
    );
  };

  const renderSection = (title, releases, icon) => {
    const Icon = icon;
    return (
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-5 sm:p-6 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
          <Icon className="w-6 h-6 text-[#ffeb00]" />
          {title} ({releases.length})
        </h2>
        {releases.length === 0 ? (
          <div className="text-center py-8 px-4 border-2 border-dashed border-white/20 rounded-lg">
            <p className="font-semibold text-white/80">No active releases found.</p>
          </div>
        ) : (
          <div className="space-y-3">{releases.map(renderReleaseCard)}</div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#000957] via-[#1a2470] to-[#344cb7] text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#000957]/80 via-[#1a2470]/80 to-[#000957]/80 backdrop-blur-xl shadow-2xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-sm font-bold text-[#ffeb00] hover:text-white transition-colors group cursor-pointer"
            >
              <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/20 transition-colors">
                <ChevronLeftIcon className="w-5 h-5" />
              </div>
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r from-white via-[#ffeb00] to-white bg-clip-text text-transparent">
              Release Dashboard
            </h1>
            <div className="w-24 sm:w-32"></div> {/* Spacer */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {loading ? (
          <div className="flex justify-center items-center p-16">
            <div className="w-12 h-12 border-4 border-t-[#ffeb00] border-r-[#ffeb00] border-b-[#ffeb00]/30 border-l-[#ffeb00]/30 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {renderSection("My Vault Releases", ownedVaultReleases, LockClosedIcon)}
            {renderSection("Participant Vault Releases", participantVaultReleases, UserGroupIcon)}
          </div>
        )}
      </main>
    </div>
  );
}
