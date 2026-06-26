"use client";

import { FormEvent, KeyboardEvent, useState } from "react";

type FormStatus = "idle" | "searching" | "saving" | "success" | "error";
type Mode = "new" | "edit";

type ApiResponse = {
  success?: boolean;
  exists?: boolean;
  participante?: {
    dni?: string;
    nombreApellido?: string;
    figuritas?: string;
  };
  error?: string;
};

function normalizeDni(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeStickers(value: string) {
  const seen = new Set<string>();

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => {
      if (seen.has(entry)) return false;
      seen.add(entry);
      return true;
    });
}

async function readApiResponse(response: Response) {
  const responseText = await response.text();

  try {
    return JSON.parse(responseText) as ApiResponse;
  } catch {
    return {
      success: false,
      error:
        "La respuesta del servidor no fue JSON válido. Revisá la URL de la API o del Google Apps Script.",
    };
  }
}

export default function FigusApp() {
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  const [dni, setDni] = useState("");
  const [nombreApellido, setNombreApellido] = useState("");
  const [stickerInput, setStickerInput] = useState("");
  const [stickers, setStickers] = useState<string[]>([]);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const isEditing = mode === "edit";

  function resetStatus() {
    setSubmitError("");
    if (status !== "idle") setStatus("idle");
  }

  function resetFlow() {
    setMode(null);
    setDni("");
    setNombreApellido("");
    setStickerInput("");
    setStickers([]);
    setStatus("idle");
    setErrors({});
    setSubmitError("");
  }

  function handleAddStickers() {
    const entries = normalizeStickers(stickerInput);

    if (entries.length === 0) {
      setErrors((current) => ({
        ...current,
        sticker: "Ingresá al menos un número de Figu.",
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

  async function handleDniSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedDni = normalizeDni(dni);
    if (!normalizedDni) {
      setErrors({ dni: "Ingresá tu DNI." });
      return;
    }

    setStatus("searching");
    setSubmitError("");
    setErrors({});

    try {
      const response = await fetch("/api/guardar-figus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "buscarPorDni", dni: normalizedDni }),
      });

      const result = await readApiResponse(response);

      if (!response.ok || !result.success) {
        throw new Error(result.error || "No pudimos consultar ese DNI.");
      }

      setDni(normalizedDni);

      if (result.exists && result.participante) {
        setMode("edit");
        setNombreApellido(result.participante.nombreApellido || "");
        setStickers(normalizeStickers(result.participante.figuritas || ""));
      } else {
        setMode("new");
        setNombreApellido("");
        setStickers([]);
      }

      setStatus("idle");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No pudimos consultar ese DNI.",
      );
      setStatus("error");
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const normalizedDni = normalizeDni(dni);

    if (!normalizedDni) {
      nextErrors.dni = "Ingresá tu DNI.";
    }
    if (!nombreApellido.trim()) {
      nextErrors.nombreApellido = "Ingresá tu nombre y apellido.";
    }
    if (stickers.length === 0) {
      nextErrors.figuritas = "Agregá al menos una Figu.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("saving");
    setSubmitError("");

    try {
      const payload = {
        action: "guardarFigus",
        dni: normalizedDni,
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

      const result = await readApiResponse(response);

      if (!response.ok || !result.success) {
        throw new Error(result.error || "No pudimos guardar tus Figus.");
      }

      setDni(normalizedDni);
      setMode("edit");
      setStatus("success");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No pudimos guardar tus Figus. Intentá de nuevo.",
      );
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
            Cargá tus Figus y encontrá con quién intercambiar.
          </p>

          {!showForm && (
            <div className="actions">
              <button
                type="button"
                className="button button-primary"
                onClick={() => setShowForm(true)}
              >
                <PlusIcon />
                Cargar / modificar mis Figus
              </button>
            </div>
          )}
        </div>

        {showForm && (
          <div className="form-panel">
            <div className="form-heading">
              <div>
                <span className="step-label">TU COLECCIÓN</span>
                <h2>
                  {mode
                    ? isEditing
                      ? "Modificar mis Figus"
                      : "Cargar mis Figus"
                    : "Ingresá tu DNI"}
                </h2>
              </div>
              <button
                type="button"
                className="close-button"
                aria-label="Cerrar formulario"
                onClick={() => {
                  setShowForm(false);
                  resetFlow();
                }}
              >
                ×
              </button>
            </div>

            {!mode ? (
              <form onSubmit={handleDniSubmit} noValidate>
                <div className="field">
                  <label htmlFor="dni">Ingresá tu DNI</label>
                  <input
                    id="dni"
                    name="dni"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Ej: 30123456"
                    value={dni}
                    onChange={(event) => {
                      setDni(event.target.value);
                      setErrors((current) => ({ ...current, dni: "" }));
                      resetStatus();
                    }}
                    aria-invalid={Boolean(errors.dni)}
                  />
                  {errors.dni && (
                    <span className="field-error">{errors.dni}</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="button button-primary submit-button"
                  disabled={status === "searching"}
                >
                  {status === "searching" ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <ArrowRightIcon />
                      Siguiente
                    </>
                  )}
                </button>

                <StatusMessage status={status} submitError={submitError} />
              </form>
            ) : (
              <form onSubmit={handleSave} noValidate>
                {isEditing && (
                  <p className="section-note">
                    Estas son tus Figus cargadas.
                  </p>
                )}

                <div className="field-row identity-row">
                  <div className="field">
                    <label htmlFor="dni-confirm">DNI / Documento</label>
                    <input
                      id="dni-confirm"
                      name="dni"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="Ej: 30123456"
                      value={dni}
                      readOnly={isEditing}
                      onChange={(event) => {
                        setDni(event.target.value);
                        setErrors((current) => ({
                          ...current,
                          dni: "",
                        }));
                        resetStatus();
                      }}
                      aria-invalid={Boolean(errors.dni)}
                    />
                    {errors.dni && (
                      <span className="field-error">{errors.dni}</span>
                    )}
                  </div>

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
                    {isEditing ? "Figus cargadas" : "Números de Figus"}
                  </span>

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
                            aria-label={`Eliminar Figu ${sticker}`}
                            onClick={() => removeSticker(sticker)}
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <span>Las Figus que agregues aparecerán acá.</span>
                    )}
                  </div>

                  {errors.figuritas && (
                    <span className="field-error">{errors.figuritas}</span>
                  )}

                  <div className="sticker-entry-row add-more-row">
                    <div className="field sticker-title-field">
                      <label htmlFor="sticker-numbers">
                        Agregar Figus separadas por coma
                      </label>
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
                      {isEditing ? "Guardar cambios" : "Guardar"}
                    </>
                  )}
                </button>

                <StatusMessage
                  status={status}
                  submitError={submitError}
                  successText={
                    isEditing
                      ? "Tus cambios fueron guardados correctamente"
                      : "Tus Figus fueron guardadas correctamente"
                  }
                />
              </form>
            )}
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

function StatusMessage({
  status,
  submitError,
  successText = "Listo.",
}: {
  status: FormStatus;
  submitError: string;
  successText?: string;
}) {
  return (
    <div className="status-space" aria-live="polite">
      {status === "success" && (
        <p className="status-message status-success">
          <CheckIcon />
          {successText}
        </p>
      )}
      {status === "error" && (
        <p className="status-message status-error">
          {submitError || "No pudimos completar la acción. Intentá de nuevo."}
        </p>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
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
