import { useEffect, useMemo, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./Perfil.css";

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
  id_producto?: number;
  nombre: string;
  tipo: string;
  equipo: string | null;
  imagen: string | null;
  descripcion?: string | null;
  rareza?: string | null;
  css?: string | null;
  metadata?: Record<string, any> | null;
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
  onLogout: () => Promise<void> | void;
  onUserUpdated: (user: User) => void;
  onProfileImageChanged: (image: string) => void;
  onCustomizationChanged: (customization: ProfileCustomization & { marcoItem?: InventarioItem | null; bannerItem?: InventarioItem | null }) => void;
  onAccountDeleted: () => void;
}

type EquipSlot = "marco" | "titulo" | "banner";
type FilterType = "todos" | "marco" | "titulo" | "trofeo" | "foto_perfil" | "banner" | "otros";

type ProfileCustomization = {
  marco_inventario_id?: number | null;
  titulo_inventario_id?: number | null;
  banner_inventario_id?: number | null;
  trofeo_inventario_id?: number | null;
};

function tipoLabel(tipo: string) {
  const map: Record<string, string> = {
    jersey: "Jersey",
    balonazo: "Balon",
    ropa: "Ropa",
    accesorio: "Accesorio",
    banner: "Banner",
    marco: "Marco",
    titulo: "Titulo",
    trofeo: "Trofeo",
    achievement: "Achievement",
    foto_perfil: "Postcard",
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
  const preferred = items.find((item) => item.tipo === "foto_perfil" && item.imagen);
  const fallback = items.find((item) => ["foto_perfil", "marco", "banner"].includes(item.tipo) && item.imagen);
  return preferred?.imagen || fallback?.imagen || "";
}

function getFrameStyle(item?: InventarioItem | null): CSSProperties {
  const metadata = item?.metadata || {};
  const cssBackground = item?.css || metadata.background || metadata.css_background;

  if (cssBackground) {
    return { background: String(cssBackground) };
  }

  if (item?.imagen) {
    return { background: `#fff url(${item.imagen}) center/cover no-repeat` };
  }

  return { background: "#d6dbe3" };
}

function getBannerStyle(item?: InventarioItem | null): CSSProperties {
  const metadata = item?.metadata || {};
  const cssBackground = item?.css || metadata.background || metadata.css_background;

  if (cssBackground) {
    return { background: String(cssBackground) };
  }

  if (item?.imagen) {
    return { background: `linear-gradient(90deg, rgba(38,58,85,0.72), rgba(233,0,82,0.5)), url(${item.imagen}) center/cover no-repeat` };
  }

  return {};
}

function getItemByInventoryId(items: InventarioItem[], id?: number | null) {
  if (!id) return null;
  return items.find((item) => Number(item.id_inventario) === Number(id)) || null;
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

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18 }}>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Perfil({ user, profileImage, onLogout, onUserUpdated, onProfileImageChanged, onCustomizationChanged, onAccountDeleted }: PerfilProps) {
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [listados, setListados] = useState<Listado[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("todos");
  const [panelView, setPanelView] = useState<"objetos" | "ajustes">("objetos");
  const [editing, setEditing] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState(user.nombre_usuario || "");
  const [nickname, setNickname] = useState(user.nickname || "");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [customization, setCustomization] = useState<ProfileCustomization>({});
  const [selectedItem, setSelectedItem] = useState<InventarioItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteText, setDeleteText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Detecta si el usuario inicia sesion con contrasena o con Google. Si usa contrasena
  // (campo no vacio en BD), el flujo de eliminar cuenta exige reingresarla.
  const usesPassword = Boolean(user.contrasena && String(user.contrasena).length > 0);

  useEffect(() => {
    let active = true;
    async function loadProfileData() {
      setLoading(true);
      try {
        const [itemsRes, listadosRes] = await Promise.all([
          fetch(`${API_URL}/api/tienda/mis-items`, { credentials: "include" }),
          fetch(`${API_URL}/api/marketplace/listados?mios=true`, { credentials: "include" }),
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
    fetch(`${API_URL}/api/auth/profile/customization`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success) setCustomization(data.data || {});
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [user.id_usuario]);

  useEffect(() => {
    setNombreUsuario(user.nombre_usuario || "");
    setNickname(user.nickname || "");
  }, [user.nombre_usuario, user.nickname]);

  const saldo = Number(user.dinero) || 0;
  const profileItems = useMemo(() => items.filter((item) => item.tipo !== "real" && item.tipo !== "avatar"), [items]);
  const accountDate = user.created_at || user.fecha_creacion;
  const displayImage = profileImage || getUserImage(user) || getInventoryProfileImage(items);
  const activeFrame = getItemByInventoryId(items, customization.marco_inventario_id);
  const activeTitle = getItemByInventoryId(items, customization.titulo_inventario_id);
  const activeBanner = getItemByInventoryId(items, customization.banner_inventario_id);
  const deletePhrase = `ELIMINAR ${user.nickname || ""}`;
  const canDelete =
    deleteText === deletePhrase &&
    deleteAcknowledged &&
    !deleteLoading &&
    (!usesPassword || deletePassword.length > 0);

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "marco", label: "Marcos" },
    { key: "titulo", label: "Titulos" },
    { key: "trofeo", label: "Trofeos" },
    { key: "foto_perfil", label: "Postcards" },
    { key: "banner", label: "Banners" },
    { key: "otros", label: "Otros" },
  ];

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return profileItems.filter((item) => {
      const matchesText = !normalizedQuery ||
        item.nombre.toLowerCase().includes(normalizedQuery) ||
        item.tipo.toLowerCase().includes(normalizedQuery) ||
        (item.equipo || "").toLowerCase().includes(normalizedQuery);
      const isKnownType = ["marco", "titulo", "trofeo", "foto_perfil", "banner"].includes(item.tipo);
      const matchesType = filterType === "todos" ||
        item.tipo === filterType ||
        (filterType === "otros" && !isKnownType);
      return matchesText && matchesType;
    });
  }, [profileItems, query, filterType]);

  const updateCustomization = async (slot: EquipSlot, item: InventarioItem) => {
    const key = `${slot}_inventario_id` as keyof ProfileCustomization;
    const next = { ...customization, [key]: item.id_inventario };
    setCustomization(next);
    onCustomizationChanged({
      ...next,
      marcoItem: slot === "marco" ? item : activeFrame,
      bannerItem: slot === "banner" ? item : activeBanner,
    });

    const res = await fetch(`${API_URL}/api/auth/profile/customization`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: item.id_inventario }),
    });
    const data = await res.json();

    if (!data.success) {
      setSaveMessage(data.error || "No se pudo equipar el item");
      return;
    }

    setCustomization(data.data || next);
    setSaveMessage(`${item.nombre} equipado`);
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSaveMessage("El archivo debe ser una imagen");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage("La imagen debe pesar menos de 5 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const image = String(reader.result || "");
      try {
        const res = await fetch(`${API_URL}/api/auth/profile/photo`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData: image, fileName: file.name }),
        });
        const data = await res.json();

        if (!data.success) {
          setSaveMessage(data.error || "No se pudo subir la foto");
          return;
        }

        onProfileImageChanged(data.url);
        onUserUpdated(data.user);
        setSaveMessage("Foto de perfil actualizada");
      } catch {
        setSaveMessage("No se pudo conectar con el servidor");
      }
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setSaveLoading(true);
    setSaveMessage("");
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_usuario: nombreUsuario, nickname }),
      });
      const data = await res.json();
      if (!data.success) {
        setSaveMessage(data.error || "No se pudo guardar el perfil");
        return;
      }
      onUserUpdated(data.user);
      setEditing(false);
      setSaveMessage("Datos actualizados");
    } catch {
      setSaveMessage("No se pudo conectar con el servidor");
    } finally {
      setSaveLoading(false);
    }
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setDeleteModalOpen(false);
    setDeleteStep(1);
    setDeleteText("");
    setDeletePassword("");
    setDeleteAcknowledged(false);
    setDeleteError("");
  };

  const deleteAccount = async () => {
    if (!canDelete) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const body: Record<string, string> = { confirmacion: deletePhrase };
      if (usesPassword) body.contrasena = deletePassword;

      const res = await fetch(`${API_URL}/api/auth/account`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        setDeleteError(data.error || "No se pudo eliminar la cuenta");
        return;
      }
      onAccountDeleted();
    } catch {
      setDeleteError("No se pudo conectar con el servidor");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="ph-page animate-fade-in">
      {deleteModalOpen && createPortal(
        <DeleteAccountModal
          user={user}
          step={deleteStep}
          phrase={deletePhrase}
          text={deleteText}
          password={deletePassword}
          requiresPassword={usesPassword}
          acknowledged={deleteAcknowledged}
          loading={deleteLoading}
          error={deleteError}
          canDelete={canDelete}
          onClose={closeDeleteModal}
          onStep={setDeleteStep}
          onText={setDeleteText}
          onPassword={setDeletePassword}
          onAcknowledged={setDeleteAcknowledged}
          onDelete={deleteAccount}
        />,
        document.body
      )}

      {selectedItem && createPortal(
        <InventoryItemModal
          item={selectedItem}
          equipped={Boolean(
            selectedItem.id_inventario === customization.marco_inventario_id ||
            selectedItem.id_inventario === customization.titulo_inventario_id ||
            selectedItem.id_inventario === customization.banner_inventario_id
          )}
          onClose={() => setSelectedItem(null)}
          onEquip={async (slot, item) => {
            await updateCustomization(slot, item);
            setSelectedItem(null);
          }}
        />,
        document.body
      )}

      <section style={{ ...heroStyle, ...getBannerStyle(activeBanner) }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
          <ProfileAvatar user={user} image={displayImage} frame={activeFrame} size={96} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={eyebrowStyle}>Perfil PremierHub</p>
            {editing ? (
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "0.6rem", maxWidth: 520, marginTop: "0.35rem" }}>
                <input value={nombreUsuario} onChange={(event) => setNombreUsuario(event.target.value)} placeholder="Nombre" style={heroInputStyle} />
                <input value={nickname} maxLength={20} onChange={(event) => setNickname(event.target.value.replace(/[^a-zA-Z0-9_]/g, ""))} placeholder="Nickname" style={heroInputStyle} />
              </div>
            ) : (
              <h1 style={{ margin: "0.15rem 0 0", color: "#fff", fontSize: "2rem", lineHeight: 1.05, fontWeight: 900 }}>
                {user.nickname || user.nombre_usuario || "Usuario"}
              </h1>
            )}
            <p style={{ margin: "0.35rem 0 0", color: "rgba(255,255,255,0.76)", fontSize: "0.88rem" }}>
              {activeTitle?.nombre || "Sin titulo equipado"}
            </p>
            <p style={{ margin: "0.25rem 0 0", color: "rgba(255,255,255,0.62)", fontSize: "0.76rem", fontWeight: 700 }}>
              Marco: {activeFrame?.nombre || "sin marco"} · Banner: {activeBanner?.nombre || "sin banner"}
            </p>
          </div>
        </div>
        <div style={heroActionsStyle}>
          <label style={heroButtonStyle}>
            Cambiar foto
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
          </label>
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} style={heroSecondaryButtonStyle}>Cancelar</button>
              <button onClick={saveProfile} disabled={saveLoading} style={heroButtonStyle}>{saveLoading ? "Guardando..." : "Guardar"}</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} style={heroSecondaryButtonStyle}>Editar perfil</button>
          )}
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.8rem" }}>
        <Metric icon={<WalletIcon />} label="Puntos disponibles" value={`${saldo.toLocaleString()} pts`} />
        <Metric icon={<BoxIcon />} label="Items en inventario" value={String(items.length)} />
        <Metric icon={<UserIcon />} label="Objetos de perfil" value={String(profileItems.length)} />
        <Metric icon={<BoxIcon />} label="Publicaciones activas" value={String(listados.length)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0, 1fr)", gap: "1.25rem", alignItems: "stretch" }}>
        <aside style={{ ...panelStyle, ...sidebarPanelStyle }}>
          <div style={panelHeaderStyle}>
            <h2 style={panelTitleStyle}>Perfil</h2>
            <span style={badgeStyle}>Activa</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginBottom: "1rem" }}>
            <button onClick={() => setPanelView("objetos")} style={panelView === "objetos" ? activeSideButtonStyle : sideButtonStyle}>Objetos</button>
            <button onClick={() => setPanelView("ajustes")} style={panelView === "ajustes" ? activeSideButtonStyle : sideButtonStyle}>Ajustes</button>
          </div>

          {panelView === "objetos" ? (
            <>
              <Field label="Buscar">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nombre, equipo o tipo..."
                  style={inputStyle}
                />
              </Field>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginTop: "0.85rem" }}>
                {filterOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setFilterType(option.key)}
                    style={filterType === option.key ? activeFilterButtonStyle : filterButtonStyle}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div style={sidebarHintStyle}>
              <InfoRow label="Correo" value={user.correo || "No disponible"} />
              <InfoRow label="Miembro desde" value={formatDate(accountDate)} />
            </div>
          )}
          {saveMessage && <p style={{ color: saveMessage.includes("No ") ? "var(--ph-danger-600)" : "#16803c", fontSize: "0.78rem", fontWeight: 800 }}>{saveMessage}</p>}
        </aside>

        <section style={{ ...panelStyle, minHeight: 500, height: "100%" }}>
          <div style={panelHeaderStyle}>
            <div>
              <h2 style={panelTitleStyle}>{panelView === "objetos" ? "Objetos y equipables" : "Ajustes de cuenta"}</h2>
              <p style={subtleTextStyle}>
                {panelView === "objetos" ? "Selecciona un objeto para ver sus detalles o equiparlo." : "Gestiona datos sensibles de tu cuenta."}
              </p>
            </div>
          </div>

          {panelView === "objetos" ? (
            loading ? (
              <p style={{ color: "var(--ph-muted)", fontSize: "0.88rem" }}>Cargando perfil...</p>
            ) : filteredItems.length === 0 ? (
              <div style={emptyStateStyle}>
                <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 800, color: "var(--ph-navy-700)" }}>No hay objetos con ese filtro</p>
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.8rem" }}>Compra o desbloquea objetos de perfil para verlos aqui.</p>
              </div>
            ) : (
              <div style={objectScrollStyle}>
                {filteredItems.map((item) => (
                  <InventoryCard
                    key={item.id_inventario}
                    item={item}
                    equipped={Boolean(
                      item.id_inventario === customization.marco_inventario_id ||
                      item.id_inventario === customization.titulo_inventario_id ||
                      item.id_inventario === customization.banner_inventario_id
                    )}
                    onOpen={setSelectedItem}
                  />
                ))}
              </div>
            )
          ) : (
            <div style={settingsListStyle}>
              <SettingsRow
                title="Cerrar sesion"
                description="Termina la sesion actual en este navegador sin borrar datos de la cuenta."
                action={<button onClick={onLogout} style={settingsButtonStyle}>Cerrar sesion</button>}
              />
              <SettingsRow
                title="Eliminar cuenta"
                description="Borra la cuenta y sus datos asociados. Se pedira confirmacion antes de continuar."
                danger
                action={<button onClick={() => setDeleteModalOpen(true)} style={settingsDangerButtonStyle}>Eliminar cuenta</button>}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ProfileAvatar({ user, image, frame, size }: { user: User; image: string; frame?: InventarioItem | null; size: number }) {
  return (
    <div style={{ ...avatarFrameStyle, ...getFrameStyle(frame), width: size, height: size, padding: Math.max(5, Math.round(size * 0.075)) }}>
      <div style={avatarInnerStyle}>
        {image ? (
          <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <span>{initials(user)}</span>
        )}
      </div>
    </div>
  );
}

function InventoryCard({
  item,
  equipped,
  onOpen,
}: {
  item: InventarioItem;
  equipped: boolean;
  onOpen: (item: InventarioItem) => void;
}) {
  return (
    <article style={{ ...itemCardStyle, borderColor: equipped ? "var(--ph-red-600)" : "#edf0f4" }}>
      <button type="button" onClick={() => onOpen(item)} style={itemCardButtonStyle}>
        <ItemPreview item={item} height={96} />
        <p style={{ margin: 0, color: "var(--ph-navy-700)", fontWeight: 800, fontSize: "0.82rem", lineHeight: 1.3 }}>{item.nombre}</p>
        <p style={{ margin: "0.25rem 0 0", color: "var(--ph-muted)", fontSize: "0.72rem" }}>
          {tipoLabel(item.tipo)}{item.equipo ? ` - ${item.equipo}` : ""}
        </p>
        {equipped && <span style={equippedBadgeStyle}>Equipado</span>}
      </button>
      {item.en_marketplace && <span style={marketBadgeStyle}>En marketplace</span>}
    </article>
  );
}

function ItemPreview({ item, height }: { item: InventarioItem; height: number }) {
  return (
    <div
      style={{
        height,
        borderRadius: "8px",
        background: item.tipo === "marco"
          ? getFrameStyle(item).background
          : item.tipo === "banner"
            ? getBannerStyle(item).background || "#f2f4f7"
          : item.imagen
            ? `#f2f4f7 url(${item.imagen}) center/contain no-repeat`
            : "#f2f4f7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "0.65rem",
      }}
    >
      {!item.imagen && item.tipo !== "marco" && item.tipo !== "banner" && (
        <span style={{ color: "#9aa3af", fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>
          {tipoLabel(item.tipo)}
        </span>
      )}
    </div>
  );
}

function getEquipSlot(item: InventarioItem): EquipSlot | null {
  if (item.tipo === "marco") return "marco";
  if (item.tipo === "titulo" || item.tipo === "achievement") return "titulo";
  if (item.tipo === "banner") return "banner";
  return null;
}

function InventoryItemModal({
  item,
  equipped,
  onClose,
  onEquip,
}: {
  item: InventarioItem;
  equipped: boolean;
  onClose: () => void;
  onEquip: (slot: EquipSlot, item: InventarioItem) => Promise<void> | void;
}) {
  const equipSlot = getEquipSlot(item);

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="inventory-item-title" style={inventoryModalStyle} onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="Cerrar detalle" style={closeButtonStyle}>×</button>
        <ItemPreview item={item} height={190} />
        <p style={{ margin: "0 0 0.35rem", color: "var(--ph-muted)", fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {tipoLabel(item.tipo)}{item.equipo ? ` - ${item.equipo}` : ""}
        </p>
        <h2 id="inventory-item-title" style={{ margin: 0, color: "var(--ph-navy-700)", fontSize: "1.35rem", fontWeight: 900 }}>{item.nombre}</h2>
        <p style={{ ...detailTextStyle, marginTop: "0.75rem" }}>{item.descripcion || "Sin descripcion registrada."}</p>
        <div style={detailGridStyle}>
          <span>Rareza</span><strong>{item.rareza || item.metadata?.tier || "No definida"}</strong>
          <span>Equipo</span><strong>{item.equipo || "General"}</strong>
          <span>Compra</span><strong>{formatDate(item.fecha_compra)}</strong>
          <span>Marketplace</span><strong>{item.en_marketplace ? "Publicado" : "No publicado"}</strong>
        </div>
        {equipSlot && (
          <button
            type="button"
            onClick={() => onEquip(equipSlot, item)}
            disabled={equipped}
            style={{
              ...primaryButtonStyle,
              marginTop: "1rem",
              opacity: equipped ? 0.6 : 1,
              cursor: equipped ? "default" : "pointer",
            }}
          >
            {equipped ? "Ya equipado" : "Equipar"}
          </button>
        )}
      </div>
    </div>
  );
}

function DeleteAccountModal(props: {
  user: User;
  step: number;
  phrase: string;
  text: string;
  password: string;
  requiresPassword: boolean;
  acknowledged: boolean;
  loading: boolean;
  error: string;
  canDelete: boolean;
  onClose: () => void;
  onStep: (step: number) => void;
  onText: (text: string) => void;
  onPassword: (password: string) => void;
  onAcknowledged: (value: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <div style={modalOverlayStyle} onClick={props.onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" style={modalPanelStyle} onClick={(event) => event.stopPropagation()}>
        <p style={{ margin: 0, color: "var(--ph-red-600)", fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>Zona irreversible</p>
        <h2 id="delete-account-title" style={{ margin: "0.25rem 0 0.6rem", color: "var(--ph-navy-700)", fontSize: "1.25rem", fontWeight: 900 }}>
          Eliminar cuenta definitivamente
        </h2>

        {props.step === 1 ? (
          <>
            <p style={deleteCopyStyle}>Esto borrara tu cuenta, sesion, puntos, inventario, publicaciones del marketplace y simulaciones asociadas.</p>
            <div style={deleteWarningStyle}>Antes de continuar, asegurate de que realmente quieres borrar todos los datos de <strong>{props.user.nickname}</strong>.</div>
            <div style={modalActionsStyle}>
              <button onClick={props.onClose} style={secondaryButtonStyle}>Cancelar</button>
              <button onClick={() => props.onStep(2)} style={dangerButtonStyle}>Entiendo, continuar</button>
            </div>
          </>
        ) : (
          <>
            <p style={deleteCopyStyle}>Para confirmar, escribe exactamente:</p>
            <code style={deletePhraseStyle}>{props.phrase}</code>
            <input value={props.text} onChange={(event) => props.onText(event.target.value)} placeholder={props.phrase} autoFocus style={inputStyle} />
            {props.requiresPassword && (
              <>
                <p style={{ ...deleteCopyStyle, marginTop: "0.5rem" }}>Y reingresa tu contrasena:</p>
                <input
                  type="password"
                  value={props.password}
                  onChange={(event) => props.onPassword(event.target.value)}
                  placeholder="Tu contrasena actual"
                  autoComplete="current-password"
                  style={inputStyle}
                />
              </>
            )}
            <label style={checkboxRowStyle}>
              <input type="checkbox" checked={props.acknowledged} onChange={(event) => props.onAcknowledged(event.target.checked)} />
              <span>Se que esta accion borra mi cuenta y mis datos de forma definitiva.</span>
            </label>
            {props.error && <p style={{ color: "var(--ph-danger-600)", fontSize: "0.82rem", fontWeight: 700 }}>{props.error}</p>}
            <div style={modalActionsStyle}>
              <button onClick={() => props.onStep(1)} disabled={props.loading} style={secondaryButtonStyle}>Atras</button>
              <button onClick={props.onDelete} disabled={!props.canDelete} style={{ ...dangerButtonStyle, opacity: props.canDelete ? 1 : 0.45, cursor: props.canDelete ? "pointer" : "not-allowed" }}>
                {props.loading ? "Eliminando..." : "Eliminar todo"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div style={metricStyle}>
      <div style={metricIconStyle}>{icon}</div>
      <div>
        <p style={{ margin: 0, color: "var(--ph-muted)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
        <p style={{ margin: "0.12rem 0 0", color: "var(--ph-navy-700)", fontSize: "1rem", fontWeight: 900 }}>{value}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <span style={infoLabelStyle}>{label}</span>
      {children}
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "0.74rem 0", borderBottom: "1px solid #edf0f4" }}>
      <p style={infoLabelStyle}>{label}</p>
      <p style={{ margin: "0.24rem 0 0", color: "var(--ph-navy-700)", fontSize: "0.9rem", fontWeight: 800, overflowWrap: "anywhere" }}>{value}</p>
    </div>
  );
}

function SettingsRow({
  title,
  description,
  action,
  danger,
}: {
  title: string;
  description: string;
  action: ReactNode;
  danger?: boolean;
}) {
  return (
    <div style={{ ...settingsRowStyle, borderColor: danger ? "#fecaca" : "#e7e9ee" }}>
      <div style={{ minWidth: 0 }}>
        <h3 style={{ margin: 0, color: danger ? "#991b1b" : "var(--ph-navy-700)", fontSize: "0.92rem", fontWeight: 900 }}>{title}</h3>
        <p style={{ margin: "0.22rem 0 0", color: "#4b5563", fontSize: "0.8rem", lineHeight: 1.45 }}>{description}</p>
      </div>
      <div style={settingsActionStyle}>{action}</div>
    </div>
  );
}

const heroStyle: CSSProperties = {
  minHeight: "150px",
  borderRadius: "12px",
  padding: "1.5rem",
  background: "linear-gradient(135deg, var(--ph-navy-700) 0%, var(--ph-bordeaux-700) 58%, var(--ph-red-600) 100%)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  boxShadow: "0 2px 10px rgba(38,58,85,0.06)",
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.72)",
  fontSize: "0.78rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const heroActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "0.55rem",
  flexWrap: "wrap",
};

const heroButtonStyle: CSSProperties = {
  padding: "0.62rem 0.95rem",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "var(--ph-red-600)",
  color: "#fff",
  fontWeight: 900,
  fontSize: "0.82rem",
  cursor: "pointer",
};

const heroSecondaryButtonStyle: CSSProperties = {
  ...heroButtonStyle,
  background: "rgba(255,255,255,0.12)",
};

const heroInputStyle: CSSProperties = {
  padding: "0.58rem 0.7rem",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.34)",
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  outline: "none",
  fontWeight: 800,
};

const panelStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e7e9ee",
  borderRadius: "12px",
  padding: "1.15rem",
  boxShadow: "0 2px 10px rgba(38,58,85,0.05)",
};

const sidebarPanelStyle: CSSProperties = {
  position: "sticky",
  top: 86,
  height: "500px",
  maxHeight: "calc(100vh - 110px)",
  overflowY: "auto",
};

const sidebarHintStyle: CSSProperties = {
  minHeight: 250,
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",
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
  color: "var(--ph-navy-700)",
  fontSize: "1.05rem",
  fontWeight: 900,
};

const subtleTextStyle: CSSProperties = {
  margin: "0.2rem 0 0",
  color: "var(--ph-muted)",
  fontSize: "0.78rem",
};

const badgeStyle: CSSProperties = {
  background: "#dcfce7",
  color: "#16803c",
  borderRadius: "999px",
  padding: "0.25rem 0.65rem",
  fontSize: "0.7rem",
  fontWeight: 800,
};

const metricStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  background: "#fff",
  border: "1px solid #e7e9ee",
  borderRadius: "10px",
  padding: "0.8rem",
  minHeight: 70,
};

const metricIconStyle: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--ph-navy-700)",
  color: "#fff",
  flex: "0 0 auto",
};

const avatarFrameStyle: CSSProperties = {
  borderRadius: "22%",
  boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
  flex: "0 0 auto",
};

const avatarInnerStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  borderRadius: "18%",
  overflow: "hidden",
  background: "#fff",
  color: "var(--ph-navy-700)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.7rem",
  fontWeight: 900,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "0.68rem 0.75rem",
  borderRadius: "8px",
  border: "1.5px solid #d6dbe3",
  outline: "none",
  color: "var(--ph-navy-700)",
  fontWeight: 700,
  fontSize: "0.84rem",
};

const infoLabelStyle: CSSProperties = {
  margin: 0,
  color: "var(--ph-muted)",
  fontSize: "0.72rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const primaryButtonStyle: CSSProperties = {
  width: "100%",
  padding: "0.68rem 0.8rem",
  borderRadius: "8px",
  border: "1px solid var(--ph-red-600)",
  background: "var(--ph-red-600)",
  color: "#fff",
  fontWeight: 900,
  fontSize: "0.82rem",
};

const secondaryButtonStyle: CSSProperties = {
  width: "100%",
  padding: "0.68rem 0.8rem",
  borderRadius: "8px",
  border: "1px solid #d6dbe3",
  background: "#fff",
  color: "var(--ph-navy-700)",
  fontWeight: 900,
  fontSize: "0.82rem",
};

const inlineDangerButtonStyle: CSSProperties = {
  width: "100%",
  marginTop: "0.65rem",
  padding: "0.68rem 0.8rem",
  borderRadius: "8px",
  border: "1px solid #fecaca",
  background: "#fffafa",
  color: "#b91c1c",
  fontWeight: 900,
  fontSize: "0.82rem",
};

const settingsListStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  maxWidth: "100%",
  border: "1px solid #fecaca",
  borderRadius: "10px",
  overflow: "hidden",
};

const settingsRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "1rem",
  padding: "1rem 1.1rem",
  borderBottom: "1px solid #e7e9ee",
  background: "#fff",
};

const settingsActionStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  minWidth: 150,
};

const settingsButtonStyle: CSSProperties = {
  padding: "0.58rem 0.9rem",
  borderRadius: "8px",
  border: "1px solid #d6dbe3",
  background: "#fff",
  color: "var(--ph-navy-700)",
  fontWeight: 900,
  fontSize: "0.82rem",
  whiteSpace: "nowrap",
};

const settingsDisabledButtonStyle: CSSProperties = {
  ...settingsButtonStyle,
  color: "var(--ph-muted)",
  background: "#f7f8fa",
  cursor: "not-allowed",
};

const settingsDangerButtonStyle: CSSProperties = {
  ...settingsButtonStyle,
  borderColor: "#fecaca",
  color: "var(--ph-danger-600)",
};

const disabledSettingsStyle: CSSProperties = {
  marginTop: "1rem",
  padding: "0.85rem",
  borderRadius: "10px",
  background: "#f7f8fa",
  border: "1px dashed #cfd5de",
};

const uploadButtonStyle: CSSProperties = {
  width: "fit-content",
  padding: "0.62rem 0.95rem",
  borderRadius: "8px",
  border: "1px solid var(--ph-red-600)",
  background: "var(--ph-red-600)",
  color: "#fff",
  fontWeight: 900,
  fontSize: "0.82rem",
  cursor: "pointer",
};

const equippedSummaryStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  color: "var(--ph-navy-700)",
  fontSize: "0.78rem",
  fontWeight: 800,
};

