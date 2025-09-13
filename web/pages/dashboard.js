import { useEffect, useState } from "react";
import { getApiClient } from "../services/api";

const api = () => getApiClient();

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tenant, setTenant] = useState(null);
  const [error, setError] = useState(null);
  const [role, setRole] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteMsg, setInviteMsg] = useState("");
  const [users, setUsers] = useState([]);

  async function fetchNotes() {
    const res = await api().get(`/notes`);
    setNotes(res.data.notes || []);
    setTenant(JSON.parse(localStorage.getItem("tenant")));
    const t = JSON.parse(localStorage.getItem("tenant"));
    const token = localStorage.getItem("token");
    // Get user data from localStorage (more reliable than JWT parsing)
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setRole(userData.role);
      setUserPlan(userData.plan || "free");
      if (userData.role === "admin") {
        // load users list for admin
        loadUsers();
      }
    } catch {}
  }

  useEffect(() => {
    fetchNotes().catch(() => setError("Failed to load"));
  }, []);

  async function addNote() {
    try {
      await api().post(`/notes`, { title, content });
      setTitle("");
      setContent("");
      fetchNotes();
    } catch (e) {
      if (e.response?.data?.error === "free_limit_reached")
        setError("Free plan limit reached");
      else setError("Failed to create");
    }
  }

  async function removeNote(id) {
    await api().delete(`/notes/${id}`);
    fetchNotes();
  }

  async function upgrade() {
    const t = JSON.parse(localStorage.getItem("tenant"));
    const newPlan = t.plan === "free" ? "pro" : "free";
    const res = await api().post(`/tenants/${t.slug}/upgrade`, {
      plan: newPlan,
    });
    localStorage.setItem("tenant", JSON.stringify(res.data));
    setTenant(res.data);
  }

  function logout() {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("tenant");
    } catch {}
    window.location.href = "/";
  }

  async function invite() {
    setInviteMsg("");
    try {
      const t = JSON.parse(localStorage.getItem("tenant"));
      await api().post(`/tenants/${t.slug}/invite`, {
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteMsg(
        `Invited ${inviteEmail} as ${inviteRole} (password: password)`
      );
      setInviteEmail("");
      setInviteRole("member");
      await loadUsers();
    } catch (e) {
      const reason = e.response?.data?.error || "failed";
      setInviteMsg(`Invite ${reason}`);
    }
  }

  async function loadUsers() {
    try {
      const t = JSON.parse(localStorage.getItem("tenant"));
      const res = await api().get(`/tenants/${t.slug}/users`);
      setUsers(res.data.users || []);
    } catch {}
  }

  async function toggleUserPlan(userId) {
    try {
      const t = JSON.parse(localStorage.getItem("tenant"));
      const res = await api().post(
        `/tenants/${t.slug}/users/${userId}/toggle-plan`
      );
      // Update the user in the local state
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, plan: res.data.plan } : u))
      );

      // If this is the current user, update their plan in localStorage
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (currentUser.id === userId) {
        const updatedUser = { ...currentUser, plan: res.data.plan };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUserPlan(res.data.plan);
      }
    } catch (e) {
      setError("Failed to toggle user plan");
    }
  }

  async function deleteUser(userId, userEmail) {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"? This will also delete all their notes.`)) {
      return;
    }
    
    try {
      const t = JSON.parse(localStorage.getItem("tenant"));
      await api().delete(`/tenants/${t.slug}/users/${userId}`);
      // Remove user from local state
      setUsers(users.filter(u => u.id !== userId));
      setError(""); // Clear any previous errors
    } catch (e) {
      const reason = e.response?.data?.error || "failed";
      setError(`Delete ${reason}`);
    }
  }

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Notes</h1>
        <button onClick={logout}>Logout</button>
      </div>
      {tenant && (
        <div style={{ marginBottom: "16px" }}>
          <p>
            Tenant: <b>{tenant.name}</b> — Plan: <b>{tenant.plan}</b>
          </p>
          <p>
            Your Profile: <b>{role}</b> — Your Plan: <b>{userPlan}</b>
          </p>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {userPlan === "free" && notes.length >= 3 && (
        <div className="banner">
          <p>
            Free plan limit reached. Contact your admin to upgrade your plan.
          </p>
        </div>
      )}

      {role === "admin" && (
        <div
          className="admin-panel"
          style={{ border: "1px solid #ddd", padding: 12, margin: "12px 0" }}
        >
          <h3>Admin Panel</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Invite user email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={invite}>Invite</button>
          </div>
          {inviteMsg && <p>{inviteMsg}</p>}
          <div style={{ marginTop: 8 }}>
            <button onClick={loadUsers}>Refresh Users</button>
            <ul>
              {users.map((u) => (
                <li
                  key={u.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    margin: "4px 0",
                  }}
                >
                  <span>
                    {u.email} — {u.role} — Plan: {u.plan}
                  </span>
                  {u.role === "admin" ? (
                    <span style={{ color: "#666", fontSize: "12px" }}>
                      Admin (Always Pro)
                    </span>
                  ) : (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button
                        onClick={() => toggleUserPlan(u.id)}
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          backgroundColor:
                            u.plan === "free" ? "#4CAF50" : "#f44336",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                        }}
                      >
                        {u.plan === "free"
                          ? "Upgrade to Pro"
                          : "Downgrade to Free"}
                      </button>
                      <button
                        onClick={() => deleteUser(u.id, u.email)}
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          backgroundColor: "#ff4444",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="new-note">
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button onClick={addNote}>Add</button>
      </div>

      <ul>
        {notes.map((n) => (
          <li key={n.id}>
            <b>{n.title}</b>
            <p>{n.content}</p>
            <button onClick={() => removeNote(n.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
