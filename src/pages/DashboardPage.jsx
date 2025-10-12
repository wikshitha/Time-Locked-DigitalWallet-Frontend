import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";

export default function DashboardPage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Welcome, {user?.name || "User"} 👋
        </h1>

        <p className="text-gray-600 mb-6">
          Manage your secure vaults, releases, and logs in one place.
        </p>

        <div className="flex flex-col space-y-3">
          <Link
            to="/vaults"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            🔐 Manage Vaults
          </Link>

          <Link
            to="/releases"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
          >
            ⏳ View Releases
          </Link>

          <Link
            to="/logs"
            className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
          >
            📜 View Audit Logs
          </Link>
        </div>

        <button
          onClick={logout}
          className="mt-6 text-sm text-red-600 hover:text-red-800 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
