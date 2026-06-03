import heroImage from "../../assets/vr-alpha-hero.png";
import "./VrArena.css";

const ALPHA_ACCESS_URL = "https://www.meta.com/s/cBrqPyVuj";
const hasAlphaAccess = ALPHA_ACCESS_URL.trim().length > 0;

const featureCards = [
  {
    label: "Modo alpha",
    title: "Acceso cerrado",
    text: "La entrada al build se controla desde un link directo para mantener pruebas ordenadas.",
  },
  {
    label: "VR Arena",
    title: "Estadio inmersivo",
    text: "Una experiencia pensada para entrar al campo, mirar jugadas y sentir la escala del estadio.",
  },
  {
    label: "Premier Hub",
    title: "Fans primero",
    text: "La pagina conecta el juego con la comunidad sin depender de cambios en backend o Docker.",
  },
] as const;

const checkpoints = [
  "Build alpha privado",
  "Acceso por invitacion",
  "Experiencia VR de futbol",
  "Pruebas con usuarios reales",
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
          <span className="vr-kicker">Premier Hub VR</span>
          <h1 id="vr-title" className="vr-hero__title">
            VR Arena Alpha
          </h1>
          <p className="vr-hero__lead">
            Entra a la primera version jugable de la experiencia VR de Premier
            Hub desde un acceso directo y privado.
          </p>

          <div className="vr-hero__actions">
            <a
              className={`vr-button vr-button--primary${
                hasAlphaAccess ? "" : " is-disabled"
              }`}
              href={hasAlphaAccess ? ALPHA_ACCESS_URL : undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!hasAlphaAccess}
              onClick={(event) => {
                if (!hasAlphaAccess) event.preventDefault();
              }}
            >
              {hasAlphaAccess ? "Abrir alpha" : "Link alpha pendiente"}
              <span aria-hidden="true">-&gt;</span>
            </a>
            <a className="vr-button vr-button--secondary" href="#detalles">
              Ver detalles
            </a>
          </div>
        </div>

        <div className="vr-hero__status" aria-label="Estado del alpha">
          <span className="vr-status-dot" />
          Alpha privada
        </div>
      </section>

      <section className="vr-feature-grid" aria-label="Resumen de VR Arena">
        {featureCards.map((feature) => (
          <article className="vr-feature" key={feature.title}>
            <span className="vr-feature__label">{feature.label}</span>
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
          </article>
        ))}
      </section>

      <section id="detalles" className="vr-access">
        <div className="vr-access__copy">
          <span className="vr-kicker">Acceso alpha</span>
          <h2>Un punto de entrada simple para probar el juego.</h2>
          <p>
            Esta pantalla vive completamente en el frontend. Cuando el link del
            build este listo, el boton principal mandara directo a la version
            alpha sin depender de cambios de infraestructura.
          </p>
        </div>

        <div className="vr-checklist" aria-label="Caracteristicas del alpha">
          {checkpoints.map((checkpoint) => (
            <span className="vr-check" key={checkpoint}>
              <span className="vr-check__icon" aria-hidden="true" />
              {checkpoint}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
