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
        {
          success: false,
          error: "Todos los campos son obligatorios.",
        },
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
        {
          success: false,
          error: `Google Apps Script respondió con estado ${response.status}.`,
        },
        { status: 500 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "No pudimos guardar tus figus.",
      },
      { status: 500 },
    );
  }
}
