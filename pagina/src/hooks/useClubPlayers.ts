import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export type ClubPlayer = {
  id: number;
  name: string;
  age: number;
  position: string;
};

/*
Hook compartido entre TransferPredictor y SeasonSimulator.
Carga el squad de un club desde /api/ml/players cada vez que cambia clubId.
Devuelve la lista de jugadores y un flag de carga. Cancela la respuesta en vuelo
si el club cambia antes de que termine el fetch (evita setState fuera de orden).
*/
export function useClubPlayers(clubId: number | "") {
  const [players, setPlayers] = useState<ClubPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clubId) {
      setPlayers([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`${API_URL}/api/ml/players?club_id=${clubId}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setPlayers(data.success ? data.data : []); })
      .catch(() => { if (!cancelled) setPlayers([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [clubId]);

  return { players, loading };
}
