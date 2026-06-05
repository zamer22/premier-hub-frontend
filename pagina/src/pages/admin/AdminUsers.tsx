import { useCallback, useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

type AdminUser = { id_usuario: number };
type Restriction = {
  id: number;
  id_usuario: number;
  reason: string | null;
  usuario?: any;
};
type FlaggedUser = {
  id_usuario: number;
  nickname?: string;
  nombre_usuario?: string;
  correo?: string;
  alert_count: number;
  restriction?: Restriction | null;
};

function nameOf(user: any) {
  return user?.nickname || user?.nombre_usuario || user?.correo || `Usuario #${user?.id_usuario}`;
}

export default function AdminUsers({ user }: { user: AdminUser }) {
  const [users, setUsers] = useState<FlaggedUser[]>([]);
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [manualUserId, setManualUserId] = useState("");
  const [reason, setReason] = useState("Moderacion del foro");
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
    const json = await adminFetch("/forum/users");
    setUsers(json.data?.users || []);
    setRestrictions(json.data?.restrictions || []);
  }, [adminFetch]);

  useEffect(() => {
    void load().catch((error) => show(error.message));
  }, [load]);

  const ban = async (targetUserId: number) => {
    await adminFetch(`/forum/users/${targetUserId}/restrictions`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    show("Usuario restringido del foro");
    await load();
  };

  const unban = async (restrictionId: number) => {
    await adminFetch(`/forum/restrictions/${restrictionId}`, { method: "DELETE" });
    show("Restriccion removida");
    await load();
  };

  return (
    <div className="adm-forum adm-users">
      {toast && <div className="adm-toast adm-toast--ok">{toast}</div>}
      <section className="adm-forum-hero">
        <div>
          <p>Usuarios</p>
          <h2>Bans y alertas</h2>
          <span>Por ahora el ban bloquea publicar y comentar en foro; el modelo queda listo para scopes futuros.</span>
        </div>
        <strong>{restrictions.length} activos</strong>
      </section>

      <section className="adm-forum-panel">
        <h3>Aplicar restriccion manual</h3>
        <div className="adm-forum-form is-row">
          <input value={manualUserId} onChange={(event) => setManualUserId(event.target.value)} placeholder="ID usuario" />
          <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo" />
          <button onClick={() => ban(Number(manualUserId))} disabled={!Number(manualUserId)}>Ban foro</button>
        </div>
      </section>

      <section className="adm-forum-grid">
        <div className="adm-forum-panel">
          <h3>Usuarios con alertas</h3>
          <div className="adm-forum-list">
            {users.map((item) => (
              <article key={item.id_usuario}>
                <b>{nameOf(item)}</b>
                <span>{item.alert_count} alertas AI</span>
                {item.restriction ? (
                  <button onClick={() => unban(item.restriction!.id)}>Quitar ban</button>
                ) : (
                  <button onClick={() => ban(item.id_usuario)}>Ban foro</button>
                )}
              </article>
            ))}
            {users.length === 0 && <p className="adm-forum-empty">Sin alertas acumuladas.</p>}
          </div>
        </div>

        <div className="adm-forum-panel">
          <h3>Restricciones activas</h3>
          <div className="adm-forum-list">
            {restrictions.map((item) => (
              <article key={item.id}>
                <b>{nameOf(item.usuario)} · #{item.id_usuario}</b>
                <span>{item.reason || "Sin motivo"}</span>
                <button onClick={() => unban(item.id)}>Quitar ban</button>
              </article>
            ))}
            {restrictions.length === 0 && <p className="adm-forum-empty">No hay bans activos.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
