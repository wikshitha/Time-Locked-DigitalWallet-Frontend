import { create } from "zustand";
import API from "../utils/api";
import { decryptPrivateKey } from "../utils/cryptoUtils";

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  loading: false,
  error: null,

  // 🔹 Register new user
  register: async (formData) => {
    set({ loading: true, error: null });
    try {
      const res = await API.post("/api/auth/register", formData);
      localStorage.setItem("token", res.data.token);
      set({ user: res.data.user, token: res.data.token, loading: false });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.message || "Registration failed", loading: false });
      throw err;
    }
  },

  // 🔹 Login user
  login: async (formData) => {
    set({ loading: true, error: null });
    try {
      const res = await API.post("/api/auth/login", formData);
      localStorage.setItem("token", res.data.token);
      
      // Decrypt and store private key if available
      if (res.data.user.privateKeyEnc && formData.password) {
        try {
          const privateKeyPem = await decryptPrivateKey(res.data.user.privateKeyEnc, formData.password);
          localStorage.setItem(`privateKey_${res.data.user.email}`, privateKeyPem);
          console.log("✅ Private key decrypted and stored locally");
        } catch (err) {
          console.warn("Failed to decrypt private key:", err);
        }
      }
      
      set({ user: res.data.user, token: res.data.token, loading: false });
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.message || "Login failed", loading: false });
      throw err;
    }
  },

  // 🔹 Fetch current user
  fetchUser: async () => {
    set({ loading: true, error: null });
    try {
      const res = await API.get("/api/auth/me");
      set({ user: res.data, loading: false });
    } catch (err) {
      set({ error: "Failed to fetch user", loading: false });
    }
  },

  // 🔹 Logout user
  logout: () => {
    // Clear token and all stored keys
    localStorage.removeItem("token");
    // Note: We keep private keys for security - user can clear browser data manually
    set({ user: null, token: null });
  },
}));
