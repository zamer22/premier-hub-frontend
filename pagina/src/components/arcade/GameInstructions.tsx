import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type InstructionStep = {
  // Título corto del paso.
  titulo: string;
  // Detalle/explicación del paso.
  detalle: string;
};

type GameInstructionsProps = {
  // Título mostrado en el encabezado del modal.
  title: string;
  // Intro opcional antes de la lista de pasos.
  intro?: string;
  // Pasos del tutorial, en lista numerada (mismo formato que el Lab).
  steps: InstructionStep[];
  // Clases extra para posicionar el botón en el encabezado de cada juego.
  buttonClassName?: string;
};

// Botón de ayuda "!" + modal de instrucciones en pasos numerados para los juegos del Arcade.
export default function GameInstructions({ title, intro, steps, buttonClassName }: GameInstructionsProps) {
  const [open, setOpen] = useState(false);

  // Bloquea el scroll del fondo y cierra con Escape mientras el modal está abierto.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={`Ver instrucciones: ${title}`}
        onClick={() => setOpen(true)}
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
                className="flex max-h-[85vh] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-[#dde3ec] bg-white shadow-2xl"
              >
                {/* Encabezado */}
                <div className="flex items-start justify-between gap-3 px-6 pb-2 pt-5">
                  <h2 id="game-instructions-title" className="m-0 text-[1.1rem] font-black text-[#162b4d]">
                    {title}
                  </h2>
                  <button
                    type="button"
                    aria-label="Cerrar instrucciones"
                    onClick={() => setOpen(false)}
                    className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-[#9aa3b2] transition-colors hover:bg-[#f1f4f9] hover:text-[#162b4d]"
                  >
                    ×
                  </button>
                </div>

                {intro ? (
                  <p className="mx-6 mb-1 text-[0.84rem] font-semibold leading-relaxed text-[#5f6c80]">
                    {intro}
                  </p>
                ) : null}

                {/* Lista de pasos numerados */}
                <ol className="m-0 grid list-none gap-3 overflow-y-auto px-6 pb-6 pt-2">
                  {steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#cf275f] text-[0.78rem] font-black text-white">
                        {stepIndex + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 mb-0.5 text-[0.88rem] font-extrabold leading-tight text-[#162b4d]">
                          {step.titulo}
                        </p>
                        <p className="m-0 text-[0.8rem] font-medium leading-relaxed text-[#5f6c80]">
                          {step.detalle}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
