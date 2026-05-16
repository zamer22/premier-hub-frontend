import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
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

function getFrameStyle(item?: InventarioItem | null) {
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

function getBannerStyle(item?: InventarioItem | null) {
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
    <svg viewBox="0 0 24 24" aria-hidden="true" className="perfil-icon">
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 12h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="perfil-icon">
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m4.5 8 7.5 4.2L19.5 8M12 12.2V21" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="perfil-icon">
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
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
  const canDelete = deleteText === deletePhrase && deleteAcknowledged && !deleteLoading;

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
    setDeleteAcknowledged(false);
    setDeleteError("");
  };

  const deleteAccount = async () => {
    if (!canDelete) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/account`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmacion: deletePhrase }),
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
    <div className="perfil-root animate-fade-in">
      {deleteModalOpen && createPortal(
        <DeleteAccountModal
          user={user}
          step={deleteStep}
          phrase={deletePhrase}
          text={deleteText}
          acknowledged={deleteAcknowledged}
          loading={deleteLoading}
          error={deleteError}
          canDelete={canDelete}
          onClose={closeDeleteModal}
          onStep={setDeleteStep}
          onText={setDeleteText}
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

      <section className="perfil-hero" style={getBannerStyle(activeBanner)}>
        <div className="perfil-hero__content">
          <ProfileAvatar user={user} image={displayImage} frame={activeFrame} size={96} />
          <div className="perfil-hero__text">
            <p className="perfil-hero__eyebrow">Perfil PremierHub</p>
            {editing ? (
              <div className="perfil-hero__edit-grid">
                <input
                  value={nombreUsuario}
                  onChange={(event) => setNombreUsuario(event.target.value)}
                  placeholder="Nombre"
                  className="perfil-hero__input"
                />
                <input
                  value={nickname}
                  maxLength={20}
                  onChange={(event) => setNickname(event.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                  placeholder="Nickname"
                  className="perfil-hero__input"
                />
              </div>
            ) : (
              <h1 className="perfil-hero__name">
                {user.nickname || user.nombre_usuario || "Usuario"}
              </h1>
            )}
            <p className="perfil-hero__title">
              {activeTitle?.nombre || "Sin titulo equipado"}
            </p>
            <p className="perfil-hero__meta">
              Marco: {activeFrame?.nombre || "sin marco"} · Banner: {activeBanner?.nombre || "sin banner"}
            </p>
          </div>
        </div>
        <div className="perfil-hero__actions">
          <label className="perfil-hero__button">
            Cambiar foto
            <input type="file" accept="image/*" onChange={handleImageUpload} className="perfil-hero__file" />
          </label>
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="perfil-hero__button perfil-hero__button--secondary">Cancelar</button>
              <button onClick={saveProfile} disabled={saveLoading} className="perfil-hero__button">
                {saveLoading ? "Guardando..." : "Guardar"}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="perfil-hero__button perfil-hero__button--secondary">Editar perfil</button>
          )}
        </div>
      </section>

      <div className="perfil-metrics">
        <Metric icon={<WalletIcon />} label="Puntos disponibles" value={`${saldo.toLocaleString()} pts`} />
        <Metric icon={<BoxIcon />} label="Items en inventario" value={String(items.length)} />
        <Metric icon={<UserIcon />} label="Objetos de perfil" value={String(profileItems.length)} />
        <Metric icon={<BoxIcon />} label="Publicaciones activas" value={String(listados.length)} />
      </div>

      <div className="perfil-layout">
        <aside className="perfil-panel perfil-sidebar">
          <div className="perfil-panel__header">
            <h2 className="perfil-panel__title">Perfil</h2>
            <span className="perfil-badge">Activa</span>
          </div>

          <div className="perfil-sidebar__buttons">
            <button
              onClick={() => setPanelView("objetos")}
              className={`perfil-sidebar__button ${panelView === "objetos" ? "is-active" : ""}`}
            >
              Objetos
            </button>
            <button
              onClick={() => setPanelView("ajustes")}
              className={`perfil-sidebar__button ${panelView === "ajustes" ? "is-active" : ""}`}
            >
              Ajustes
            </button>
          </div>

          {panelView === "objetos" ? (
            <>
              <Field label="Buscar">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nombre, equipo o tipo..."
                  className="perfil-input"
                />
              </Field>
              <div className="perfil-filter__list">
                {filterOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setFilterType(option.key)}
                    className={`perfil-filter__button ${filterType === option.key ? "is-active" : ""}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="perfil-sidebar__hint">
              <InfoRow label="Correo" value={user.correo || "No disponible"} />
              <InfoRow label="Miembro desde" value={formatDate(accountDate)} />
            </div>
          )}
          {saveMessage && (
            <p className={`perfil-save ${saveMessage.includes("No ") ? "is-error" : ""}`}>{saveMessage}</p>
          )}
        </aside>

        <section className="perfil-panel perfil-panel--main">
          <div className="perfil-panel__header">
            <div>
              <h2 className="perfil-panel__title">{panelView === "objetos" ? "Objetos y equipables" : "Ajustes de cuenta"}</h2>
              <p className="perfil-panel__subtitle">
                {panelView === "objetos" ? "Selecciona un objeto para ver sus detalles o equiparlo." : "Gestiona datos sensibles de tu cuenta."}
              </p>
            </div>
          </div>

          {panelView === "objetos" ? (
            loading ? (
              <p className="perfil-muted">Cargando perfil...</p>
            ) : filteredItems.length === 0 ? (
              <div className="perfil-empty">
                <p className="perfil-empty__title">No hay objetos con ese filtro</p>
                <p className="perfil-empty__text">Compra o desbloquea objetos de perfil para verlos aqui.</p>
              </div>
            ) : (
              <div className="perfil-items">
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
            <div className="perfil-settings">
              <SettingsRow
                title="Cerrar sesion"
                description="Termina la sesion actual en este navegador sin borrar datos de la cuenta."
                action={<button onClick={onLogout} className="perfil-settings__button">Cerrar sesion</button>}
              />
              <SettingsRow
                title="Eliminar cuenta"
                description="Borra la cuenta y sus datos asociados. Se pedira confirmacion antes de continuar."
                danger
                action={<button onClick={() => setDeleteModalOpen(true)} className="perfil-settings__button is-danger">Eliminar cuenta</button>}
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
    <div
      className="perfil-avatar"
      style={{ ...getFrameStyle(frame), width: size, height: size, padding: Math.max(5, Math.round(size * 0.075)) }}
    >
      <div className="perfil-avatar__inner">
        {image ? (
          <img src={image} alt="" className="perfil-avatar__image" />
        ) : (
          <span className="perfil-avatar__initials">{initials(user)}</span>
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
    <article className={`perfil-item ${equipped ? "is-equipped" : ""}`}>
      <button type="button" onClick={() => onOpen(item)} className="perfil-item__button">
        <ItemPreview item={item} height={96} />
        <p className="perfil-item__name">{item.nombre}</p>
        <p className="perfil-item__type">
          {tipoLabel(item.tipo)}{item.equipo ? ` - ${item.equipo}` : ""}
        </p>
        {equipped && <span className="perfil-item__badge perfil-item__badge--equipped">Equipado</span>}
      </button>
      {item.en_marketplace && <span className="perfil-item__badge perfil-item__badge--market">En marketplace</span>}
    </article>
  );
}

function ItemPreview({ item, height }: { item: InventarioItem; height: number }) {
  return (
    <div
      className="perfil-item__preview"
      style={{
        height,
        background: item.tipo === "marco"
          ? getFrameStyle(item).background
          : item.tipo === "banner"
            ? getBannerStyle(item).background || "#f2f4f7"
            : item.imagen
              ? `#f2f4f7 url(${item.imagen}) center/contain no-repeat`
              : "#f2f4f7",
      }}
    >
      {!item.imagen && item.tipo !== "marco" && item.tipo !== "banner" && (
        <span className="perfil-item__placeholder">
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
    <div className="perfil-modal__overlay" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-item-title"
        className="perfil-modal perfil-modal--inventory"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label="Cerrar detalle" className="perfil-modal__close">×</button>
        <ItemPreview item={item} height={190} />
        <p className="perfil-modal__eyebrow">
          {tipoLabel(item.tipo)}{item.equipo ? ` - ${item.equipo}` : ""}
        </p>
        <h2 id="inventory-item-title" className="perfil-modal__title">{item.nombre}</h2>
        <p className="perfil-modal__text perfil-modal__text--spaced">{item.descripcion || "Sin descripcion registrada."}</p>
        <div className="perfil-modal__grid">
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
            className={`perfil-button perfil-button--primary ${equipped ? "is-disabled" : ""}`}
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
  acknowledged: boolean;
  loading: boolean;
  error: string;
  canDelete: boolean;
  onClose: () => void;
  onStep: (step: number) => void;
  onText: (text: string) => void;
  onAcknowledged: (value: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <div className="perfil-modal__overlay" onClick={props.onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className="perfil-modal perfil-modal--delete"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="perfil-delete__eyebrow">Zona irreversible</p>
        <h2 id="delete-account-title" className="perfil-delete__title">
          Eliminar cuenta definitivamente
        </h2>

        {props.step === 1 ? (
          <>
            <p className="perfil-delete__copy">Esto borrara tu cuenta, sesion, puntos, inventario, publicaciones del marketplace y simulaciones asociadas.</p>
            <div className="perfil-delete__warning">Antes de continuar, asegurate de que realmente quieres borrar todos los datos de <strong>{props.user.nickname}</strong>.</div>
            <div className="perfil-modal__actions">
              <button onClick={props.onClose} className="perfil-button perfil-button--secondary">Cancelar</button>
              <button onClick={() => props.onStep(2)} className="perfil-button perfil-button--danger">Entiendo, continuar</button>
            </div>
          </>
        ) : (
          <>
            <p className="perfil-delete__copy">Para confirmar, escribe exactamente:</p>
            <code className="perfil-delete__phrase">{props.phrase}</code>
            <input value={props.text} onChange={(event) => props.onText(event.target.value)} placeholder={props.phrase} autoFocus className="perfil-input" />
            <label className="perfil-delete__checkbox">
              <input type="checkbox" checked={props.acknowledged} onChange={(event) => props.onAcknowledged(event.target.checked)} />
              <span>Se que esta accion borra mi cuenta y mis datos de forma definitiva.</span>
            </label>
            {props.error && <p className="perfil-error">{props.error}</p>}
            <div className="perfil-modal__actions">
              <button onClick={() => props.onStep(1)} disabled={props.loading} className="perfil-button perfil-button--secondary">Atras</button>
              <button
                onClick={props.onDelete}
                disabled={!props.canDelete}
                className={`perfil-button perfil-button--danger ${props.canDelete ? "" : "is-disabled"}`}
              >
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
    <div className="perfil-metric">
      <div className="perfil-metric__icon">{icon}</div>
      <div>
        <p className="perfil-metric__label">{label}</p>
        <p className="perfil-metric__value">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="perfil-field">
      <span className="perfil-field__label">{label}</span>
      {children}
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="perfil-info-row">
      <p className="perfil-field__label">{label}</p>
      <p className="perfil-info-row__value">{value}</p>
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
    <div className={`perfil-settings__row ${danger ? "is-danger" : ""}`}>
      <div className="perfil-settings__content">
        <h3 className={`perfil-settings__title ${danger ? "is-danger" : ""}`}>{title}</h3>
        <p className="perfil-settings__desc">{description}</p>
      </div>
      <div className="perfil-settings__action">{action}</div>
    </div>
  );
}
