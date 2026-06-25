"use client";

import { FormEvent, KeyboardEvent, useState } from "react";

type FormStatus = "idle" | "saving" | "success" | "error";

type SaveResponse = {
  success?: boolean;
  error?: string;
};

export default function FigusApp() {
  const [showForm, setShowForm] = useState(false);
  const [nombreApellido, setNombreApellido] = useState("");
  const [stickerInput, setStickerInput] = useState("");
  const [stickers, setStickers] = useState<string[]>([]);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  function resetStatus() {
    setSubmitError("");
    if (status !== "idle") setStatus("idle");
  }

  function handleAddStickers() {
    const entries = stickerInput
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (entries.length === 0) {
      setErrors((current) => ({
        ...current,
        sticker: "Ingresá al menos un número de figurita.",
      }));
      return;
    }

    if (entries.some((entry) => !/^\d+$/.test(entry))) {
      setErrors((current) => ({
        ...current,
        sticker: "Usá sólo números separados por coma.",
      }));
      return;
    }

    setStickers((current) => {
      const added = new Set(current);
      entries.forEach((entry) => added.add(entry));
      return Array.from(added);
    });
    setStickerInput("");
    setErrors((current) => ({
      ...current,
      sticker: "",
      figuritas: "",
    }));
    resetStatus();
  }

  function handleStickerKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddStickers();
    }
  }

  function removeSticker(stickerToRemove: string) {
    setStickers((current) =>
      current.filter((sticker) => sticker !== stickerToRemove),
    );
    resetStatus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!nombreApellido.trim()) {
      nextErrors.nombreApellido = "Ingresá tu nombre y apellido.";
    }
    if (stickers.length === 0) {
      nextErrors.figuritas = "Agregá al menos una figurita.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("saving");
    setSubmitError("");

    try {
      const payload = {
        dni: "",
        nombreApellido: nombreApellido.trim(),
        celular: "",
        pais: "",
        figuritas: stickers.join(", "),
      };

      const response = await fetch("/api/guardar-figus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => ({}))) as SaveResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            `La API respondió con estado ${response.status} ${response.statusText}.`,
        );
      }

      setNombreApellido("");
      setStickerInput("");
      setStickers([]);
      setStatus("success");
    } catch {
      setSubmitError("No pudimos guardar tus figus. Intentá de nuevo");
      setStatus("error");
    }
  }

  return (
    <main className="page-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className={`main-card ${showForm ? "main-card--expanded" : ""}`}>
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">
            F
          </span>
          <span className="brand-name">FIGUS</span>
          <span className="brand-venue">FERIA DEL LITORAL</span>
          <span className="edition">MUNDIAL 2026</span>
        </div>

        <div className="hero">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            LA COMUNIDAD DEL INTERCAMBIO
          </div>

          <h1>
            Intercambio de Figus
            <span>Mundial 2026.</span>
          </h1>

          <p className="subtitle">
            Cargá tus figus y encontrá con quién intercambiar.
          </p>

          {!showForm && (
            <div className="actions">
              <button
                type="button"
                className="button button-primary"
                onClick={() => setShowForm(true)}
              >
                <PlusIcon />
                Cargar Mis Figus
              </button>
            </div>
          )}
        </div>

        {showForm && (
          <div className="form-panel">
            <div className="form-heading">
              <div>
                <span className="step-label">TU COLECCIÓN</span>
                <h2>Cargá tus figus</h2>
              </div>
              <button
                type="button"
                className="close-button"
                aria-label="Cerrar formulario"
                onClick={() => {
                  setShowForm(false);
                  setStatus("idle");
                  setErrors({});
                  setSubmitError("");
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="field-row identity-row">
                <div className="field">
                  <label htmlFor="nombreApellido">Nombre y apellido</label>
                  <input
                    id="nombreApellido"
                    name="nombreApellido"
                    type="text"
                    autoComplete="name"
                    placeholder="Ej: Juan Pérez"
                    value={nombreApellido}
                    onChange={(event) => {
                      setNombreApellido(event.target.value);
                      setErrors((current) => ({
                        ...current,
                        nombreApellido: "",
                      }));
                      resetStatus();
                    }}
                    aria-invalid={Boolean(errors.nombreApellido)}
                  />
                  {errors.nombreApellido && (
                    <span className="field-error">
                      {errors.nombreApellido}
                    </span>
                  )}
                </div>
              </div>

              <div className="sticker-builder">
                <span className="sticker-builder-label">
                  Números de figuritas
                </span>

                <div className="sticker-entry-row">
                  <div className="field sticker-title-field">
                    <label htmlFor="sticker-numbers">Separados por coma</label>
                    <input
                      id="sticker-numbers"
                      name="sticker-numbers"
                      type="text"
                      placeholder="Ej: 11, 25, 140, 302"
                      value={stickerInput}
                      onChange={(event) => {
                        setStickerInput(event.target.value);
                        setErrors((current) => ({
                          ...current,
                          sticker: "",
                        }));
                        resetStatus();
                      }}
                      onKeyDown={handleStickerKeyDown}
                      aria-invalid={Boolean(errors.sticker)}
                    />
                  </div>

                  <button
                    type="button"
                    className="button add-sticker-button"
                    onClick={handleAddStickers}
                  >
                    <PlusIcon />
                    Agregar
                  </button>
                </div>

                {errors.sticker && (
                  <span className="field-error sticker-builder-error">
                    {errors.sticker}
                  </span>
                )}

                <div
                  className={`sticker-preview ${
                    stickers.length === 0 ? "sticker-preview--empty" : ""
                  }`}
                  aria-live="polite"
                >
                  {stickers.length > 0 ? (
                    stickers.map((sticker) => (
                      <span className="sticker-chip" key={sticker}>
                        {sticker}
                        <button
                          type="button"
                          aria-label={`Eliminar figurita ${sticker}`}
                          onClick={() => removeSticker(sticker)}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <span>Las figuritas que agregues aparecerán acá.</span>
                  )}
                </div>

                {errors.figuritas && (
                  <span className="field-error">{errors.figuritas}</span>
                )}
              </div>

              <button
                type="submit"
                className="button button-primary submit-button"
                disabled={status === "saving"}
              >
                {status === "saving" ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <SaveIcon />
                    Guardar
                  </>
                )}
              </button>

              <div className="status-space" aria-live="polite">
                {status === "success" && (
                  <p className="status-message status-success">
                    <CheckIcon />
                    Tus figus fueron guardadas correctamente
                  </p>
                )}
                {status === "error" && (
                  <p className="status-message status-error">
                    {submitError ||
                      "No pudimos guardar tus figus. Intentá de nuevo"}
                  </p>
                )}
              </div>
            </form>
          </div>
        )}

        <div className="card-footer">
          <span>HECHO PARA COLECCIONISTAS</span>
          <span className="footer-ball" aria-hidden="true">
            ◆
          </span>
          <span>ARGENTINA</span>
        </div>
      </section>
    </main>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4h12l2 2v14H5z" />
      <path d="M8 4v6h8V4M8 20v-6h8v6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}
