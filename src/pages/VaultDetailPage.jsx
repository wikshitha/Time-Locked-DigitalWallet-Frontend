// frontend/src/pages/VaultDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../utils/api.js";
import { useAuthStore } from "../store/useAuthStore.js";
import {
  encryptFileForVault,
  decryptFileForVault,
  importVaultKey,
  encryptVaultKeyForBackup,
  decryptVaultKeyFromBackup,
} from "../utils/cryptoUtils.js";

export default function VaultDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuthStore();

  const [vault, setVault] = useState(null);
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [restoringKey, setRestoringKey] = useState(false);

  //
  // 🔹 Fetch vault details
  //
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

  useEffect(() => {
    if (token) fetchVault();
  }, [id, token]);

  //
  // 🔹 Try to restore vault key if missing
  //
  useEffect(() => {
    const tryRestoreVaultKey = async () => {
      const existingKey = await importVaultKey(id);
      if (existingKey) return;

      try {
        setRestoringKey(true);
        setMessage("🔐 No local vault key found — attempting restore...");

        const res = await API.get(`/api/keybackup/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const encryptedVaultKey = res.data.encryptedVaultKey;
        if (!encryptedVaultKey) throw new Error("No backup found on server");

        const decryptedVaultKeyB64 = await decryptVaultKeyFromBackup(
          encryptedVaultKey,
          user.email // Replace with password prompt later for more security
        );

        localStorage.setItem(`vaultKey_${id}`, decryptedVaultKeyB64);
        setMessage("✅ Vault key restored successfully!");
      } catch (err) {
        console.warn("Vault key restore failed:", err);
        setMessage("⚠️ Vault key restore failed. You may need to reupload it.");
      } finally {
        setRestoringKey(false);
      }
    };

    if (id && token) tryRestoreVaultKey();
  }, [id, token, user?.email]);

  //
  // 🔹 Handle encrypted upload
  //
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file");

    try {
      setUploading(true);
      setMessage("Encrypting and uploading...");

      // Encrypt the file
      const { encryptedData, encKey } = await encryptFileForVault(file, id);

      // Metadata
      const metadata = {
        name: file.name,
        type: file.type,
        size: file.size,
      };

      // Upload encrypted blob
      await API.post(
        "/api/upload",
        { vaultId: id, encryptedData, encKey, metadata },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Backup vault key to server
      const vaultKeyB64 = localStorage.getItem(`vaultKey_${id}`);
      if (vaultKeyB64) {
        const encryptedVaultKey = await encryptVaultKeyForBackup(
          vaultKeyB64,
          user.email
        );
        await API.post(
          "/api/keybackup/upload",
          { vaultId: id, encryptedVaultKey },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setMessage("✅ File encrypted, uploaded & key backed up!");
      setFile(null);
      fetchVault(); // Refresh the file list
    } catch (err) {
      console.error("Upload failed:", err);
      setMessage("❌ Upload failed: " + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  //
  // 🔹 Handle decrypt + download
  //
  const handleDecryptDownload = async (item) => {
    try {
      setMessage(`🔄 Downloading & decrypting ${item.metadata?.name}...`);

      // Fetch encrypted data
      const res = await fetch(item.fileUrl);
      const encryptedArrayBuffer = await res.arrayBuffer();

      // Convert to Base64 (chunked to avoid memory issues)
      const array = new Uint8Array(encryptedArrayBuffer);
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < array.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, array.subarray(i, i + chunkSize));
      }
      const encryptedDataB64 = btoa(binary);

      // Decrypt
      const decryptedArrayBuffer = await decryptFileForVault(
        encryptedDataB64,
        item.encKey,
        id
      );

      // Trigger download
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
      console.error("Decryption failed:", err);
      setMessage("❌ Failed to decrypt or download file.");
    }
  };

  //
  // 🔹 Render
  //
  if (!vault)
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Loading vault...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          Vault: {vault.title}
        </h1>
        <p className="text-gray-500 mb-6">
          Owner: {vault.ownerId?.firstName || user?.firstName || "Unknown"} | Created:{" "}
          {new Date(vault.createdAt).toLocaleString()}
        </p>

        {/* Upload Section */}
        {user?.role === "owner" && (
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
          </div>
        )}

        {/* Participants Section */}
        {user?.role === "owner" && (
          <div className="border-t pt-4 mt-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">
              Add Participants
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const email = e.target.email.value;
                const role = e.target.role.value;
                try {
                  const res = await API.post(
                    "/api/vaults/participant",
                    { vaultId: id, email, role },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  setVault(res.data.vault);
                  setMessage(`✅ ${email} added as ${role}`);
                  e.target.reset();
                } catch (err) {
                  console.error("Add participant failed:", err);
                  setMessage(
                    "❌ " +
                      (err.response?.data?.message || "Failed to add participant")
                  );
                }
              }}
              className="space-y-3"
            >
              <input
                type="email"
                name="email"
                placeholder="Participant Email"
                required
                className="w-full border rounded px-3 py-2"
              />
              <select
                name="role"
                required
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Role</option>
                <option value="beneficiary">Beneficiary</option>
                <option value="executor">Executor</option>
                <option value="witness">Witness</option>
              </select>
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Add Participant
              </button>
            </form>

            {vault?.participants?.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-700 mb-2">
                  Current Participants:
                </h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  {vault.participants.map((p) => (
                    <li key={p._id}>
                      • {p.participantId?.firstName} {p.participantId?.lastName} (
                      {p.participantId?.email}) —{" "}
                      <span className="italic">{p.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* File List */}
        <div className="border-t pt-4 mt-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">Stored Items</h2>
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
                  {item.fileUrl && (
                    <button
                      onClick={() => handleDecryptDownload(item)}
                      className="text-blue-600 hover:underline"
                    >
                      Decrypt & Download
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Message */}
        {message && (
          <p
            className={`mt-4 text-sm text-center ${
              message.startsWith("✅") || message.startsWith("🔐")
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}

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
