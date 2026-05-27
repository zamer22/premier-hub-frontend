import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export type InventoryItem = {
  id_inventario: number;
  tipo: string;
  imagen?: string | null;
  css?: string | null;
  metadata?: Record<string, any> | null;
};

function getUserImage(user: any) {
  if (!user?.id_usuario) return "";

  return (
    user?.foto_perfil_url ||
    user?.foto_perfil ||
    user?.avatar_url ||
    user?.avatar ||
    user?.imagen_perfil ||
    ""
  );
}

function getInventoryProfileImage(items: InventoryItem[]) {
  const preferred = items.find(
    (item) => item.tipo === "foto_perfil" && item.imagen,
  );
  const fallback = items.find(
    (item) =>
      ["foto_perfil", "marco", "banner"].includes(item.tipo) && item.imagen,
  );

  return preferred?.imagen || fallback?.imagen || "";
}

export function useProfileCustomization(user: any) {
  const [profileImage, setProfileImage] = useState("");
  const [profileFrame, setProfileFrame] = useState<InventoryItem | null>(null);

  useEffect(() => {
    if (!user?.id_usuario) {
      setProfileImage("");
      setProfileFrame(null);
      return;
    }

    let active = true;
    const userImage = getUserImage(user);
    if (userImage) setProfileImage(userImage);

    Promise.all([
      fetch(`${API_URL}/api/tienda/mis-items`, { credentials: "include" }).then(
        (r) => r.json(),
      ),
      fetch(`${API_URL}/api/auth/profile/customization`, {
        credentials: "include",
      }).then((r) => r.json()),
    ])
      .then(([itemsData, customizationData]) => {
        if (!active || !itemsData.success) return;

        const items: InventoryItem[] = itemsData.data || [];
        const customization = customizationData.success
          ? customizationData.data
          : {};
        const frame =
          items.find(
            (item) =>
              Number(item.id_inventario) ===
              Number(customization?.marco_inventario_id),
          ) || null;

        setProfileFrame(frame);
        setProfileImage(userImage || getInventoryProfileImage(items));
      })
      .catch(() => {
        if (active) setProfileImage(userImage);
      });

    return () => {
      active = false;
    };
  }, [user?.id_usuario, user?.dinero]);

  return {
    profileFrame,
    profileImage,
    setProfileFrame,
    setProfileImage,
  };
}
