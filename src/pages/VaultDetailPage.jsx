// frontend/src/pages/VaultDetailPage.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
import {
  ChevronLeftIcon,
  InformationCircleIcon,
  UserPlusIcon,
  ArrowUpTrayIcon,
  UserGroupIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  XCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";

export default function VaultDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [vault, setVault] = useState(null);
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [restoringKey, setRestoringKey] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [canAccessFiles, setCanAccessFiles] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [releaseStatus, setReleaseStatus] = useState(null);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [participantForm, setParticipantForm] = useState({ email: "", role: "beneficiary" });
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [downloadingItem, setDownloadingItem] = useState(null);

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
      setIsOwner(res.data.isOwner || false);
      fetchReleaseStatus();
    } catch (err) {
      toast.error("Failed to load vault details");
      console.error("Error fetching vault:", err);
      navigate("/vaults");
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
      if (err.response?.status !== 404) {
        toast.error("Failed to fetch release status");
        console.error("Error fetching release status:", err);
      }
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
        if (!isOwner) {
          try {
            const sealedRes = await API.get(`/api/vaults/${id}/sealed-key`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (sealedRes.data.encKey) {
              const privateKeyPem = localStorage.getItem(`privateKey_${user.email}`);
              if (!privateKeyPem) throw new Error("Your private key is not available. Please login again.");
              await restoreVaultKeyFromSealed(id, sealedRes.data.encKey, privateKeyPem);
              toast.success("Vault key restored successfully!");
              return;
            }
          } catch (sealedErr) {
            console.warn("Sealed key not available, trying password backup:", sealedErr);
          }
        }

        const res = await API.get(`/api/keybackup/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const encryptedVaultKey = res.data.encryptedVaultKey;
        if (!encryptedVaultKey) {
          console.log("No vault key backup found yet.");
          return;
        }
        const decryptedVaultKeyB64 = await decryptVaultKeyFromBackup(encryptedVaultKey, user.email);
        localStorage.setItem(`vaultKey_${id}`, decryptedVaultKeyB64);
        toast.success("Vault key restored successfully!");
      } catch (err) {
        if (err.response?.status !== 404) {
          console.warn("Vault key restore failed:", err);
          toast.error("Unable to restore vault key. " + (err.message || "You may need to re-authenticate."));
        } else {
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
    if (!file) return toast.error("Please select a file");

    setUploading(true);
    const toastId = toast.loading("Encrypting and uploading...");
    try {
      const { encryptedData, encKey } = await encryptFileForVault(file, id);
      const metadata = { name: file.name, type: file.type, size: file.size };

      await API.post(
        "/api/upload",
        { vaultId: id, encryptedData, encKey, metadata },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const vaultKeyB64 = localStorage.getItem(`vaultKey_${id}`);
      if (vaultKeyB64) {
        const encryptedVaultKey = await encryptVaultKeyForBackup(vaultKeyB64, user.email);
        await API.post(
          "/api/keybackup/upload",
          { vaultId: id, encryptedVaultKey },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      toast.success("File uploaded & key backed up!", { id: toastId });
      setFile(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
      fetchVault();
    } catch (err) {
      toast.error("Upload failed: " + (err.response?.data?.message || err.message), { id: toastId });
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  // ---------------- Decrypt & Download ----------------
  const handleDecryptDownload = async (item) => {
    setDownloadingItem(item._id);
    const toastId = toast.loading(`Downloading & decrypting ${item.metadata?.name}...`);
    try {
      const res = await fetch(item.fileUrl);
      const encryptedArrayBuffer = await res.arrayBuffer();
      const array = new Uint8Array(encryptedArrayBuffer);
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < array.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, array.subarray(i, i + chunkSize));
      }
      const encryptedDataB64 = btoa(binary);

      const decryptedArrayBuffer = await decryptFileForVault(encryptedDataB64, item.encKey, id);

      const blob = new Blob([decryptedArrayBuffer], { type: item.metadata?.type || "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.metadata?.name || "decrypted_file";
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`${item.metadata?.name} decrypted successfully!`, { id: toastId });
    } catch (err) {
      console.error("Decryption failed:", err);
      toast.error("Failed to decrypt or download file.", { id: toastId });
    } finally {
      setDownloadingItem(null);
    }
  };

  // ---------------- Add Participant ----------------
  const handleAddParticipant = async (e) => {
    e.preventDefault();
    setIsAddingParticipant(true);
    const toastId = toast.loading("Adding participant...");
    try {
      const res = await API.post(`/api/vaults/${id}/participant`, participantForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVault(res.data.vault);
      toast.success("Participant added successfully!", { id: toastId });
      setShowAddParticipant(false);
      setParticipantForm({ email: "", role: "beneficiary" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add participant.", { id: toastId });
      console.error("Add participant failed:", err);
    } finally {
      setIsAddingParticipant(false);
    }
  };

  // ---------------- Remove Participant ----------------
  const handleRemoveParticipant = async (participantId) => {
    if (!window.confirm("Are you sure you want to remove this participant?")) return;
    const toastId = toast.loading("Removing participant...");
    try {
      const res = await API.delete(`/api/vaults/${id}/participant/${participantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVault(res.data.vault);
      toast.success("Participant removed successfully!", { id: toastId });
    } catch (err) {
      toast.error("Failed to remove participant.", { id: toastId });
      console.error("Remove participant failed:", err);
    }
  };

  // ---------------- Revoke Release ----------------
  const handleRevokeRelease = async () => {
    const reason = prompt(`Are you sure you want to revoke the release for "${vault.title}"?\n\nOptional: Enter a reason for revocation:`);
    if (reason === null) return;

    setRevokeLoading(true);
    const toastId = toast.loading("Revoking release...");
    try {
      await API.post(
        "/api/releases/revoke",
        { releaseId: releaseStatus.releaseId, reason: reason || "No reason provided" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Release revoked successfully!", { id: toastId });
      fetchReleaseStatus();
      fetchVault();
    } catch (err) {
      console.error("Error revoking release:", err);
      toast.error(err.response?.data?.message || "Failed to revoke release", { id: toastId });
    } finally {
      setRevokeLoading(false);
    }
  };

  // ---------------- Confirm/Reject Release ----------------
  const handleConfirmRelease = async (confirmationStatus) => {
    const toastId = toast.loading("Submitting confirmation...");
    try {
      await API.post(
        "/api/releases/confirm",
        { releaseId: releaseStatus.releaseId, status: confirmationStatus, comment: `${confirmationStatus} by witness` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Release ${confirmationStatus} successfully!`, { id: toastId });
      fetchReleaseStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit confirmation.", { id: toastId });
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // ---------------- UI Render ----------------
  if (!vault) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#000957] via-[#1a2470] to-[#344cb7] text-white flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-t-[#ffeb00] border-r-[#ffeb00] border-b-[#ffeb00]/30 border-l-[#ffeb00]/30 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#000957] via-[#1a2470] to-[#344cb7] text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#000957]/80 via-[#1a2470]/80 to-[#000957]/80 backdrop-blur-xl shadow-2xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link
              to="/vaults"
              className="flex items-center gap-2 text-sm font-bold text-[#ffeb00] hover:text-white transition-colors group cursor-pointer"
            >
              <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/20 transition-colors">
                <ChevronLeftIcon className="w-5 h-5" />
              </div>
              <span className="hidden sm:inline">Back to Vaults</span>
            </Link>
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r from-white via-[#ffeb00] to-white bg-clip-text text-transparent truncate">
                {vault.title}
              </h1>
              <p className="text-xs text-white/60 hidden sm:block">
                {isOwner ? "You are the owner" : `You are a ${userRole}`}
              </p>
            </div>
            <div className="w-24 sm:w-40"></div> {/* Spacer */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column / Main on mobile */}
          <div className="lg:col-span-2 space-y-8">
            {/* Owner Revoke Section */}
            {isOwner && releaseStatus?.hasActiveRelease && releaseStatus.status === "pending" && releaseStatus.inGracePeriod && (
              <div className="bg-red-900/50 border-2 border-red-500/80 rounded-2xl p-5 shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-red-300 flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-6 h-6" />
                      Release in Grace Period
                    </h3>
                    <p className="text-sm text-red-300/90 mt-1">
                      A release has been triggered due to inactivity. You can revoke it before the grace period ends.
                    </p>
                    <p className="text-sm text-red-200 font-semibold mt-2">
                      ⏳ Ends: {new Date(releaseStatus.gracePeriodEnd).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={handleRevokeRelease}
                    disabled={revokeLoading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white text-sm rounded-lg font-bold transition-colors active:scale-95 shadow-md whitespace-nowrap cursor-pointer"
                  >
                    <XCircleIcon className="w-5 h-5" />
                    {revokeLoading ? "Revoking..." : "Revoke Release"}
                  </button>
                </div>
              </div>
            )}

            {/* Witness Approval Section */}
            {!isOwner && userRole === "witness" && releaseStatus?.hasActiveRelease && !releaseStatus.inGracePeriod && !releaseStatus.isReleased && releaseStatus.status !== "rejected" && !releaseStatus.userHasConfirmed && (
              <div className="bg-yellow-900/50 border-2 border-yellow-500/80 rounded-2xl p-5 shadow-lg">
                <h3 className="font-bold text-lg text-yellow-300 flex items-center gap-2 mb-3">
                  <ShieldCheckIcon className="w-6 h-6" />
                  Witness Approval Required
                </h3>
                <p className="text-sm text-yellow-300/90 mb-4">
                  The grace period has ended. As a witness, you must approve or reject this release.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleConfirmRelease("approved")}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-bold transition-colors active:scale-95 shadow-md cursor-pointer"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleConfirmRelease("rejected")}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-bold transition-colors active:scale-95 shadow-md cursor-pointer"
                  >
                    <NoSymbolIcon className="w-5 h-5" />
                    Reject
                  </button>
                </div>
              </div>
            )}

            {/* File Upload Section */}
            {isOwner && (
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <ArrowUpTrayIcon className="w-6 h-6 text-[#ffeb00]" />
                  Upload New File
                </h2>
                <form onSubmit={handleUpload}>
                  <div 
                    className="relative border-2 border-dashed border-white/30 rounded-lg p-8 text-center cursor-pointer hover:border-[#ffeb00] hover:bg-white/5 transition-colors"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => setFile(e.target.files[0])}
                      className="hidden"
                      disabled={uploading}
                    />
                    <ArrowUpTrayIcon className="w-10 h-10 mx-auto text-white/50 mb-2" />
                    {file ? (
                      <p className="text-md font-semibold text-[#ffeb00]">{file.name}</p>
                    ) : (
                      <p className="text-md text-white/70">Click or drag file to this area to upload</p>
                    )}
                  </div>
                  {file && (
                    <div className="mt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={uploading}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto font-bold text-[#000957] bg-gradient-to-r from-[#ffeb00] to-[#ffd700] hover:from-[#ffd700] hover:to-[#ffeb00] px-8 py-3 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-100"
                      >
                        {uploading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-t-[#000957] border-r-[#000957] border-b-[#000957]/30 border-l-[#000957]/30 rounded-full animate-spin"></div>
                            Uploading...
                          </>
                        ) : (
                          "Confirm & Upload"
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Files List */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg">
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Vault Items ({items.length})</h2>
                {restoringKey && <p className="text-sm text-yellow-400">Restoring vault key...</p>}
                
                <div className="space-y-3">
                  {items.length > 0 ? (
                    items.map((item) => (
                      <div key={item._id} className="bg-white/5 p-3 rounded-lg flex items-center justify-between gap-4 transition-colors hover:bg-white/10">
                        <div className="flex-1 truncate">
                          <p className="font-semibold text-white truncate">{item.metadata?.name || "Unnamed File"}</p>
                          <p className="text-xs text-white/60">
                            {formatBytes(item.metadata?.size || 0)}
                          </p>
                        </div>
                        {canAccessFiles ? (
                          <button
                            onClick={() => handleDecryptDownload(item)}
                            disabled={downloadingItem === item._id}
                            className="flex items-center gap-2 text-sm font-semibold text-[#ffeb00] bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait cursor-pointer"
                          >
                            {downloadingItem === item._id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-t-yellow-400 border-r-yellow-400 border-b-yellow-400/30 border-l-yellow-400/30 rounded-full animate-spin"></div>
                                <span className="hidden sm:inline">Processing...</span>
                              </>
                            ) : (
                              <>
                                <DocumentArrowDownIcon className="w-5 h-5" />
                                <span className="hidden sm:inline">Download</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-white/50" title="Files are locked until the release is complete">
                            <LockClosedIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">Locked</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 px-4 border-2 border-dashed border-white/20 rounded-lg">
                      <p className="text-lg font-semibold text-white/90">This vault is empty.</p>
                      {isOwner && <p className="text-sm text-white/60 mt-1">Upload a file to get started.</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column / Secondary on mobile */}
          <div className="space-y-8">
            {/* Release Status Card */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <InformationCircleIcon className="w-6 h-6 text-[#ffeb00]" />
                Release Status
              </h2>
              {!releaseStatus || !releaseStatus.hasActiveRelease ? (
                <div className="flex items-center gap-3 text-green-400">
                  <ShieldCheckIcon className="w-5 h-5" />
                  <p className="font-semibold">Vault is Secure</p>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white/80 w-24">Status:</span>
                    <span className={`font-bold capitalize px-2 py-0.5 rounded-full text-xs ${
                      releaseStatus.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                      releaseStatus.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                      releaseStatus.status === 'released' ? 'bg-green-500/20 text-green-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {releaseStatus.status.replace('_', ' ')}
                    </span>
                  </div>
                  {releaseStatus.inGracePeriod && (
                    <div className="flex items-start gap-3 text-yellow-400">
                      <ClockIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Grace Period Active</p>
                        <p className="text-xs text-white/70">Ends: {new Date(releaseStatus.gracePeriodEnd).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {releaseStatus.status === 'in_progress' && (
                    <div className="flex items-start gap-3 text-blue-400">
                      <ShieldCheckIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Approvals: {releaseStatus.approvalsReceived}/{releaseStatus.approvalsNeeded}</p>
                        <p className="text-xs text-white/70">Waiting for witness confirmations.</p>
                      </div>
                    </div>
                  )}
                   {releaseStatus.inTimeLock && (
                    <div className="flex items-start gap-3 text-purple-400">
                      <ClockIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Time Lock Active</p>
                        <p className="text-xs text-white/70">Unlocks: {new Date(releaseStatus.countdownEnd).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {releaseStatus.isReleased && (
                    <div className="flex items-center gap-3 text-green-400">
                      <CheckCircleIcon className="w-5 h-5" />
                      <p className="font-semibold">Vault Released!</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Participants Card */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <UserGroupIcon className="w-6 h-6 text-[#ffeb00]" />
                  Participants
                </h2>
                {isOwner && (
                  <button
                    onClick={() => setShowAddParticipant(!showAddParticipant)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#ffeb00] bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    Add
                  </button>
                )}
              </div>

              {showAddParticipant && (
                <form onSubmit={handleAddParticipant} className="space-y-4 mb-6 p-4 bg-black/20 rounded-lg animate-fade-in">
                  <div>
                    <label className="block text-sm font-semibold text-[#ffeb00] mb-2">Participant Email</label>
                    <input
                      type="email"
                      placeholder="participant@example.com"
                      value={participantForm.email}
                      onChange={(e) => setParticipantForm({ ...participantForm, email: e.target.value })}
                      className="w-full bg-white/5 border-2 border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#ffeb00] focus:border-[#ffeb00] transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#ffeb00] mb-2">Role</label>
                    <select
                      value={participantForm.role}
                      onChange={(e) => setParticipantForm({ ...participantForm, role: e.target.value })}
                      className="w-full bg-white/5 border-2 border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#ffeb00] focus:border-[#ffeb00] transition"
                    >
                      <option className="bg-[#1a2470] text-white" value="beneficiary">Beneficiary</option>
                      <option className="bg-[#1a2470] text-white" value="witness">Witness</option>
                      <option className="bg-[#1a2470] text-white" value="sharer">Sharer</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isAddingParticipant}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto font-bold text-[#000957] bg-gradient-to-r from-[#ffeb00] to-[#ffd700] hover:from-[#ffd700] hover:to-[#ffeb00] px-6 py-2.5 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isAddingParticipant ? "Adding..." : "Add Participant"}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {/* Owner Info */}
                <div className="bg-white/5 p-3 rounded-lg flex items-center justify-between gap-4">
                  <div className="flex-1 truncate">
                    <p className="font-semibold text-white truncate">{vault.ownerId.firstName} {vault.ownerId.lastName}</p>
                    <p className="text-xs text-white/60">{vault.ownerId.email}</p>
                  </div>
                  <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-[#ffeb00] text-[#000957]">
                    Owner
                  </span>
                </div>
                {/* Participants List */}
                {vault.participants.map(({ participantId: p, role }) => (
                  p && <div key={p._id} className="bg-white/5 p-3 rounded-lg flex items-center justify-between gap-4 transition-colors hover:bg-white/10">
                    <div className="flex-1 truncate">
                      <p className="font-semibold text-white truncate">{p.firstName} {p.lastName}</p>
                      <p className="text-xs text-white/60">{p.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-white/10 text-white/80 border border-white/20">
                        {role}
                      </span>
                      {isOwner && (
                        <button
                          onClick={() => handleRemoveParticipant(p._id)}
                          className="flex items-center justify-center w-8 h-8 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
