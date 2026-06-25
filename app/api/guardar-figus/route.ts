const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyNGaazJFZUAMSaedBo9lvlElGH7m15o3UAewirax5pkvk3VN3sX7vfGNdh-8STHFTVtg/exec";

type FigusPayload = {
  dni?: unknown;
  celular?: unknown;
  figuritas?: unknown;
};

const GOOGLE_FETCH_ATTEMPTS = 2;

function extractGoogleError(responseText: string) {
  const messageMatch = responseText.match(
    /<p[^>]*class=["']errorMessage["'][^>]*>(.*?)<\/p>/i,
  );

  return messageMatch?.[1]
    ?.replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

async function postToGoogle(payload: {
  dni: string;
  celular: string;
  figuritas: string;
}) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= GOOGLE_FETCH_ATTEMPTS; attempt += 1) {
    try {
      console.log(
        `[guardar-figus] Enviando a Google Apps Script. Intento ${attempt}/${GOOGLE_FETCH_ATTEMPTS}.`,
      );

      return await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        redirect: "follow",
      });
    } catch (error) {
      lastError = error;
      console.error(
        `[guardar-figus] Falló el intento ${attempt}/${GOOGLE_FETCH_ATTEMPTS}:`,
        error,
      );

      if (attempt < GOOGLE_FETCH_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Falló la conexión con Google Apps Script.");
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

    const response = await postToGoogle({ dni, celular, figuritas });

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