const pillButtonStyle: CSSProperties = {
  padding: "0.42rem 0.72rem",
  borderRadius: "999px",
  border: "1px solid #d6dbe3",
  fontSize: "0.76rem",
  fontWeight: 900,
};

const sideButtonStyle: CSSProperties = {
  width: "100%",
  padding: "0.62rem 0.75rem",
  borderRadius: "8px",
  border: "1px solid #d6dbe3",
  background: "#fff",
  color: "var(--ph-navy-700)",
  textAlign: "left",
  fontWeight: 900,
  cursor: "pointer",
  outline: "none",
};

const activeSideButtonStyle: CSSProperties = {
  ...sideButtonStyle,
  background: "var(--ph-navy-700)",
  borderColor: "var(--ph-navy-700)",
  color: "#fff",
  outline: "none",
};

const filterButtonStyle: CSSProperties = {
  ...sideButtonStyle,
  padding: "0.5rem 0.65rem",
  fontSize: "0.78rem",
  outline: "none",
};

const activeFilterButtonStyle: CSSProperties = {
  ...filterButtonStyle,
  background: "var(--ph-red-600)",
  borderColor: "var(--ph-red-600)",
  color: "#fff",
  outline: "none",
};

const objectScrollStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
  gap: "0.85rem",
  maxHeight: "58vh",
  overflowY: "auto",
  paddingRight: "0.35rem",
};

const itemCardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #edf0f4",
  borderRadius: "10px",
  padding: "0.65rem",
  minHeight: "188px",
};

const itemCardButtonStyle: CSSProperties = {
  width: "100%",
  padding: 0,
  border: 0,
  background: "transparent",
  textAlign: "left",
  cursor: "pointer",
};

const itemDetailsStyle: CSSProperties = {
  marginTop: "0.7rem",
  paddingTop: "0.7rem",
  borderTop: "1px solid #edf0f4",
};

const detailTextStyle: CSSProperties = {
  margin: 0,
  color: "#4b5563",
  fontSize: "0.78rem",
  lineHeight: 1.45,
};

const detailGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: "0.35rem 0.65rem",
  marginTop: "0.7rem",
  color: "var(--ph-muted)",
  fontSize: "0.72rem",
};

const marketBadgeStyle: CSSProperties = {
  display: "inline-flex",
  marginTop: "0.55rem",
  padding: "0.18rem 0.45rem",
  borderRadius: "5px",
  background: "#fff1f5",
  color: "var(--ph-red-600)",
  fontSize: "0.66rem",
  fontWeight: 800,
};

const equippedBadgeStyle: CSSProperties = {
  display: "inline-flex",
  marginTop: "0.55rem",
  padding: "0.18rem 0.45rem",
  borderRadius: "5px",
  background: "#dcfce7",
  color: "#16803c",
  fontSize: "0.66rem",
  fontWeight: 800,
};

