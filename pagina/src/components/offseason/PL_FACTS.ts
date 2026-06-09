// Hechos icónicos de la Premier League mostrados en el overlay "Calculando modelo…".
// Son contenido fijo (récords históricos), no datos de negocio.
export type PLFact = {
  badge: string;
  club: string;
  label: string;
  stat: string;
  unit: string;
  detail: string;
};

export const PL_FACTS: PLFact[] = [
  {
    badge: "https://media.api-sports.io/football/teams/34.png",
    club: "Newcastle United",
    label: "Máximo goleador histórico",
    stat: "260", unit: "goles",
    detail: "Alan Shearer marcó 260 goles con Newcastle y Blackburn. Ningún jugador ha superado esa cifra en la era Premier.",
  },
  {
    badge: "https://media.api-sports.io/football/teams/33.png",
    club: "Manchester United",
    label: "Más títulos en la Premier League",
    stat: "13", unit: "títulos",
    detail: "Manchester United dominó la era Premier bajo Alex Ferguson, ganando 13 de los primeros 21 títulos disputados.",
  },
  {
    badge: "https://media.api-sports.io/football/teams/42.png",
    club: "Arsenal",
    label: "Los Invencibles — 2003/04",
    stat: "49", unit: "partidos sin perder",
    detail: "El Arsenal de Wenger fue invicto durante toda la temporada 2003/04. Ningún equipo ha repetido esa hazaña.",
  },
  {
    badge: "https://media.api-sports.io/football/teams/50.png",
    club: "Manchester City",
    label: "Temporada perfecta — 2017/18",
    stat: "100", unit: "puntos",
    detail: "El City de Guardiola alcanzó los 100 puntos en una sola temporada, el récord máximo de la Premier League.",
  },
  {
    badge: "https://media.api-sports.io/football/teams/40.png",
    club: "Liverpool",
    label: "30 años de espera — 2019/20",
    stat: "99", unit: "puntos",
    detail: "Liverpool ganó su primera Premier League en 30 años con 99 puntos, rompiendo el dominio del City.",
  },
  {
    badge: "https://media.api-sports.io/football/teams/41.png",
    club: "Southampton",
    label: "El gol más rápido de la historia",
    stat: "7.69", unit: "segundos",
    detail: "Shane Long anotó a los 7.69 segundos del pitido inicial ante Watford en 2019. El gol más veloz de la PL.",
  },
  {
    badge: "https://media.api-sports.io/football/teams/50.png",
    club: "Manchester City",
    label: "Récord de asistencias — 2019/20",
    stat: "20", unit: "asistencias",
    detail: "Kevin De Bruyne igualó el récord histórico de Thierry Henry con 20 asistencias en una sola temporada.",
  },
];
