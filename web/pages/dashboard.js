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
    // decode role from JWT (naive, client-side only for UI)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setRole(payload.role);
      if (payload.role === "admin") {
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
    const res = await api().post(`/tenants/${t.slug}/upgrade`);
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
        <p>
          Tenant: <b>{tenant.name}</b> — Plan: <b>{tenant.plan}</b>
        </p>
      )}

      {error && <p className="error">{error}</p>}

      {tenant?.plan === "free" && notes.length >= 3 && role === "admin" && (
        <div className="banner">
          <p>Free plan limit reached.</p>
          <button onClick={upgrade}>Upgrade to Pro</button>
        </div>
      )}

      {role === "admin" && (
        <div
          className="admin-panel"
          style={{ border: "1px solid #ddd", padding: 12, margin: "12px 0" }}
        >
          <h3>Admin Panel</h3>
          <div style={{ marginBottom: 8 }}>
            <button onClick={upgrade}>Upgrade to Pro</button>
          </div>
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
                <li key={u.id}>
                  {u.email} — {u.role}
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
