import Link from "next/link";

export const metadata = {
  title: "Buscar Figus | Mundial 2026",
};

export default function BuscarPage() {
  return (
    <main className="page-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="main-card search-card">
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">
            F
          </span>
          <span className="brand-name">FIGUS</span>
          <span className="edition">MUNDIAL 2026</span>
        </div>

        <div className="search-content">
          <Link href="/" className="back-link">
            <span aria-hidden="true">←</span> Volver
          </Link>

          <div className="eyebrow">
            <span className="eyebrow-dot" />
            ENCONTRÁ ESA FIGU
          </div>
          <h1>
            Buscar <span>Figus.</span>
          </h1>
          <p className="subtitle">
            Ingresá el código o número de la figurita que necesitás.
          </p>

          <div className="search-box">
            <label htmlFor="figurita-buscada">Figurita</label>
            <div className="search-input-wrap">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                id="figurita-buscada"
                type="search"
                placeholder="Ej: ARG 10"
              />
            </div>
          </div>

          <div className="coming-soon">
            <span className="coming-icon" aria-hidden="true">
              ✦
            </span>
            <div>
              <strong>Próximamente</strong>
              <p>Estamos preparando el buscador de intercambios.</p>
            </div>
          </div>
        </div>

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
