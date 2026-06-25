"use client";

import { FormEvent, useState } from "react";

type FormStatus = "idle" | "saving" | "success" | "error";

type SaveResponse = {
  success?: boolean;
  error?: string;
};

const initialForm = {
  dni: "",
  celular: "",
  figuritas: "",
};

export default function FigusApp() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmitError("");
    if (status !== "idle") setStatus("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!form.dni.trim()) nextErrors.dni = "Ingresá tu DNI.";
    if (!form.celular.trim()) nextErrors.celular = "Ingresá tu celular.";
    if (!form.figuritas.trim()) {
      nextErrors.figuritas = "Ingresá al menos una figurita.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("saving");
    setSubmitError("");

    try {
      const response = await fetch("/api/guardar-figus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dni: form.dni.trim(),
          celular: form.celular.trim(),
          figuritas: form.figuritas.trim(),
        }),
      });

      const result = (await response.json().catch(() => ({}))) as SaveResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            `La API respondió con estado ${response.status} ${response.statusText}.`,
        );
      }

      setForm(initialForm);
      setStatus("success");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No pudimos guardar tus figus. Intentá de nuevo",
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
              <div className="field-row">
                <div className="field">
                  <label htmlFor="dni">DNI</label>
                  <input
                    id="dni"
                    name="dni"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Ej: 30123456"
                    value={form.dni}
                    onChange={(event) => updateField("dni", event.target.value)}
                    aria-invalid={Boolean(errors.dni)}
                  />
                  {errors.dni && <span className="field-error">{errors.dni}</span>}
                </div>

                <div className="field">
                  <label htmlFor="celular">Celular</label>
                  <input
                    id="celular"
                    name="celular"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Ej: 11 2345 6789"
                    value={form.celular}
                    onChange={(event) =>
                      updateField("celular", event.target.value)
                    }
                    aria-invalid={Boolean(errors.celular)}
                  />
                  {errors.celular && (
                    <span className="field-error">{errors.celular}</span>
                  )}
                </div>
              </div>

              <div className="field">
                <label htmlFor="figuritas">Figuritas que tengo</label>
                <textarea
                  id="figuritas"
                  name="figuritas"
                  rows={3}
                  placeholder="Ej: ARG 01, BRA 12, ESP 08"
                  value={form.figuritas}
                  onChange={(event) =>
                    updateField("figuritas", event.target.value)
                  }
                  aria-invalid={Boolean(errors.figuritas)}
                />
                <div className="field-meta">
                  {errors.figuritas ? (
                    <span className="field-error">{errors.figuritas}</span>
                  ) : (
                    <span>Separalas por coma</span>
                  )}
                </div>
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
                    Guardar Mis Figus
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
