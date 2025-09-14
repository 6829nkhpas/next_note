import axios from "axios";

export function getApiClient() {
  const fallback = "http://localhost:8000";
  const base = process.env.NEXT_PUBLIC_API_BASE || fallback;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  const client = axios.create({ 
    baseURL: base, 
    headers,
    timeout: 10000 // 10 second timeout
  });

  // Add response interceptor to handle authentication errors
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear invalid token and redirect to login
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("tenant");
          localStorage.removeItem("user");
          window.location.href = "/";
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}
