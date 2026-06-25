const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwN1tUmwe6qfURUMiRLwMBG_PxZOMgSD02eGupM6zQiHd6BPd_kvacSyPs7gtDvZF_Bnw/exec";

type FigusPayload = {
  dni?: unknown;
  celular?: unknown;
  figuritas?: unknown;
};

function extractGoogleError(responseText: string) {
  const messageMatch = responseText.match(
    /<p[^>]*class=["']errorMessage["'][^>]*>(.*?)<\/p>/i,
  );

  return messageMatch?.[1]
    ?.replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FigusPayload;
    const dni = typeof body.dni === "string" ? body.dni.trim() : "";
    const celular =
      typeof body.celular === "string" ? body.celular.trim() : "";
    const figuritas =
      typeof body.figuritas === "string" ? body.figuritas.trim() : "";

    console.log("[guardar-figus] Datos recibidos:", {
      dni,
      celular,
      figuritas,
    });

    if (!dni || !celular || !figuritas) {
      console.error("[guardar-figus] Validación fallida: faltan campos.");

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

    const responseText = await response.text();

    console.log("[guardar-figus] Respuesta de Google Apps Script:", {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      body: responseText,
    });

    if (!response.ok) {
      const responseMessage = extractGoogleError(responseText);
      const googleError = [
        `Google Apps Script respondió con estado ${response.status}`,
        response.statusText,
        responseMessage,
      ]
        .filter(Boolean)
        .join(" - ");

      console.error("[guardar-figus] Google Apps Script falló:", googleError);

      return Response.json(
        {
          success: false,
          error: googleError,
        },
        { status: 500 },
      );
    }

    return Response.json({ success: true, googleResponse: responseText });
  } catch (error) {
    console.error("[guardar-figus] Error exacto:", error);

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
