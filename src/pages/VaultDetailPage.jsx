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
  restoreVaultKeyFromSealed,
} from "../utils/cryptoUtils.js";
import toast from "react-hot-toast";

export default function VaultDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuthStore();

  const [vault, setVault] = useState(null);
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [restoringKey, setRestoringKey] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [canAccessFiles, setCanAccessFiles] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [releaseStatus, setReleaseStatus] = useState(null);

  // ---------------- Fetch Vault ----------------
  const fetchVault = async () => {
    try {
      const res = await API.get(`/api/vaults/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVault(res.data.vault);
      setItems(res.data.items || []);
      setCanAccessFiles(res.data.canAccessFiles || false);
      setUserRole(res.data.userRole || "");
      
      // Check if current user is the vault owner
      setIsOwner(res.data.isOwner || false);

      // Fetch release status for participants
      if (!res.data.isOwner) {
        fetchReleaseStatus();
      }
    } catch (err) {
      toast.error("Failed to load vault details");
      console.error("Error fetching vault:", err);
      setMessage("❌ Failed to load vault details");
    }
  };

  // ---------------- Fetch Release Status ----------------
  const fetchReleaseStatus = async () => {
    try {
      const res = await API.get(`/api/releases/vault/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReleaseStatus(res.data);
    } catch (err) {
      toast.error("Failed to fetch release status");
      console.error("Error fetching release status:", err);
      
    }
  };

  useEffect(() => {
    if (token) fetchVault();
  }, [id, token]);

  // ---------------- Try restore vault key ----------------
  useEffect(() => {
    const tryRestoreVaultKey = async () => {
      const existingKey = await importVaultKey(id);
      if (existingKey) return;

      try {
        setRestoringKey(true);

        // First, try to get sealed key for participants (beneficiaries/witnesses)
        if (!isOwner) {
          try {
            const sealedRes = await API.get(`/api/vaults/${id}/sealed-key`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (sealedRes.data.encKey) {
              // Get user's private key from localStorage
              const privateKeyPem = localStorage.getItem(`privateKey_${user.email}`);
              if (!privateKeyPem) {
                throw new Error("Your private key is not available. Please login again.");
              }

              // Unwrap the vault key using private key
              await restoreVaultKeyFromSealed(id, sealedRes.data.encKey, privateKeyPem);
              toast.success("Vault key restored successfully!");
              return;
            }
          } catch (sealedErr) {
            // Silently continue to password backup for participants
            console.warn("Sealed key not available, trying password backup:", sealedErr);
          }
        }

        // Fallback: try password-based backup (for owners)
        const res = await API.get(`/api/keybackup/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const encryptedVaultKey = res.data.encryptedVaultKey;
        if (!encryptedVaultKey) {
          // No backup exists yet - this is normal for new vaults, silently continue
          console.log("No vault key backup found yet. Will be created on first file upload.");
          return;
        }

        const decryptedVaultKeyB64 = await decryptVaultKeyFromBackup(
          encryptedVaultKey,
          user.email
        );

        localStorage.setItem(`vaultKey_${id}`, decryptedVaultKeyB64);
        toast.success("Vault key restored successfully!");
      } catch (err) {
        // Only show error if it's not a 404 (missing backup is normal for new vaults)
        if (err.response?.status !== 404) {
          console.warn("Vault key restore failed:", err);
          toast.error("Unable to restore vault key. " + (err.message || "You may need to re-authenticate."));
        } else {
          // 404 means no backup exists yet - normal for new vaults, don't show error
          console.log("No vault key backup found. Will be created when you upload the first file.");
        }
      } finally {
        setRestoringKey(false);
      }
    };

    if (id && token && user) tryRestoreVaultKey();
  }, [id, token, user, isOwner]);

  // ---------------- Upload Encrypted File ----------------
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file");

    try {
      setUploading(true);
      toast("Encrypting and uploading...");

      const { encryptedData, encKey } = await encryptFileForVault(file, id);
      const metadata = { name: file.name, type: file.type, size: file.size };

      await API.post(
        "/api/upload",
        { vaultId: id, encryptedData, encKey, metadata },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 🔐 Backup vault key to server
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

      toast.success("File encrypted, uploaded & key backed up!");
      setMessage("✅ File encrypted, uploaded & key backed up!");
      setFile(null);
      fetchVault();
    } catch (err) {
      toast.error("Upload failed: " + (err.response?.data?.message || err.message));
      console.error("Upload failed:", err);
      setMessage("❌ Upload failed: " + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  // ---------------- Decrypt & Download ----------------
  const handleDecryptDownload = async (item) => {
    try {

      setMessage(` Downloading & decrypting ${item.metadata?.name}...`);

      const res = await fetch(item.fileUrl);
      const encryptedArrayBuffer = await res.arrayBuffer();

      const array = new Uint8Array(encryptedArrayBuffer);
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < array.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, array.subarray(i, i + chunkSize));
      }
      const encryptedDataB64 = btoa(binary);

      const decryptedArrayBuffer = await decryptFileForVault(
        encryptedDataB64,
        item.encKey,
        id
      );

      const blob = new Blob([decryptedArrayBuffer], {
        type: item.metadata?.type || "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.metadata?.name || "decrypted_file";
      a.click();
      URL.revokeObjectURL(url);

      toast.success(` ${item.metadata?.name} decrypted successfully!`);
      setMessage(` ${item.metadata?.name} decrypted successfully!`);
    } catch (err) {
      console.error("Decryption failed:", err);
      toast.error(" Failed to decrypt or download file.");
      setMessage(" Failed to decrypt or download file.");
    }
  };

  // ---------------- Remove Participant ----------------
  const handleRemoveParticipant = async (participantId) => {
    if (!window.confirm("Are you sure you want to remove this participant?")) return;

    try {
      const res = await API.delete(`/api/vaults/${id}/participant/${participantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVault(res.data.vault);
      toast.success("Participant removed successfully!");
    } catch (err) {
      toast.error("Failed to remove participant: " );
      console.error("Remove participant failed:", err);
    }
  };

  // ---------------- UI Render ----------------
  if (!vault)
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Loading vault...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Vault: {vault.title}</h1>
        <p className="text-gray-500 mb-6">
          Owner: {isOwner 
            ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email || "You"
            : `${vault.ownerId?.firstName || ""} ${vault.ownerId?.lastName || ""}`.trim() || "Unknown"
          } | 
          Created: {new Date(vault.createdAt).toLocaleString()}
          {!isOwner && (
            <span className="ml-2 text-blue-600 font-medium">
              (You are a {userRole})
            </span>
          )}
        </p>

        {/* Release Status for Participants */}
        {!isOwner && releaseStatus && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Release Status</h3>
            {!releaseStatus.hasActiveRelease && (
              <p className="text-sm text-gray-600">No active release for this vault.</p>
            )}
            {releaseStatus.hasActiveRelease && (
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span className="capitalize">{releaseStatus.status}</span>
                </p>
                {releaseStatus.inGracePeriod && (
                  <p className="text-amber-600">
                    ⏳ Grace period active until{" "}
                    {new Date(releaseStatus.gracePeriodEnd).toLocaleDateString()}
                  </p>
                )}
                {releaseStatus.status === "in_progress" && (
                  <p>
                    Approvals: {releaseStatus.approvalsReceived}/{releaseStatus.approvalsNeeded}
                  </p>
                )}
                {releaseStatus.inTimeLock && (
                  <p className="text-amber-600">
                    🔒 Time lock active until{" "}
                    {new Date(releaseStatus.countdownEnd).toLocaleDateString()}
                  </p>
                )}
                {releaseStatus.isReleased && (
                  <p className="text-green-600 font-medium">
                    ✅ Vault has been released! You can now access the files.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Witness Approval Section */}
        {!isOwner && userRole === "witness" && releaseStatus?.hasActiveRelease && 
         !releaseStatus.inGracePeriod && !releaseStatus.isReleased && 
         releaseStatus.status !== "rejected" && !releaseStatus.userHasConfirmed && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-3">⚖️ Witness Approval Required</h3>
            <p className="text-sm text-gray-600 mb-3">
              The grace period has ended. As a witness, you need to approve or reject this release.
            </p>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    await API.post(
                      "/api/releases/confirm",
                      { 
                        releaseId: releaseStatus.releaseId, 
                        status: "approved",
                        comment: "Approved by witness"
                      },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    toast.success("Release approved successfully!");
                    fetchReleaseStatus();
                  } catch (err) {
                    toast.error("Failed to approve release: ");
                  }
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Approve Release
              </button>
              <button
                onClick={async () => {
                  const comment = prompt("Please provide a reason for rejection:");
                  if (!comment) return;
                  try {
                    await API.post(
                      "/api/releases/confirm",
                      { 
                        releaseId: releaseStatus.releaseId, 
                        status: "rejected",
                        comment
                      },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    toast.success("Release rejected successfully!");
                    fetchReleaseStatus();
                  } catch (err) {
                    toast.error("Failed to reject release: ");
                  }
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Reject Release
              </button>
            </div>
          </div>
        )}

        {/* Show confirmation status if user has already confirmed */}
        {!isOwner && userRole === "witness" && releaseStatus?.hasActiveRelease && 
         releaseStatus.userHasConfirmed && !releaseStatus.isReleased && (
          <div className={`mb-6 p-4 border rounded-lg ${
            releaseStatus.userConfirmationStatus === "approved" 
              ? "bg-green-50 border-green-200" 
              : "bg-red-50 border-red-200"
          }`}>
            <h3 className={`font-semibold mb-2 ${
              releaseStatus.userConfirmationStatus === "approved" 
                ? "text-green-800" 
                : "text-red-800"
            }`}>
              {releaseStatus.userConfirmationStatus === "approved" 
                ? "✅ You have approved this release" 
                : "❌ You have rejected this release"}
            </h3>
            <p className="text-sm text-gray-600">
              {releaseStatus.userConfirmationStatus === "approved" 
                ? "Your approval has been recorded. Waiting for other witnesses or time-lock completion." 
                : "Your rejection has been recorded. The release process has been stopped."}
            </p>
          </div>
        )}

        {/* Upload Section - Only for Vault Owners */}
        {isOwner && (
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

        {/* Participants Section - Only for Vault Owners */}
        {isOwner && (
          <div className="border-t pt-4 mt-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Manage Participants</h2>

            {/* Add Participant */}
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
                  toast.success("Participant added successfully!");
                  // Refetch vault to get populated participant data
                  await fetchVault();
                  setMessage(`✅ ${email} added as ${role}`);
                  e.target.reset();
                } catch (err) {
                  console.error("Add participant failed:", err);
                  toast.error("Failed to add participant: " );
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
              <select name="role" required className="w-full border rounded px-3 py-2">
                <option value="">Select Role</option>
                <option value="beneficiary">Beneficiary</option>
                <option value="shared">Shared</option>
                <option value="witness">Witness</option>
              </select>
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Add Participant
              </button>
            </form>

            {/* List Participants */}
            {vault?.participants?.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-700 mb-2">Current Participants:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {vault.participants.map((p) => (
                    <li
                      key={p._id}
                      className="flex justify-between items-center border rounded px-3 py-2"
                    >
                      <span>
                        • {p.participantId?.firstName} {p.participantId?.lastName} (
                        {p.participantId?.email}) —{" "}
                        <span className="italic capitalize">{p.role}</span>
                      </span>
                      <button
                        onClick={() => handleRemoveParticipant(p.participantId?._id)}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Participants View for Non-Owners */}
        {!isOwner && vault?.participants?.length > 0 && (
          <div className="border-t pt-4 mt-6">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Participants</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              {vault.participants.map((p) => (
                <li
                  key={p._id}
                  className="flex justify-between items-center border rounded px-3 py-2"
                >
                  <span>
                    • {p.participantId?.firstName} {p.participantId?.lastName} (
                    {p.participantId?.email}) —{" "}
                    <span className="italic capitalize">{p.role}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* File List - Conditional Access Based on Role and Release Status */}
        <div className="border-t pt-4 mt-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">Stored Items</h2>
          
          {!canAccessFiles && !isOwner && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 font-medium">🔒 Files are locked</p>
              <p className="text-sm text-gray-600 mt-1">
                {userRole === "beneficiary" 
                  ? "As a beneficiary, you can only access files after the vault is fully released (grace period + approvals + time lock complete)."
                  : userRole === "witness"
                  ? "As a witness, you cannot access vault files. Your role is to approve or reject the release. Only beneficiaries can access files after release."
                  : userRole === "shared"
                  ? "As a shared participant, you cannot access vault files. Only beneficiaries can access files after the vault is released."
                  : "You can only access files after the vault is fully released."}
              </p>
            </div>
          )}

          {canAccessFiles && items.length === 0 && (
            <p className="text-gray-500">No files uploaded yet.</p>
          )}
          
          {canAccessFiles && items.length > 0 && (
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
