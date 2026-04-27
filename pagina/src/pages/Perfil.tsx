import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";

const API_URL = import.meta.env.VITE_API_URL;

interface User {
  id_usuario: number;
  nickname?: string;
  nombre_usuario?: string;
  correo?: string;
  dinero?: number | string;
  created_at?: string;
  fecha_creacion?: string;
  [key: string]: any;
}

interface InventarioItem {
  id_inventario: number;
  nombre: string;
  tipo: string;
  equipo: string | null;
  imagen: string | null;
  fecha_compra?: string;
  en_marketplace: boolean;
}

interface Listado {
  id_listado: number;
  precio: string;
  nombre: string;
  tipo: string;
  imagen: string | null;
  equipo: string | null;
  fecha_creacion: string;
}

interface PerfilProps {
  user: User;
  profileImage?: string;
  onGoToStore: () => void;
}

function tipoLabel(tipo: string) {
  const map: Record<string, string> = {
    jersey: "Jersey",
    balonazo: "Balon",
    ropa: "Ropa",
    accesorio: "Accesorio",
    banner: "Banner",
    marco: "Marco",
    foto_perfil: "Foto de perfil",
    avatar: "Avatar",
  };
  return map[tipo] || tipo.charAt(0).toUpperCase() + tipo.slice(1).replace(/_/g, " ");
}

