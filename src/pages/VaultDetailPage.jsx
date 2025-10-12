import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../utils/api.js";
import { useAuthStore } from "../store/useAuthStore.js";

export default function VaultDetailPage() {
  const { id } = useParams(); // vault ID from URL
  const { token } = useAuthStore();
  const [vault, setVault] = useState(null);
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch vault details
  useEffect(() => {
    const fetchVault = async () => {
      try {
        const res = await API.get(`/api/vaults`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const found = res.data.find((v) => v._id === id);
        if (found) {
          setVault(found);
          setItems(found.items || []);
        } else {
          setMessage("Vault not found");
        }
      } catch (err) {
        console.error(err);
        setMessage("Error fetching vault details");
      }
    };
    fetchVault();
  }, [id, token]);

  // Handle file upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file");

    try {
      setUploading(true);
      setMessage("");

      // Convert to base64 (simulate encryption)
      const reader = new FileReader();
      reader.onloadend = async () => {
        const encryptedData = reader.result; // base64

        const res = await API.post(
          "/api/upload",
          {
            vaultId: id,
            encKey: "temp-key",
            metadata: {
              name: file.name,
              type: file.type,
              size: file.size,
            },
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setItems((prev) => [...prev, res.data.item]);
        setMessage("✅ File uploaded successfully!");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setMessage("❌ Upload failed: " + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  if (!vault)
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        {message || "Loading vault..."}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{vault.title}</h1>
          <Link
            to="/dashboard"
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <p className="text-gray-600 mb-4">{vault.description}</p>

        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-3">Upload New Encrypted File</h2>
          <form onSubmit={handleUpload} className="flex items-center space-x-3">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="border rounded p-2 flex-1"
            />
            <button
              type="submit"
              disabled={uploading}
              className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
                uploading && "opacity-50 cursor-not-allowed"
              }`}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
          {message && (
            <p className="text-sm text-gray-600 mt-2">{message}</p>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Stored Items</h2>
          {items.length === 0 ? (
            <p className="text-gray-500">No files uploaded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {items.map((item) => (
                <li key={item._id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{item.metadata?.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.metadata?.type} — {(item.metadata?.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
