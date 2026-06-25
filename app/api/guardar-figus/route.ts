const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyNGaazJFZUAMSaedBo9lvlElGH7m15o3UAewirax5pkvk3VN3sX7vfGNdh-8STHFTVtg/exec";

type FigusPayload = {
  dni?: unknown;
  nombreApellido?: unknown;
  celular?: unknown;
  pais?: unknown;
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
    const nombreApellido =
      typeof body.nombreApellido === "string"
        ? body.nombreApellido.trim()
        : "";
    const celular =
      typeof body.celular === "string" ? body.celular.trim() : "";
    const pais = typeof body.pais === "string" ? body.pais.trim() : "";
    const figuritas =
      typeof body.figuritas === "string" ? body.figuritas.trim() : "";

    console.log("[guardar-figus] Datos recibidos:", {
      dni,
      nombreApellido,
      celular,
      pais,
      figuritas,
    });

    if (!nombreApellido || !figuritas) {
      console.error("[guardar-figus] Validación fallida: faltan campos.");

      return Response.json(
        {
          success: false,
          error: "El nombre y las figuritas son obligatorios.",
        },
        { status: 400 },
      );
    }

    console.log("[guardar-figus] URL usada:", GOOGLE_SCRIPT_URL);

    const googlePayload = {
      dni,
      nombreApellido,
      celular,
      pais,
      figuritas,
    };

    console.log("[guardar-figus] JSON enviado:", googlePayload);

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(googlePayload),
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

    const googleResponse = JSON.parse(responseText) as {
      success?: boolean;
      error?: string;
    };

    if (!googleResponse.success) {
      return Response.json(
        {
          success: false,
          error:
            googleResponse.error ||
            "Google Apps Script no pudo guardar los datos.",
        },
        { status: 500 },
      );
    }

    return Response.json({ success: true, googleResponse });
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
