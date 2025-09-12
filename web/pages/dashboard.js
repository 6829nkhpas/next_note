import { useEffect, useState } from "react";
import axios from "axios";

function api() {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return axios.create({ baseURL: base, headers });
}

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tenant, setTenant] = useState(null);
  const [error, setError] = useState(null);

  async function fetchNotes() {
    const res = await api().get(`/notes`);
    setNotes(res.data.notes || []);
    setTenant(JSON.parse(localStorage.getItem("tenant")));
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
      if (e.response?.data?.error === "free_limit_reached") setError("Free plan limit reached");
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

  return (
    <div className="container">
      <h1>Notes</h1>
      {tenant && (
        <p>
          Tenant: <b>{tenant.name}</b> — Plan: <b>{tenant.plan}</b>
        </p>
      )}

      {error && <p className="error">{error}</p>}

      {tenant?.plan === "free" && notes.length >= 3 && (
        <div className="banner">
          <p>Free plan limit reached.</p>
          <button onClick={upgrade}>Upgrade to Pro</button>
        </div>
      )}

      <div className="new-note">
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} />
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
