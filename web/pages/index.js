import { useState } from "react";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE}/auth/login`,
        { email, password }
      );
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("tenant", JSON.stringify(res.data.tenant));
      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Invalid credentials");
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🔐 Welcome to Notes</h1>
      </div>
      
      <div className="new-note">
        <h3>🚀 Sign In</h3>
        <form onSubmit={onSubmit}>
          <input
            placeholder="📧 Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
          <input
            placeholder="🔒 Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="add-btn" type="submit">
            🚀 Login
          </button>
          {error && <p className="error">{error}</p>}
        </form>
        
        <div style={{ marginTop: "20px", padding: "15px", background: "rgba(255,255,255,0.1)", borderRadius: "10px" }}>
          <h4 style={{ color: "white", marginBottom: "10px" }}>🧪 Test Accounts:</h4>
          <p style={{ color: "white", fontSize: "0.9rem", margin: "5px 0" }}>
            <strong>Admin:</strong> admin@acme.test / admin@globex.test
          </p>
          <p style={{ color: "white", fontSize: "0.9rem", margin: "5px 0" }}>
            <strong>Member:</strong> user@acme.test / user@globex.test
          </p>
          <p style={{ color: "white", fontSize: "0.9rem", margin: "5px 0" }}>
            <strong>Password:</strong> password
          </p>
        </div>
      </div>
    </div>
  );
}
