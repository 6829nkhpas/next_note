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
    // Handle both wrapped ({ notes: [...] }) and direct array responses
    setNotes(res.data.notes || res.data || []);
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
    if (
      !confirm(
        `Are you sure you want to delete user "${userEmail}"? This will also delete all their notes.`
      )
    ) {
      return;
    }

    try {
      const t = JSON.parse(localStorage.getItem("tenant"));
      await api().delete(`/tenants/${t.slug}/users/${userId}`);
      // Remove user from local state
      setUsers(users.filter((u) => u.id !== userId));
      setError(""); // Clear any previous errors
    } catch (e) {
      const reason = e.response?.data?.error || "failed";
      setError(`Delete ${reason}`);
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>📝 Notes Dashboard</h1>
        <button className="logout-btn" onClick={logout}>
          🚪 Logout
        </button>
      </div>

      {tenant && (
        <div className="profile-info">
          <p>
            🏢 Tenant: <b>{tenant.name}</b> — 👤 Your Role: <b>{role}</b> — 💎
            Your Plan: <b>{userPlan}</b>
          </p>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {userPlan === "free" && notes.length >= 3 && (
        <div className="banner">
          <p>
            ⚠️ Free plan limit reached. Contact your admin to upgrade your plan.
          </p>
        </div>
      )}

      {role === "admin" && (
        <div className="admin-panel">
          <h3>👑 Admin Panel</h3>
          <div className="invite-form">
            <input
              placeholder="📧 Invite user email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="member">👤 Member</option>
              <option value="admin">👑 Admin</option>
            </select>
            <button className="invite-btn" onClick={invite}>
              ➕ Invite
            </button>
          </div>
          {inviteMsg && <p className="invite-msg">{inviteMsg}</p>}
          <div>
            <button className="refresh-btn" onClick={loadUsers}>
              🔄 Refresh Users
            </button>
            <ul className="users-list">
              {users.map((u) => (
                <li key={u.id} className="user-item">
                  <span className="user-info">
                    📧 {u.email} — 👤 {u.role} — 💎 Plan: {u.plan}
                  </span>
                  {u.role === "admin" ? (
                    <span className="admin-badge">👑 Admin (Always Pro)</span>
                  ) : (
                    <div className="user-actions">
                      <button
                        className={`action-btn ${
                          u.plan === "free" ? "upgrade-btn" : "downgrade-btn"
                        }`}
                        onClick={() => toggleUserPlan(u.id)}
                      >
                        {u.plan === "free"
                          ? "⬆️ Upgrade to Pro"
                          : "⬇️ Downgrade to Free"}
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => deleteUser(u.id, u.email)}
                      >
                        🗑️ Delete
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
        <h3>✨ Create New Note</h3>
        <input
          placeholder="📝 Note title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="📄 Write your note content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="4"
        />
        <button className="add-btn" onClick={addNote}>
          ➕ Add Note
        </button>
      </div>

      <ul className="notes-list">
        {notes.map((n) => (
          <li key={n.id || n._id} className="note-item">
            <div className="note-title">{n.title || "Untitled Note"}</div>
            <div className="note-content">{n.content || "No content"}</div>
            <button
              className="note-delete-btn"
              onClick={() => removeNote(n.id || n._id)}
            >
              🗑️ Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
