import heroImage from "../../assets/vr-hero.png";
import "./VrArena.css";

const META_ACCESS_URL = "https://www.meta.com/s/cBrqPyVuj";
const hasMetaAccess = META_ACCESS_URL.trim().length > 0;

const featureCards = [
  {
    label: "Modo portero",
    title: "Ataja bajo presion",
    text: "Enfrenta rondas de 10 balones y demuestra tus reflejos desde la porteria.",
  },
  {
    label: "Racha de atajadas",
    title: "Encadena paradas perfectas",
    text: "Cada balon detenido aumenta tu racha y te reta a superar tu mejor marca.",
  },
  {
    label: "Puntos y tienda web",
    title: "Gana puntos para comprar objetos",
    text: "Suma puntos en cada partida y usalos en la tienda de la pagina para comprar objetos.",
  },
] as const;

const checkpoints = [
  "Rondas de 10 balones",
  "Contador de racha",
  "Puntos por atajada",
  "Objetos en la tienda web",
] as const;

export default function VrArena() {
  return (
    <main className="vr-page">
      <section className="vr-hero" aria-labelledby="vr-title">
        <img
          src={heroImage}
          alt="Estadio virtual visto desde un visor de realidad virtual"
          className="vr-hero__image"
        />
        <div className="vr-hero__shade" />

        <div className="vr-hero__content">
          <h1 id="vr-title" className="vr-hero__title">
            Modo Portero VR
          </h1>
          <p className="vr-hero__lead">
            Ataja rondas de 10 balones, cuida tu racha y gana puntos para
            progresar en la tienda del juego.
          </p>

          <div className="vr-hero__actions">
            <a
              className={`vr-button vr-button--primary${
                hasMetaAccess ? "" : " is-disabled"
              }`}
              href={hasMetaAccess ? META_ACCESS_URL : undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!hasMetaAccess}
              onClick={(event) => {
                if (!hasMetaAccess) event.preventDefault();
              }}
            >
              {hasMetaAccess ? "Descargar" : "Acceso no disponible"}
              <span aria-hidden="true">-&gt;</span>
            </a>
          </div>
        </div>
      </section>

      <section id="detalles" className="vr-access">
        <div className="vr-access__copy">
          <h2>Disponible desde Meta.</h2>
          <p>
            El modo portero esta completo y listo para jugarse desde el acceso
            publicado en Meta.
          </p>
        </div>

        <div className="vr-checklist" aria-label="Caracteristicas del modo portero">
          {checkpoints.map((checkpoint) => (
            <span className="vr-check" key={checkpoint}>
              <span className="vr-check__icon" aria-hidden="true" />
              {checkpoint}
            </span>
          ))}
        </div>
      </section>

      <section className="vr-feature-grid" aria-label="Resumen del modo portero VR">
        {featureCards.map((feature) => (
          <article className="vr-feature" key={feature.title}>
            <span className="vr-feature__label">{feature.label}</span>
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
