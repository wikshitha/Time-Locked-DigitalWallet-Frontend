import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../utils/api.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { encryptFileForVault } from "../utils/cryptoUtils.js";
import { decryptFileForVault } from "../utils/cryptoUtils.js";


export default function VaultDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuthStore();

  const [vault, setVault] = useState(null);
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  // Fetch vault details
  useEffect(() => {
    const fetchVault = async () => {
      try {
        const res = await API.get(`/api/vaults/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVault(res.data.vault);
        setItems(res.data.items || []);
      } catch (err) {
        console.error("Error fetching vault:", err);
        setMessage("❌ Failed to load vault details");
      }
    };

    if (token) fetchVault();
  }, [id, token]);

  // Handle encrypted upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file");

    try {
      setUploading(true);
      setMessage("");

      // 🔐 Encrypt the file client-side
      const { encryptedData, encKey } = await encryptFileForVault(file, id);

      // Prepare metadata
      const metadata = {
        name: file.name,
        type: file.type,
        size: file.size,
      };

      // Send to backend
      const res = await API.post(
        "/api/upload",
        {
          vaultId: id,
          encryptedData,
          encKey,
          metadata,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update UI
      setItems((prev) => [...prev, res.data.item]);
      setMessage("✅ File encrypted & uploaded successfully!");
      setFile(null);
    } catch (err) {
      console.error("Upload failed:", err);
      setMessage("❌ Upload failed: " + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  if (!vault)
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Loading vault...
      </div>
    );

    const handleDecryptDownload = async (item) => {
      try {
        setMessage(`🔄 Downloading & decrypting ${item.metadata?.name}...`);
    
        // 1️⃣ Fetch encrypted data from the server
        const res = await fetch(item.fileUrl);
        const encryptedArrayBuffer = await res.arrayBuffer();
    
        // 2️⃣ Convert ArrayBuffer → Base64 safely (chunked)
        const array = new Uint8Array(encryptedArrayBuffer);
        let binary = "";
        const chunkSize = 0x8000;
        for (let i = 0; i < array.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, array.subarray(i, i + chunkSize));
        }
        const encryptedDataB64 = btoa(binary);
    
        // 3️⃣ Decrypt with vault key
        const decryptedArrayBuffer = await decryptFileForVault(
          encryptedDataB64,
          item.encKey,
          id
        );
    
        // 4️⃣ Create blob & trigger download
        const blob = new Blob([decryptedArrayBuffer], {
          type: item.metadata?.type || "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = item.metadata?.name || "decrypted_file";
        a.click();
        URL.revokeObjectURL(url);
    
        setMessage(`✅ ${item.metadata?.name} decrypted successfully!`);
      } catch (err) {
        console.error(" Decryption failed:", err);
        setMessage(" Failed to decrypt or download file.");
      }
    };
    

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          Vault: {vault.name}
        </h1>
        <p className="text-gray-500 mb-6">
          Owner: {user?.firstName || "Unknown"} | Created:{" "}
          {new Date(vault.createdAt).toLocaleString()}
        </p>

        <div className="mb-8 border-t pt-4">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">
            Upload Encrypted File
          </h2>
          <form onSubmit={handleUpload} className="flex items-center space-x-3">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="flex-1 border rounded px-3 py-2"
            />
            <button
              type="submit"
              disabled={uploading}
              className={`px-4 py-2 rounded text-white ${
                uploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {uploading ? "Encrypting..." : "Upload"}
            </button>
          </form>
          {message && (
            <p
              className={`mt-3 text-sm ${
                message.startsWith("✅") ? "text-green-600" : "text-red-500"
              }`}
            >
              {message}
            </p>
          )}
        </div>

        <div className="border-t pt-4">
  <h2 className="text-xl font-semibold mb-3 text-gray-700">
    Stored Items
  </h2>

  {items.length === 0 ? (
    <p className="text-gray-500">No files uploaded yet.</p>
  ) : (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item._id}
          className="flex items-center justify-between border p-3 rounded hover:bg-gray-50"
        >
          <div>
            <p className="font-medium text-gray-800">
              {item.metadata?.name || "Unnamed File"}
            </p>
            <p className="text-sm text-gray-500">
              {item.metadata?.type || "Unknown"} •{" "}
              {(item.metadata?.size / 1024).toFixed(1)} KB
            </p>
          </div>

          <div className="flex space-x-3">
            {item.fileUrl && (
              <button
                onClick={() => handleDecryptDownload(item)}
                className="text-blue-600 hover:underline"
              >
                 Decrypt & Download
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )}
</div>


        <div className="mt-6 text-center">
          <Link
            to="/vaults"
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            ← Back to Vaults
          </Link>
        </div>
      </div>
    </div>
  );
}
