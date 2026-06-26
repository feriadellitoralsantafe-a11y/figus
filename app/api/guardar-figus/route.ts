const DEFAULT_GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyNGaazJFZUAMSaedBo9lvlElGH7m15o3UAewirax5pkvk3VN3sX7vfGNdh-8STHFTVtg/exec";
const GOOGLE_SCRIPT_URL =
  process.env.GOOGLE_SCRIPT_URL?.trim() || DEFAULT_GOOGLE_SCRIPT_URL;

type FigusPayload = {
  action?: unknown;
  accion?: unknown;
  dni?: unknown;
  nombreApellido?: unknown;
  celular?: unknown;
  pais?: unknown;
  figuritas?: unknown;
};

type GoogleResponse = {
  success?: boolean;
  exists?: boolean;
  participante?: {
    dni?: string;
    nombreApellido?: string;
    celular?: string;
    pais?: string;
    figuritas?: string;
  };
  updated?: boolean;
  error?: string;
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

function parseJsonSafely(responseText: string): GoogleResponse | null {
  try {
    return JSON.parse(responseText) as GoogleResponse;
  } catch {
    return null;
  }
}

function buildNonJsonError(responseText: string) {
  const compactBody = responseText.replace(/\s+/g, " ").trim();
  const looksLikeHtml = compactBody.startsWith("<!DOCTYPE") || compactBody.startsWith("<html");

  if (looksLikeHtml) {
    return "Google Apps Script devolvió HTML en vez de JSON. Revisá que la Web App esté implementada como pública, que la URL /exec sea correcta y que el Code.gs actualizado esté desplegado.";
  }

  return "Google Apps Script devolvió una respuesta que no es JSON válido.";
}

function normalizeAction(body: FigusPayload) {
  if (typeof body.action === "string" && body.action.trim()) {
    return body.action.trim();
  }

  if (typeof body.accion === "string" && body.accion.trim()) {
    return body.accion.trim();
  }

  return "guardarFigus";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FigusPayload;
    const action = normalizeAction(body);
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
      action,
      dni,
      nombreApellido,
      celular,
      pais,
      figuritas,
    });

    if (!["buscarPorDni", "guardarFigus"].includes(action)) {
      return Response.json(
        {
          success: false,
          error: "Acción no válida.",
        },
        { status: 400 },
      );
    }

    if (action === "buscarPorDni" && !dni) {
      return Response.json(
        {
          success: false,
          error: "El DNI es obligatorio.",
        },
        { status: 400 },
      );
    }

    if (action === "guardarFigus" && (!dni || !nombreApellido || !figuritas)) {
      console.error("[guardar-figus] Validación fallida: faltan campos.");

      return Response.json(
        {
          success: false,
          error: "El DNI, el nombre y las figuritas son obligatorios.",
        },
        { status: 400 },
      );
    }

    console.log("[guardar-figus] URL usada:", GOOGLE_SCRIPT_URL);

    if (!GOOGLE_SCRIPT_URL || !GOOGLE_SCRIPT_URL.startsWith("https://")) {
      return Response.json(
        {
          success: false,
          error:
            "La URL de Google Apps Script no está configurada correctamente.",
        },
        { status: 500 },
      );
    }

    const googlePayload = {
      action,
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

    const googleResponse = parseJsonSafely(responseText);

    if (!googleResponse) {
      const nonJsonError = buildNonJsonError(responseText);

      console.error("[guardar-figus] Respuesta no JSON:", {
        contentType: response.headers.get("content-type"),
        responseStart: responseText.slice(0, 300),
      });

      return Response.json(
        {
          success: false,
          error: nonJsonError,
          upstreamStatus: response.status,
          upstreamContentType: response.headers.get("content-type"),
        },
        { status: 502 },
      );
    }

    if (!googleResponse.success) {
      return Response.json(
        {
          success: false,
          error:
            googleResponse.error ||
            "Google Apps Script no pudo completar la operación.",
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      exists: googleResponse.exists,
      participante: googleResponse.participante,
      updated: googleResponse.updated,
      googleResponse,
    });
  } catch (error) {
    console.error("[guardar-figus] Error exacto:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "No pudimos procesar tus Figus.",
      },
      { status: 500 },
    );
  }
}