const emptyStateStyle: CSSProperties = {
  padding: "2rem 1rem",
  textAlign: "center",
  color: "var(--ph-muted)",
  border: "1px dashed #cfd5de",
  borderRadius: "10px",
};

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(14,20,30,0.72)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
  padding: "1rem",
};

const modalPanelStyle: CSSProperties = {
  width: "100%",
  maxWidth: 460,
  background: "#fff",
  borderRadius: "12px",
  boxShadow: "0 24px 80px rgba(0,0,0,0.38)",
  padding: "1.35rem",
};

const inventoryModalStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: 440,
  background: "#fff",
  borderRadius: "12px",
  boxShadow: "0 24px 80px rgba(0,0,0,0.38)",
  padding: "1.2rem",
};

const closeButtonStyle: CSSProperties = {
  position: "absolute",
  top: 10,
  right: 10,
  width: 32,
  height: 32,
  borderRadius: "50%",
  border: "1px solid #d6dbe3",
  background: "#fff",
  color: "var(--ph-navy-700)",
  fontSize: "1.2rem",
  fontWeight: 900,
  cursor: "pointer",
};

const deleteCopyStyle: CSSProperties = {
  margin: "0 0 1rem",
  color: "#4b5563",
  fontSize: "0.9rem",
  lineHeight: 1.55,
};

const deleteWarningStyle: CSSProperties = {
  background: "#fff1f2",
  border: "1px solid #fecdd3",
  color: "#991b1b",
  borderRadius: "10px",
  padding: "0.85rem",
  fontSize: "0.84rem",
  lineHeight: 1.5,
};

const modalActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.6rem",
  marginTop: "1.15rem",
};

const dangerButtonStyle: CSSProperties = {
  padding: "0.65rem 0.95rem",
  borderRadius: "8px",
  border: "1px solid var(--ph-danger-600)",
  background: "var(--ph-danger-600)",
  color: "#fff",
  fontWeight: 900,
  fontSize: "0.84rem",
};

const deletePhraseStyle: CSSProperties = {
  display: "block",
  background: "#f3f4f6",
  border: "1px solid var(--ph-border)",
  borderRadius: "8px",
  padding: "0.65rem",
  color: "var(--ph-navy-700)",
  fontWeight: 900,
  marginBottom: "0.75rem",
};

const checkboxRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "0.55rem",
  color: "#4b5563",
  fontSize: "0.82rem",
  lineHeight: 1.45,
  marginTop: "0.8rem",
};
