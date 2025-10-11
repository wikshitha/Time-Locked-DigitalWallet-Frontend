import { create } from "zustand";
import API from "../utils/api";

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
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },
}));
