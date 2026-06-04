import { useState, useEffect, useCallback, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import "../../estilos/Admin.css";

import type { AdminPedido, AdminEnviosProps } from "../../components/admin/types";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminTabs from "../../components/admin/AdminTabs";
import AdminToast from "../../components/admin/AdminToast";
import EnviosFilters from "../../components/admin/EnviosFilters";
import OrderList from "../../components/admin/OrderList";
import OrderDetailPane from "../../components/admin/OrderDetailPane";
import AdminProducts from "./AdminTienda";
import AdminForum from "./AdminForum";
import AdminUsers from "./AdminUsers";

const API_URL = import.meta.env.VITE_API_URL;

type AdminTab = "envios" | "productos" | "foro" | "usuarios";

export default function AdminEnvios({ user, onLogout }: AdminEnviosProps) {
  const [tab, setTab] = useState<AdminTab>("envios");

  const [pedidos, setPedidos] = useState<AdminPedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AdminPedido | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Form state del pedido seleccionado — espejo editable de `selected` que se commitea con "Guardar".
  const [estadoPendiente, setEstadoPendiente] = useState<AdminPedido["estado"] | null>(null);
  const [tracking, setTracking] = useState("");
  const [fechaEstimada, setFechaEstimada] = useState("");
  const [notas, setNotas] = useState("");
  const [latActual, setLatActual] = useState<number | null>(null);
  const [lngActual, setLngActual] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // El backend admin identifica al admin via cookie de sesion firmada (middleware requireAdmin).
  // Aqui solo armamos query params para filtros (estado, q).
  const filtrosQS = useCallback((extra: Record<string, string | number | undefined> = {}) => {
    const params = new URLSearchParams();
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== "") params.set(k, String(v));
    });
    return params.toString();
  }, []);

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filtrosQS({
        estado: filtroEstado !== "todos" ? filtroEstado : undefined,
        q: search.trim() || undefined,
      });
      const url = qs ? `${API_URL}/api/admin/pedidos?${qs}` : `${API_URL}/api/admin/pedidos`;
      const r = await fetch(url, { credentials: "include" });
      const d = await r.json();
      if (d.success) setPedidos(d.data);
      else showToast(d.error || "Error", false);
    } catch {
      showToast("Error de conexion", false);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, search, filtrosQS]);

  // Debounce de la búsqueda; estados cambian sin debounce.
  useEffect(() => {
    const t = setTimeout(fetchPedidos, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchPedidos, search]);

  // Cuando cambia el pedido seleccionado, hidratar el form.
  useEffect(() => {
    if (!selected) return;
    setEstadoPendiente(selected.estado);
    setTracking(selected.tracking_numero || "");
    setFechaEstimada(selected.fecha_estimada ? selected.fecha_estimada.slice(0, 10) : "");
    setNotas(selected.notas_admin || "");
    setLatActual(selected.lat_actual != null ? Number(selected.lat_actual) : null);
    setLngActual(selected.lng_actual != null ? Number(selected.lng_actual) : null);
  }, [selected?.id_pedido]);

  const aplicarUpdate = async (body: Record<string, any>) => {
    if (!selected) return null;
    const r = await fetch(`${API_URL}/api/admin/pedido/${selected.id_pedido}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!d.success) {
      showToast(d.error || "Error", false);
      return null;
    }
    setSelected(d.data);
    setPedidos((prev) => prev.map((p) => (p.id_pedido === d.data.id_pedido ? d.data : p)));
    return {
      pedido: d.data as AdminPedido,
      refunded: d.refunded as number | undefined,
      warning: d.warning as string | undefined,
    };
  };

  const estadoCambio = useMemo(() => {
    if (!selected) return false;
    return estadoPendiente != null && estadoPendiente !== selected.estado;
  }, [selected, estadoPendiente]);

  const ubicacionCambio = useMemo(() => {
    if (!selected) return false;
    const origLat = selected.lat_actual != null ? Number(selected.lat_actual) : null;
    const origLng = selected.lng_actual != null ? Number(selected.lng_actual) : null;
    return origLat !== latActual || origLng !== lngActual;
  }, [selected, latActual, lngActual]);

  const infoCambio = useMemo(() => {
    if (!selected) return false;
    return (selected.tracking_numero || "") !== tracking
      || (selected.fecha_estimada ? selected.fecha_estimada.slice(0, 10) : "") !== fechaEstimada
      || (selected.notas_admin || "") !== notas;
  }, [selected, tracking, fechaEstimada, notas]);

  const hayCambios = estadoCambio || ubicacionCambio || infoCambio;

  const guardarTodo = async () => {
    if (!selected || !hayCambios) return;

    const body: Record<string, any> = {};
    if (estadoCambio && estadoPendiente) body.estado = estadoPendiente;
    if (ubicacionCambio) {
      body.lat_actual = latActual;
      body.lng_actual = lngActual;
    }
    if (infoCambio) {
      body.tracking_numero = tracking.trim() || null;
      body.fecha_estimada = fechaEstimada || null;
      body.notas_admin = notas.trim() || null;
    }

    setSaving(true);
    const result = await aplicarUpdate(body);
    setSaving(false);

    if (!result) return;
    if (result.warning) showToast(result.warning, false);
    else if (result.refunded != null) showToast(`Cancelado · ${Number(result.refunded).toLocaleString()} pts devueltos al usuario`, true);
    else showToast("Cambios guardados", true);
  };

  const descartarCambios = () => {
    if (!selected) return;
    setEstadoPendiente(selected.estado);
    setTracking(selected.tracking_numero || "");
    setFechaEstimada(selected.fecha_estimada ? selected.fecha_estimada.slice(0, 10) : "");
    setNotas(selected.notas_admin || "");
    setLatActual(selected.lat_actual != null ? Number(selected.lat_actual) : null);
    setLngActual(selected.lng_actual != null ? Number(selected.lng_actual) : null);
  };

  return (
    <div className="adm-page">
      <AdminHeader nickname={user.nickname} onLogout={onLogout} />

      <AdminTabs<AdminTab>
        value={tab}
        onChange={setTab}
        items={[
          { key: "envios",     label: "Envíos" },
          { key: "productos",  label: "Productos" },
          { key: "foro",       label: "Foro" },
          { key: "usuarios",   label: "Usuarios" },
        ]}
      />

      {toast && <AdminToast msg={toast.msg} ok={toast.ok} />}

      {tab === "productos" ? (
        <AdminProducts user={user} />
      ) : tab === "foro" ? (
        <AdminForum user={user} />
      ) : tab === "usuarios" ? (
        <AdminUsers user={user} />
      ) : (
        <>
          <EnviosFilters
            filtroEstado={filtroEstado}
            onFiltroChange={setFiltroEstado}
            search={search}
            onSearchChange={setSearch}
            count={pedidos.length}
          />

          <div className="adm-layout">
            <OrderList
              pedidos={pedidos}
              selectedId={selected?.id_pedido ?? null}
              onSelect={setSelected}
              loading={loading}
            />

            {!selected ? (
              <div className="adm-detail--empty">
                <p className="adm-detail__empty-text">Seleccioná un pedido para gestionarlo</p>
              </div>
            ) : (
              <OrderDetailPane
                pedido={selected}
                estadoPendiente={estadoPendiente}
                onEstadoChange={setEstadoPendiente}
                tracking={tracking}
                onTrackingChange={setTracking}
                fechaEstimada={fechaEstimada}
                onFechaEstimadaChange={setFechaEstimada}
                notas={notas}
                onNotasChange={setNotas}
                latActual={latActual}
                lngActual={lngActual}
                onUbicacionChange={(la, ln) => { setLatActual(la); setLngActual(ln); }}
                estadoCambio={estadoCambio}
                ubicacionCambio={ubicacionCambio}
                infoCambio={infoCambio}
                hayCambios={hayCambios}
                saving={saving}
                onDescartar={descartarCambios}
                onGuardar={guardarTodo}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
