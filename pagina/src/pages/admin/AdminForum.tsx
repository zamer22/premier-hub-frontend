import { useCallback, useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

type AdminUser = { id_usuario: number };
type Subforum = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
};
type ModerationItem = {
  id: number;
  target_type: string;
  target_id: number;
  categories: Record<string, boolean>;
  usuario?: any;
  target?: any;
};
type ReportItem = {
  id: number;
  target_type: string;
  target_id: number;
  reason: string;
  status: string;
  usuario?: any;
  target?: any;
};

function getName(user?: any) {
  return user?.nickname || user?.nombre_usuario || user?.correo || "Usuario";
}

function flaggedCategories(item: ModerationItem) {
  return Object.entries(item.categories || {})
    .filter(([, value]) => value)
    .map(([key]) => key)
    .join(", ") || "marcado";
}

export default function AdminForum({ user }: { user: AdminUser }) {
  const [subforums, setSubforums] = useState<Subforum[]>([]);
  const [moderation, setModeration] = useState<ModerationItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [toast, setToast] = useState("");

  const adminFetch = useCallback(async (path: string, init: RequestInit = {}) => {
    const joiner = path.includes("?") ? "&" : "?";
    const headers = new Headers(init.headers);
    headers.set("x-id-usuario", String(user.id_usuario));
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

    const res = await fetch(`${API_URL}/api/admin${path}${joiner}id_usuario=${user.id_usuario}`, {
      ...init,
      credentials: "include",
      headers,
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || "Error");
    return json;
  }, [user.id_usuario]);

  const show = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2600);
  };

  const load = useCallback(async () => {
    const [subforumsResponse, moderationResponse, reportsResponse] = await Promise.all([
      adminFetch("/forum/subforos"),
      adminFetch("/forum/moderation"),
      adminFetch("/forum/reports"),
    ]);
    setSubforums(subforumsResponse.data || []);
    setModeration(moderationResponse.data || []);
    setReports(reportsResponse.data || []);
  }, [adminFetch]);

  useEffect(() => {
    void load().catch((error) => show(error.message));
  }, [load]);

  const createSubforum = async () => {
    await adminFetch("/forum/subforos", { method: "POST", body: JSON.stringify(form) });
    setForm({ name: "", slug: "", description: "" });
    show("Subforo creado");
    await load();
  };

  const review = async (eventId: number, action: "approve" | "reject") => {
    await adminFetch(`/forum/moderation/${eventId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
    show(action === "approve" ? "Contenido aprobado" : "Contenido rechazado");
    await load();
  };

  const markReport = async (id: number, action: "approve" | "block") => {
    await adminFetch(`/forum/reports/${id}`, {
      method: "PUT",
      body: JSON.stringify({ action }),
    });
    show(action === "approve" ? "Contenido aprobado" : "Contenido bloqueado");
    await load();
  };

  const toggleSubforum = async (subforum: Subforum) => {
    await adminFetch(`/forum/subforos/${subforum.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !subforum.is_active }),
    });
    await load();
  };

  return (
    <div className="adm-forum">
      {toast && <div className="adm-toast adm-toast--ok">{toast}</div>}
      <section className="adm-forum-hero">
        <div>
          <p>Moderación</p>
          <h2>Foro PremierHub</h2>
          <span>Revisa alertas, reportes y comunidades.</span>
        </div>
        <strong>{moderation.length} pendiente{moderation.length === 1 ? "" : "s"}</strong>
      </section>

      <section className="adm-forum-grid">
        <div className="adm-forum-panel">
          <h3>Subforos</h3>
          <div className="adm-forum-form">
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nombre" />
            <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="slug-opcional" />
            <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Descripción" />
            <button onClick={createSubforum} disabled={!form.name.trim()}>Crear</button>
          </div>
          <div className="adm-forum-list">
            {subforums.map((subforum) => (
              <article key={subforum.id}>
                <b>/{subforum.slug}</b>
                <span>{subforum.name}</span>
                <button onClick={() => toggleSubforum(subforum)}>
                  {subforum.is_active ? "Desactivar" : "Activar"}
                </button>
              </article>
            ))}
          </div>
        </div>

        <div className="adm-forum-panel">
          <h3>Cola de revisión IA</h3>
          <div className="adm-forum-list">
            {moderation.map((item) => (
              <article key={item.id}>
                <b>{item.target_type} #{item.target_id} · {getName(item.usuario)}</b>
                <span>{flaggedCategories(item)}</span>
                <p>{item.target?.title || item.target?.body}</p>
                {item.target?.image_url && <img src={item.target.image_url} alt="" />}
                <div>
                  <button onClick={() => review(item.id, "approve")}>Aprobar</button>
                  <button className="is-danger" onClick={() => review(item.id, "reject")}>Rechazar</button>
                </div>
              </article>
            ))}
            {moderation.length === 0 && <p className="adm-forum-empty">Sin alertas pendientes.</p>}
          </div>
        </div>
      </section>

      <section className="adm-forum-panel">
        <h3>Reportes manuales</h3>
        <div className="adm-forum-list is-wide">
          {reports.map((report) => (
            <article key={report.id}>
              <b>{report.target_type} #{report.target_id} · {getName(report.usuario)}</b>
              <span>{report.reason}</span>
              <p>{report.target?.title || report.target?.body}</p>
              <div>
                <button onClick={() => markReport(report.id, "approve")}>Aprobar contenido</button>
                <button className="is-danger" onClick={() => markReport(report.id, "block")}>Bloquear contenido</button>
              </div>
            </article>
          ))}
          {reports.length === 0 && <p className="adm-forum-empty">Sin reportes.</p>}
        </div>
      </section>
    </div>
  );
}
