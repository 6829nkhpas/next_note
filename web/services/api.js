import axios from "axios";

export function getApiClient() {
  const fallback = "http://localhost:8000";
  const base = process.env.NEXT_PUBLIC_API_BASE || fallback;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return axios.create({ baseURL: base, headers });
}