function formatDate(value?: string) {
  if (!value) return "No disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No disponible";
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function initials(user: User) {
  const source = user.nickname || user.nombre_usuario || user.correo || "PH";
  return source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "PH";
}

function getUserImage(user: User) {
  return user.foto_perfil_url || user.foto_perfil || user.avatar_url || user.avatar || user.imagen_perfil || "";
}

function getInventoryProfileImage(items: InventarioItem[]) {
  const preferred = items.find((item) =>
    ["foto_perfil", "avatar"].includes(item.tipo) && item.imagen
  );
  const fallback = items.find((item) =>
    ["foto_perfil", "avatar", "marco", "banner"].includes(item.tipo) && item.imagen
  );
  return preferred?.imagen || fallback?.imagen || "";
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18 }}>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18 }}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 12h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18 }}>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m4.5 8 7.5 4.2L19.5 8M12 12.2V21" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export default function Perfil({ user, profileImage, onGoToStore }: PerfilProps) {
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [listados, setListados] = useState<Listado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadProfileData() {
      setLoading(true);
      try {
        const [itemsRes, listadosRes] = await Promise.all([
          fetch(`${API_URL}/api/tienda/mis-items/${user.id_usuario}`),
          fetch(`${API_URL}/api/marketplace/listados?mios=${user.id_usuario}`),
        ]);
        const [itemsData, listadosData] = await Promise.all([itemsRes.json(), listadosRes.json()]);
        if (!active) return;
        if (itemsData.success) setItems(itemsData.data || []);
        if (listadosData.success) setListados(listadosData.data || []);
      } catch {
        if (!active) return;
        setItems([]);
        setListados([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfileData();
    return () => {
      active = false;
    };
  }, [user.id_usuario]);

  const saldo = Number(user.dinero) || 0;
  const profileItems = useMemo(() => items.filter((item) => item.tipo !== "real"), [items]);
  const latestItems = useMemo(() => items.slice(0, 6), [items]);
  const accountDate = user.created_at || user.fecha_creacion;
  const displayImage = profileImage || getUserImage(user) || getInventoryProfileImage(items);

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <section
        style={{
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid #e7e9ee",
          overflow: "hidden",
          boxShadow: "0 2px 10px rgba(38,58,85,0.06)",
        }}
      >
        <div
          style={{
            minHeight: "150px",
            background: "linear-gradient(135deg, #263a55 0%, #871d54 58%, #E90052 100%)",
            padding: "1.5rem",
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", width: "100%" }}>
            <div
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "14px",
                background: displayImage ? "#fff" : "#fff",
                color: "#263a55",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.8rem",
                fontWeight: 900,
                boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
                flex: "0 0 auto",
                overflow: "hidden",
              }}
            >
              {displayImage
                ? <img src={displayImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                : initials(user)}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Perfil PremierHub
              </p>
              <h1 style={{ margin: "0.15rem 0 0", color: "#fff", fontSize: "2rem", lineHeight: 1.05, fontWeight: 900 }}>
                {user.nickname || user.nombre_usuario || "Usuario"}
              </h1>
              <p style={{ margin: "0.35rem 0 0", color: "rgba(255,255,255,0.72)", fontSize: "0.88rem" }}>
                {user.correo || "Correo no disponible"}
              </p>
            </div>
          </div>
        </div>

        <div style={{ padding: "1.25rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.8rem" }}>
          <Metric icon={<WalletIcon />} label="Puntos disponibles" value={`${saldo.toLocaleString()} pts`} />
          <Metric icon={<BoxIcon />} label="Items en inventario" value={String(items.length)} />
          <Metric icon={<UserIcon />} label="Objetos de perfil" value={String(profileItems.length)} />
          <Metric icon={<BoxIcon />} label="Publicaciones activas" value={String(listados.length)} />
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 0.85fr) minmax(0, 1.45fr)", gap: "1.25rem", alignItems: "start" }}>
        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h2 style={panelTitleStyle}>Datos de cuenta</h2>
            <span style={badgeStyle}>Activa</span>
          </div>
          <InfoRow label="Nombre" value={user.nombre_usuario || user.nickname || "No disponible"} />
          <InfoRow label="Nickname" value={user.nickname || "No disponible"} />
          <InfoRow label="Correo" value={user.correo || "No disponible"} />
          <InfoRow label="Miembro desde" value={formatDate(accountDate)} />
          <button
            onClick={onGoToStore}
            style={{
              width: "100%",
              marginTop: "1rem",
              padding: "0.72rem 1rem",
              borderRadius: "8px",
              border: "1px solid #E90052",
              background: "#E90052",
              color: "#fff",
              fontWeight: 800,
              fontSize: "0.86rem",
            }}
          >
            Ver tienda
          </button>
        </section>

        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <h2 style={panelTitleStyle}>Inventario reciente</h2>
              <p style={{ margin: "0.2rem 0 0", color: "#84878F", fontSize: "0.78rem" }}>
                Tus ultimos objetos comprados y coleccionables.
              </p>
            </div>
          </div>

          {loading ? (
            <p style={{ color: "#84878F", fontSize: "0.88rem" }}>Cargando perfil...</p>
          ) : latestItems.length === 0 ? (
            <div style={{ padding: "2rem 1rem", textAlign: "center", color: "#84878F", border: "1px dashed #cfd5de", borderRadius: "10px" }}>
              <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#263a55" }}>Todavia no tienes items</p>
              <p style={{ margin: "0.3rem 0 0", fontSize: "0.8rem" }}>Compra tu primer objeto en la tienda.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "0.85rem" }}>
              {latestItems.map((item) => (
                <article key={item.id_inventario} style={itemCardStyle}>
                  <div
                    style={{
                      height: "92px",
                      borderRadius: "8px",
                      background: item.imagen ? `#f2f4f7 url(${item.imagen}) center/contain no-repeat` : "linear-gradient(135deg, #263a55, #871d54)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "0.65rem",
                    }}
                  >
                    {!item.imagen && <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>{tipoLabel(item.tipo)}</span>}
                  </div>
                  <p style={{ margin: 0, color: "#263a55", fontWeight: 800, fontSize: "0.82rem", lineHeight: 1.3 }}>{item.nombre}</p>
                  <p style={{ margin: "0.25rem 0 0", color: "#84878F", fontSize: "0.72rem" }}>
                    {tipoLabel(item.tipo)}{item.equipo ? ` - ${item.equipo}` : ""}
                  </p>
                  {item.en_marketplace && <span style={marketBadgeStyle}>En marketplace</span>}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#f7f8fa", border: "1px solid #eceff3", borderRadius: "10px", padding: "0.8rem" }}>
      <div style={{ width: 38, height: 38, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "#263a55", color: "#fff", flex: "0 0 auto" }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, color: "#84878F", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
        <p style={{ margin: "0.12rem 0 0", color: "#263a55", fontSize: "1rem", fontWeight: 900 }}>{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "0.85rem 0", borderBottom: "1px solid #edf0f4" }}>
      <p style={{ margin: 0, color: "#84878F", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      <p style={{ margin: "0.24rem 0 0", color: "#263a55", fontSize: "0.9rem", fontWeight: 700, overflowWrap: "anywhere" }}>{value}</p>
    </div>
  );
}

const panelStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e7e9ee",
  borderRadius: "12px",
  padding: "1.15rem",
  boxShadow: "0 2px 10px rgba(38,58,85,0.05)",
};

const panelHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  marginBottom: "0.85rem",
};

const panelTitleStyle: CSSProperties = {
  margin: 0,
  color: "#263a55",
  fontSize: "1.05rem",
  fontWeight: 900,
};

const badgeStyle: CSSProperties = {
  background: "#dcfce7",
  color: "#16803c",
  borderRadius: "999px",
  padding: "0.25rem 0.65rem",
  fontSize: "0.7rem",
  fontWeight: 800,
};

const itemCardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #edf0f4",
  borderRadius: "10px",
  padding: "0.65rem",
  minHeight: "172px",
};

const marketBadgeStyle: CSSProperties = {
  display: "inline-flex",
  marginTop: "0.55rem",
  padding: "0.18rem 0.45rem",
  borderRadius: "5px",
  background: "#fff1f5",
  color: "#E90052",
  fontSize: "0.66rem",
  fontWeight: 800,
};
