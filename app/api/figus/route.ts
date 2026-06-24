const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwN1tUmwe6qfURUMiRLwMBG_PxZOMgSD02eGupM6zQiHd6BPd_kvacSyPs7gtDvZF_Bnw/exec";

type FigusPayload = {
  dni?: unknown;
  celular?: unknown;
  figuritas?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FigusPayload;
    const dni = typeof body.dni === "string" ? body.dni.trim() : "";
    const celular =
      typeof body.celular === "string" ? body.celular.trim() : "";
    const figuritas =
      typeof body.figuritas === "string" ? body.figuritas.trim() : "";

    if (!dni || !celular || !figuritas) {
      return Response.json(
        { ok: false, message: "Todos los campos son obligatorios." },
        { status: 400 },
      );
    }

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dni, celular, figuritas }),
      cache: "no-store",
    });

    if (!response.ok) {
      return Response.json(
        { ok: false, message: "El servicio externo rechazó la solicitud." },
        { status: 502 },
      );
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { ok: false, message: "No se pudieron guardar las figuritas." },
      { status: 500 },
    );
  }
}
