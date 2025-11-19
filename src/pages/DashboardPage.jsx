import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import {
  ShieldCheckIcon,
  ClockIcon,
  DocumentTextIcon,
  ArrowRightEndOnRectangleIcon,
} from "@heroicons/react/24/outline";

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

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
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-indigo-50 to-pink-50 text-gray-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-extrabold tracking-wide flex items-center gap-2">
            <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-semibold">Vault</span>
            <span className="">Dashboard</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-white/90 font-medium">{user?.firstName || "User"}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 active:scale-[0.97] transition-all px-4 py-2 rounded-lg border border-white/20 font-semibold"
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
          <p className="text-lg md:text-xl text-gray-600 font-medium">
            Securely manage vaults, releases & audit visibility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {menuItems.map((item) => (
            <Link to={item.link} key={item.title}>
              <div className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-200 overflow-hidden h-full flex flex-col">
                {/* Accent Bar */}
                <div className={`h-1 w-full bg-gradient-to-r ${item.color}`}></div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-center mb-4">
                    <div className={`p-4 rounded-xl bg-gradient-to-br ${item.color} shadow-md group-hover:scale-105 transform transition-transform`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-gray-800">
                    {item.title}
                  </h2>
                  <p className="text-sm text-gray-600 flex-grow">
                    {item.description}
                  </p>
                  <div className="mt-5">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:text-indigo-600 transition-colors">
                      Go to {item.title.split(" ")[0]} →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats Placeholder (Future enhancement) */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {["Vaults", "Releases", "Approvals", "Logs"].map((label) => (
            <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col">
              <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{label}</span>
              <span className="mt-2 text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text select-none">—</span>
              <span className="mt-1 text-xs text-gray-400">Coming soon</span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500">
        <p>Secure • Encrypted • Time-Locked</p>
      </footer>
    </div>
  );
}
