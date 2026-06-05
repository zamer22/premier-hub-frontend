import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type InstructionStep = {
  // Emoji/ícono grande del paso (refuerzo visual).
  icon: string;
  // Texto del paso.
  text: string;
};

type GameInstructionsProps = {
  // Título mostrado en el encabezado del modal.
  title: string;
  // Pasos del tutorial, mostrados uno a uno en formato carrusel.
  steps: InstructionStep[];
  // Clases extra para posicionar el botón en el encabezado de cada juego.
  buttonClassName?: string;
};

// Botón de ayuda "!" + panel de instrucciones interactivo (carrusel) para los juegos del Arcade.
export default function GameInstructions({ title, steps, buttonClassName }: GameInstructionsProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const lastIndex = steps.length - 1;
  const goPrev = () => setIndex((current) => Math.max(0, current - 1));
  const goNext = () => setIndex((current) => Math.min(lastIndex, current + 1));

  // Abre el panel siempre desde el primer paso.
  const openPanel = () => {
    setIndex(0);
    setOpen(true);
  };

  // Bloquea el scroll del fondo y habilita navegación por teclado mientras el panel está abierto.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, lastIndex]);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={`Ver instrucciones: ${title}`}
        onClick={openPanel}
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#162b4d] bg-white text-lg font-black leading-none text-[#162b4d] shadow-sm transition-colors hover:border-[#cf275f] hover:text-[#cf275f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cf275f] ${buttonClassName ?? ""}`}
      >
        !
      </button>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/55 p-4"
              onClick={() => setOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="game-instructions-title"
                onClick={(event) => event.stopPropagation()}
                className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#dde3ec] bg-white shadow-2xl"
              >
                {/* Encabezado */}
                <div className="flex items-center justify-between gap-4 bg-[#162b4d] px-5 py-4">
                  <h2 id="game-instructions-title" className="text-base font-black text-white">
                    {title}
                  </h2>
                  <button
                    type="button"
                    aria-label="Cerrar instrucciones"
                    onClick={() => setOpen(false)}
                    className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-white/70 transition-colors hover:bg-white/15 hover:text-white"
                  >
                    ×
                  </button>
                </div>

                {/* Carrusel de pasos */}
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(-${index * 100}%)` }}
                  >
                    {steps.map((step, stepIndex) => (
                      <div
                        key={stepIndex}
                        aria-hidden={stepIndex !== index}
                        className="flex w-full shrink-0 flex-col items-center gap-4 px-7 py-8 text-center"
                      >
                        <span className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-[#cf275f]">
                          Paso {stepIndex + 1} de {steps.length}
                        </span>
                        <span
                          className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f1f4f9] text-4xl shadow-inner"
                          aria-hidden="true"
                        >
                          {step.icon}
                        </span>
                        <p className="text-[0.95rem] font-semibold leading-relaxed text-[#2b3a52]">
                          {step.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Controles: flechas + dots + acción */}
                <div className="flex items-center justify-between gap-3 border-t border-[#eef1f5] px-5 py-4">
                  <button
                    type="button"
                    aria-label="Paso anterior"
                    onClick={goPrev}
                    disabled={index === 0}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dde3ec] text-xl font-black text-[#162b4d] transition-colors hover:border-[#cf275f] hover:text-[#cf275f] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-[#dde3ec] disabled:hover:text-[#162b4d]"
                  >
                    ‹
                  </button>

                  <div className="flex flex-1 items-center justify-center gap-1.5">
                    {steps.map((_, dotIndex) => (
                      <button
                        key={dotIndex}
                        type="button"
                        aria-label={`Ir al paso ${dotIndex + 1}`}
                        aria-current={dotIndex === index}
                        onClick={() => setIndex(dotIndex)}
                        className={`h-2 rounded-full transition-all ${
                          dotIndex === index ? "w-5 bg-[#cf275f]" : "w-2 bg-[#cbd3df] hover:bg-[#9aa3b2]"
                        }`}
                      />
                    ))}
                  </div>

                  {index === lastIndex ? (
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="shrink-0 rounded-full bg-[#cf275f] px-5 py-2.5 text-sm font-black text-white shadow-md transition-colors hover:bg-[#b02050]"
                    >
                      Entendido
                    </button>
                  ) : (
                    <button
                      type="button"
                      aria-label="Paso siguiente"
                      onClick={goNext}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#162b4d] text-xl font-black text-white transition-colors hover:bg-[#cf275f]"
                    >
                      ›
                    </button>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
